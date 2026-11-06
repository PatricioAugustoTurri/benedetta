/**
 * Il biglietto da stampare: un PDF A4 con il codice in formato A6, alla
 * misura vera, da ritagliare e mettere nel pacco con la stampa.
 *
 * Si disegna nel browser, su un canvas, con i caratteri del sito già caricati
 * (Caprasimo per lo sconto, Geist per il resto) e il logotipo scritto a mano
 * come firma. Il PDF porta solo l'immagine, senza compressione con perdita:
 * a 300 punti per pollice il testo piccolo resta netto anche su una
 * stampante di casa. Niente librerie: il PDF è una pagina con un'immagine.
 *
 * In alto a destra, piccolo, il segno di casa: la ragazza con la stella
 * dell'apertura del sito, ridisegnata a linea (cliente, 2026-11-06), in
 * `public/biglietto-ragazza.png`. Il tratto è nell'inchiostro del sito su
 * fondo trasparente, così sulla carta resta solo la linea.
 *
 * Un A4 piegato due volte fa quattro A6. Un codice per tutti (BENZIBET98)
 * riempie il foglio con quattro copie; un codice personale ne mette una
 * sola, nell'angolo in alto a sinistra. In tutti e due i casi le tacche sui
 * bordi dicono dove tagliare.
 */

export type DatiBiglietto = {
  codice: string;
  percentuale: number;
  /** Vale per un ordine solo. */
  monouso: boolean;
  /** L'ultimo giorno in cui vale, «2027-02-04». Null: non scade. */
  scade: string | null;
  /** Il nome di chi lo riceve, per il biglietto di un ordine. */
  per?: string | null;
  /** Il minimo d'ordine perché valga, in centesimi. */
  minimo: number;
  /** Il sito, senza «https://»: dove si scrive il codice. */
  sito: string;
  instagram?: string;
};

const DPI = 300;
const MM = DPI / 25.4;
const A4 = { w: 210, h: 297 };
const CARTA = { w: A4.w / 2, h: A4.h / 2 };
const PT = DPI / 72;

const INK = "#1c1a16";
const INK_SOFT = "#55504a";
const INK_FAINT = "#6f6861";
/** Lo sconto in lilla (cliente, 2026-11-06). Numero e «%» hanno una tinta ciascuno, se un giorno li vuole diversi. */
const TINTA_NUMERO = "#9b7fc7";
const TINTA_PERCENTO = "#9b7fc7";
const SEGNO = "#b9b0a4";

const euro = (c: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: c % 100 ? 2 : 0 }).format(
    c / 100,
  );

function giorno(iso: string): string {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

/** La famiglia vera che next/font ha dato al carattere: un nome con hash. */
function famiglia(variabile: string, riserva: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(variabile).trim();
  return v ? `${v}, ${riserva}` : riserva;
}

function carica(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, ko) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => ko(new Error(`Immagine non caricata: ${src}`));
    img.src = src;
  });
}

/** Testo con spaziatura fra le lettere, che non tutti i canvas sanno fare. */
function larghezza(ctx: CanvasRenderingContext2D, testo: string, spazio: number): number {
  return ctx.measureText(testo).width + spazio * Math.max(0, [...testo].length - 1);
}
function scriviSpaziato(ctx: CanvasRenderingContext2D, testo: string, x: number, y: number, spazio: number) {
  if (!spazio) return ctx.fillText(testo, x, y);
  let cx = x;
  for (const c of testo) {
    ctx.fillText(c, cx, y);
    cx += ctx.measureText(c).width + spazio;
  }
}

/** Va a capo a parole dentro `max`; restituisce le righe. */
function aCapo(ctx: CanvasRenderingContext2D, testo: string, max: number): string[] {
  const righe: string[] = [];
  let riga = "";
  for (const parola of testo.split(" ")) {
    const prova = riga ? `${riga} ${parola}` : parola;
    if (riga && ctx.measureText(prova).width > max) {
      righe.push(riga);
      riga = parola;
    } else riga = prova;
  }
  if (riga) righe.push(riga);
  return righe;
}

type Caratteri = { titolo: string; testo: string };

