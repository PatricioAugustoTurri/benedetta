import QRCode from "qrcode";
import {
  A4,
  aCapo,
  CARTA,
  carica,
  famiglia,
  INK,
  INK_FAINT,
  INK_SOFT,
  MM,
  pdfDaCanvas,
  PT,
  tacche,
} from "@/lib/bigliettoPdf";

/**
 * La cartolina della recensione: un A6 da mettere nel pacco, con il QR che
 * porta alla pagina /recensione/<chiave> di quell'ordine (cliente,
 * 2026-11-22). Chi la trova inquadra il codice con il telefono e lascia
 * stelle e due righe, senza account.
 *
 * È sorella del biglietto dello sconto (`bigliettoPdf.ts`) e ne prende
 * tutto: il foglio A4 con l'A6 nell'angolo e le tacche per tagliare, i
 * caratteri del sito, la ragazza con la stella a linea, la firma scritta a
 * mano e il PDF senza librerie. Il QR si disegna a quadretti pieni
 * nell'inchiostro del sito, non in nero: sulla carta si legge uguale.
 *
 * La stessa cartolina serve a chi ha comprato fuori dal sito (2026-11-27):
 * accanto al QR, al posto del numero d'ordine, il titolo del prodotto. Per il
 * mercato ne entrano quattro in un foglio, ognuna con il suo QR —ogni invito
 * vale una volta—, e le tacche per tagliarle.
 */

export type DatiCartolina = {
  /** L'indirizzo completo della pagina di recensione dell'ordine. */
  link: string;
  /** L'ordine, per la cartolina del pacco. */
  ordine?: number;
  /** Il prodotto, per quella di chi ha comprato fuori dal sito. */
  prodotto?: string;
  /** Il nome di battesimo di chi ha comprato, se c'è. */
  per: string | null;
  /** Il sito, senza «https://», scritto sotto il codice. */
  sito: string;
  instagram?: string;
};

/** I quattro A6 di un A4, da sinistra a destra e dall'alto in basso, in millimetri. */
const POSTI = [
  [0, 0],
  [CARTA.w, 0],
  [0, CARTA.h],
  [CARTA.w, CARTA.h],
] as const;

async function disegnaCartoline(
  lista: DatiCartolina[],
  firmaSrc: string,
  laminaSrc: string,
): Promise<HTMLCanvasElement> {
  const titolo = famiglia("--font-caprasimo", "Georgia, serif");
  const testo = famiglia("--font-geist", "system-ui, sans-serif");
  // Se un carattere non carica —capita con quelli di riserva su un sistema
  // senza Arial— la cartolina si disegna lo stesso con quello che c'è.
  await Promise.all([
    document.fonts.load(`400 40px ${titolo}`, "Com’è andata?").catch(() => []),
    document.fonts.load(`400 40px ${testo}`).catch(() => []),
  ]);
  const [firma, lamina] = await Promise.all([carica(firmaSrc), carica(laminaSrc)]);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(A4.w * MM);
  canvas.height = Math.round(A4.h * MM);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  lista.slice(0, POSTI.length).forEach((d, i) => {
    ctx.save();
    ctx.translate(POSTI[i][0] * MM, POSTI[i][1] * MM);
    disegnaFaccia(ctx, d, { titolo, testo }, firma, lamina);
    ctx.restore();
  });
  tacche(ctx, lista.length > 1);
  return canvas;
}