/** Un biglietto A6 con l'angolo in alto a sinistra in (x, y), in pixel. */
function disegnaBiglietto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  d: DatiBiglietto,
  f: Caratteri,
  firma: HTMLImageElement,
  lamina: HTMLImageElement,
) {
  const m = 11 * MM;
  const sx = x + m;
  const largo = CARTA.w * MM - 2 * m;
  let cy = y + m;

  // La ragazza con la stella, a linea, nell'angolo in alto a destra.
  const lw = 23 * MM;
  const lh = (lw * lamina.naturalHeight) / lamina.naturalWidth;
  ctx.drawImage(lamina, sx + largo - lw, cy, lw, lh);
  // Quello che le sta accanto non deve toccarla.
  const accanto = largo - lw - 4 * MM;
  const sottoLamina = cy + lh;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // Per chi: solo i biglietti degli ordini.
  if (d.per) {
    ctx.fillStyle = INK_SOFT;
    ctx.font = `400 ${10 * PT}px ${f.testo}`;
    cy += 10 * PT;
    ctx.fillText(`Per ${d.per}`, sx, cy, accanto);
    cy += 6 * MM;
  } else {
    cy += 2 * MM;
  }

  // Lo sconto: la cosa che si legge da lontano.
  let corpo = 92 * PT;
  const sconto = `−${d.percentuale}%`;
  ctx.font = `400 ${corpo}px ${f.titolo}`;
  while (ctx.measureText(sconto).width > accanto && corpo > 40 * PT) {
    corpo -= 2 * PT;
    ctx.font = `400 ${corpo}px ${f.titolo}`;
  }
  const alto = ctx.measureText(sconto).actualBoundingBoxAscent;
  cy += alto;
  // Il numero e il «%» si scrivono a parte, ognuno nella sua tinta.
  const numero = `−${d.percentuale}`;
  ctx.fillStyle = TINTA_NUMERO;
  ctx.fillText(numero, sx - corpo * 0.03, cy);
  ctx.fillStyle = TINTA_PERCENTO;
  ctx.fillText("%", sx - corpo * 0.03 + ctx.measureText(numero).width, cy);

  ctx.fillStyle = INK;
  ctx.font = `400 ${12.5 * PT}px ${f.testo}`;
  cy += 9 * MM;
  ctx.fillText(d.monouso ? "sul tuo prossimo ordine" : "sulle stampe del sito", sx, cy, largo);

  // Il codice, fra due fili, grande e spaziato: si copia a occhio. Mai più su della lamina.
  cy = Math.max(cy + 9 * MM, sottoLamina + 6 * MM);
  ctx.fillStyle = SEGNO;
  ctx.fillRect(sx, cy, largo, Math.max(1, 0.5 * PT));
  let cc = 24 * PT;
  const spazio = (k: number) => k * 0.1;
  ctx.font = `500 ${cc}px ${f.testo}`;
  while (larghezza(ctx, d.codice, spazio(cc)) > largo && cc > 9 * PT) {
    cc -= 1 * PT;
    ctx.font = `500 ${cc}px ${f.testo}`;
  }
  ctx.fillStyle = INK;
  const capo = ctx.measureText("H").actualBoundingBoxAscent;
  cy += 6 * MM + capo;
  scriviSpaziato(ctx, d.codice, sx, cy, spazio(cc));
  cy += 6 * MM;
  ctx.fillStyle = SEGNO;
  ctx.fillRect(sx, cy, largo, Math.max(1, 0.5 * PT));

  // Come si usa.
  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 ${9 * PT}px ${f.testo}`;
  const riga = 13.5 * PT;
  cy += 5 * MM;
  for (const r of aCapo(ctx, `Scrivilo nel carrello, prima di pagare, su ${d.sito}`, largo)) {
    cy += riga;
    ctx.fillText(r, sx, cy);
  }

  // Le condizioni, piccole.
  const vale = [d.monouso && "Vale una volta sola", d.scade && `${d.monouso ? "fino" : "Vale fino"} al ${giorno(d.scade)}`]
    .filter(Boolean)
    .join(", ");
  const condizioni = `Per ordini da ${euro(d.minimo)} in su. ${vale ? `${vale}. ` : ""}Non si somma agli sconti in corso e non vale sulla spedizione.`;
  ctx.fillStyle = INK_FAINT;
  ctx.font = `400 ${7.5 * PT}px ${f.testo}`;
  cy += 3 * MM;
  for (const r of aCapo(ctx, condizioni, largo)) {
    cy += 11 * PT;
    ctx.fillText(r, sx, cy);
  }

  // La firma: «Grazie» e il logotipo scritto a mano, in fondo.
  const fondo = y + CARTA.h * MM - m;
  const fw = 34 * MM;
  const fh = (fw * firma.naturalHeight) / firma.naturalWidth;
  ctx.drawImage(firma, sx, fondo - fh, fw, fh);
  ctx.fillStyle = INK;
  ctx.font = `400 ${10 * PT}px ${f.testo}`;
  ctx.fillText("Grazie,", sx, fondo - fh - 3 * MM);
  if (d.instagram) {
    ctx.fillStyle = INK_FAINT;
    ctx.font = `400 ${7.5 * PT}px ${f.testo}`;
    ctx.textAlign = "right";
    ctx.fillText(d.instagram, sx + largo, fondo - 1 * MM);
    ctx.textAlign = "left";
  }
}

/** Le tacche di taglio sulle linee che dividono il foglio, sui bordi e al centro. */
function tacche(ctx: CanvasRenderingContext2D, quattro: boolean) {
  ctx.strokeStyle = SEGNO;
  ctx.lineWidth = Math.max(1, 0.5 * PT);
  const cx = (A4.w / 2) * MM;
  const cy = (A4.h / 2) * MM;
  const W = A4.w * MM;
  const H = A4.h * MM;
  const l = 9 * MM;
  const linee: [number, number, number, number][] = [
    [cx, 0, cx, l],
    [0, cy, l, cy],
  ];
  if (quattro) {
    linee.push([cx, H - l, cx, H], [W - l, cy, W, cy], [cx - 4 * MM, cy, cx + 4 * MM, cy], [cx, cy - 4 * MM, cx, cy + 4 * MM]);
  } else {
    // Un biglietto solo: le tacche anche dalla parte del foglio che resta bianca.
    linee.push([cx, cy - 4 * MM, cx, cy + 4 * MM], [cx - 4 * MM, cy, cx + 4 * MM, cy]);
  }
  ctx.beginPath();
  for (const [a, b, c, e] of linee) {
    ctx.moveTo(a, b);
    ctx.lineTo(c, e);
  }
  ctx.stroke();
}

/** Disegna il foglio A4 intero. */
export async function disegnaFoglio(
  d: DatiBiglietto,
  firmaSrc: string,
  laminaSrc: string,
): Promise<HTMLCanvasElement> {
  const f: Caratteri = {
    titolo: famiglia("--font-caprasimo", "Georgia, serif"),
    testo: famiglia("--font-geist", "system-ui, sans-serif"),
  };
  await Promise.all([
    document.fonts.load(`400 40px ${f.titolo}`, `−0123456789%`),
    document.fonts.load(`400 40px ${f.testo}`),
    document.fonts.load(`500 40px ${f.testo}`),
  ]);
  const [firma, lamina] = await Promise.all([carica(firmaSrc), carica(laminaSrc)]);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(A4.w * MM);
  canvas.height = Math.round(A4.h * MM);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const quattro = !d.monouso;
  const posti = quattro
    ? [
        [0, 0],
        [CARTA.w, 0],
        [0, CARTA.h],
        [CARTA.w, CARTA.h],
      ]
    : [[0, 0]];
  for (const [px, py] of posti) disegnaBiglietto(ctx, px * MM, py * MM, d, f, firma, lamina);
  tacche(ctx, quattro);
  return canvas;
}

/* ----------------------------------------------------------- il PDF */

const testo = (s: string) => new TextEncoder().encode(s);

async function comprimi(dati: Uint8Array): Promise<Uint8Array> {
  // «deflate» qui è lo zlib che il PDF chiama FlateDecode.
  const flusso = new Blob([dati as BlobPart]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(flusso).arrayBuffer());
}

/** Una pagina A4 con il canvas a tutta pagina. */
export async function pdfDaCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  const { width: w, height: h } = canvas;
  const rgba = canvas.getContext("2d")!.getImageData(0, 0, w, h).data;
  const rgb = new Uint8Array(w * h * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    rgb[j] = rgba[i];
    rgb[j + 1] = rgba[i + 1];
    rgb[j + 2] = rgba[i + 2];
  }
  const immagine = await comprimi(rgb);
  const pw = ((A4.w / 25.4) * 72).toFixed(2);
  const ph = ((A4.h / 25.4) * 72).toFixed(2);
  const contenuto = testo(`q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`);

  const oggetti: Uint8Array[][] = [
    [testo("<< /Type /Catalog /Pages 2 0 R >>")],
    [testo("<< /Type /Pages /Kids [3 0 R] /Count 1 >>")],
    [
      testo(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`,
      ),
    ],
    [testo(`<< /Length ${contenuto.length} >>\nstream\n`), contenuto, testo("\nendstream")],
    [
      testo(
        `<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${immagine.length} >>\nstream\n`,
      ),
      immagine,
      testo("\nendstream"),
    ],
  ];

  const parti: Uint8Array[] = [testo("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")];
  let posizione = parti[0].length;
  const xref: number[] = [];
  oggetti.forEach((pezzi, i) => {
    xref.push(posizione);
    const tutto = [testo(`${i + 1} 0 obj\n`), ...pezzi, testo("\nendobj\n")];
    for (const p of tutto) {
      parti.push(p);
      posizione += p.length;
    }
  });
  const tabella =
    `xref\n0 ${oggetti.length + 1}\n0000000000 65535 f \n` +
    xref.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("") +
    `trailer\n<< /Size ${oggetti.length + 1} /Root 1 0 R >>\nstartxref\n${posizione}\n%%EOF\n`;
  parti.push(testo(tabella));
  return new Blob(parti as BlobPart[], { type: "application/pdf" });
}

/** Disegna, impagina e scarica: «biglietto-BEN-7K2M.pdf». */
export async function scaricaBiglietto(d: DatiBiglietto, firmaSrc: string, laminaSrc: string): Promise<void> {
  const pdf = await pdfDaCanvas(await disegnaFoglio(d, firmaSrc, laminaSrc));
  const url = URL.createObjectURL(pdf);
  const a = document.createElement("a");
  a.href = url;
  a.download = `biglietto-${d.codice}.pdf`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