/** Una cartolina, nell'A6 in alto a sinistra: chi chiama sposta il foglio. */
function disegnaFaccia(
  ctx: CanvasRenderingContext2D,
  d: DatiCartolina,
  { titolo, testo }: { titolo: string; testo: string },
  firma: HTMLImageElement,
  lamina: HTMLImageElement,
) {
  const m = 11 * MM;
  const sx = m;
  const largo = CARTA.w * MM - 2 * m;
  let cy = m;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // La ragazza con la stella, nell'angolo, come sul biglietto.
  const lw = 23 * MM;
  const lh = (lw * lamina.naturalHeight) / lamina.naturalWidth;
  ctx.drawImage(lamina, sx + largo - lw, cy, lw, lh);
  const accanto = largo - lw - 4 * MM;

  if (d.per) {
    ctx.fillStyle = INK_SOFT;
    ctx.font = `400 ${10 * PT}px ${testo}`;
    cy += 10 * PT;
    ctx.fillText(`Per ${d.per}`, sx, cy, accanto);
    cy += 5 * MM;
  } else {
    cy += 2 * MM;
  }

  // La domanda, grande, nel carattere dei titoli.
  ctx.fillStyle = INK;
  ctx.font = `400 ${26 * PT}px ${titolo}`;
  const passo = 30 * PT;
  for (const r of aCapo(ctx, "Com’è andata?", accanto)) {
    cy += passo;
    ctx.fillText(r, sx, cy);
  }

  // Cosa fare, in due righe.
  cy = Math.max(cy + 6 * MM, m + lh + 4 * MM);
  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 ${10 * PT}px ${testo}`;
  for (const r of aCapo(
    ctx,
    "Inquadra il codice e raccontami com’è: due righe e qualche stella, senza bisogno di account.",
    largo,
  )) {
    cy += 14.5 * PT;
    ctx.fillText(r, sx, cy);
  }

  // Il QR, con il margine bianco che chiede lo standard (quattro moduli).
  const qr = QRCode.create(d.link, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const lato = 38 * MM;
  const modulo = lato / (n + 8);
  const qx = sx - 4 * modulo;
  const qy = cy + 4 * MM;
  ctx.fillStyle = INK;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.get(r, c)) {
        // Un pelo più grande del modulo, perché fra due quadretti vicini non resti un filo bianco.
        ctx.fillRect(qx + (c + 4) * modulo, qy + (r + 4) * modulo, modulo + 0.6, modulo + 0.6);
      }
    }
  }

  // Accanto al QR, per chi non lo sa usare: il numero dell'ordine e il sito.
  const tx = qx + lato + 3 * MM;
  const tl = sx + largo - tx;
  ctx.fillStyle = INK_FAINT;
  ctx.font = `400 ${7.5 * PT}px ${testo}`;
  let ty = qy + lato - 4 * modulo - 2 * 11 * PT;
  // Il titolo di un prodotto può essere lungo: va a capo, al più in due righe,
  // e le righe salgono perché il sito resti sulla linea di fondo del QR.
  const accantoQr =
    d.ordine != null ? [`Ordine #${d.ordine}`] : d.prodotto ? aCapo(ctx, d.prodotto, tl).slice(0, 2) : [];
  ty -= (accantoQr.length - 1) * 11 * PT;
  for (const r of [...accantoQr, d.sito]) {
    ty += 11 * PT;
    ctx.fillText(r, tx, ty, tl);
  }

  // La firma in fondo: «Grazie,» e il logotipo scritto a mano.
  const fondo = CARTA.h * MM - m;
  const fw = 34 * MM;
  const fh = (fw * firma.naturalHeight) / firma.naturalWidth;
  ctx.drawImage(firma, sx, fondo - fh, fw, fh);
  ctx.fillStyle = INK;
  ctx.font = `400 ${10 * PT}px ${testo}`;
  ctx.fillText("Grazie,", sx, fondo - fh - 3 * MM);
  if (d.instagram) {
    ctx.fillStyle = INK_FAINT;
    ctx.font = `400 ${7.5 * PT}px ${testo}`;
    ctx.textAlign = "right";
    ctx.fillText(d.instagram, sx + largo, fondo - 1 * MM);
    ctx.textAlign = "left";
  }
}

/** Disegna, impagina e scarica: «recensione-ordine-12.pdf». */
export async function scaricaCartolina(d: DatiCartolina, firmaSrc: string, laminaSrc: string): Promise<void> {
  await scaricaCartoline([d], `recensione-ordine-${d.ordine}.pdf`, firmaSrc, laminaSrc);
}

/** Da una a quattro cartoline in un A4, con il nome di file che si chiede. */
export async function scaricaCartoline(
  lista: DatiCartolina[],
  nomeFile: string,
  firmaSrc: string,
  laminaSrc: string,
): Promise<void> {
  const pdf = await pdfDaCanvas(await disegnaCartoline(lista, firmaSrc, laminaSrc));
  const url = URL.createObjectURL(pdf);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeFile;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Solo l'immagine, per vederla prima di stamparla. */
export const disegnaCartolina = (d: DatiCartolina, firmaSrc: string, laminaSrc: string) =>
  disegnaCartoline([d], firmaSrc, laminaSrc);
