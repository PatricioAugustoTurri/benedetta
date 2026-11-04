/**
 * Il pennello dell'apertura: dipinge un'immagine su un canvas a pennellate,
 * come lei stenderebbe il colore su un fondo già preparato.
 *
 * Il trucco è uno solo: il pennello non porta un colore, porta l'immagine.
 * L'opera, già adattata al canvas come un `object-fit: cover`, diventa un
 * pattern, e ogni setola che passa scopre i pixel che ha sotto. Così non c'è
 * niente da ricomporre a ogni fotogramma: si aggiunge solo il pezzo di
 * pennellata nuovo, e il canvas tiene quello che è già dipinto.
 *
 * Una pennellata è una curva larga quanto il pennello, fatta di setole: ognuna
 * ha il suo spessore, la sua quantità di colore e un punto in cui resta a
 * secco. È quello che dà il segno rigato e il bordo sfrangiato invece di un
 * nastro pulito. Le pennellate cominciano dal punto che conta del disegno
 * —`fuoco`— e si allargano da lì verso i bordi.
 */

export type Pennellata = {
  /** Quando parte e quanto dura, in ms dall'inizio. */
  da: number;
  durata: number;
  /** Punti della curva di Bézier cubica, in pixel del canvas. */
  p0: [number, number];
  p1: [number, number];
  p2: [number, number];
  p3: [number, number];
  larghezza: number;
  /** Ondeggiamento perpendicolare: ampiezza in px e numero di onde. */
  onda: number;
  onde: number;
  fase: number;
  setole: Setola[];
};

type Setola = {
  /** Posizione nella larghezza del pennello, da -0.5 a 0.5. */
  posto: number;
  spessore: number;
  colore: number;
  /** Dove tocca la tela e dove resta a secco, da 0 a 1 lungo la pennellata. */
  inizio: number;
  secco: number;
  /** Ogni setola trema un poco per conto suo. */
  tremito: number;
};

/** Numeri casuali ripetibili: la stessa apertura ogni volta. */
function semi(seme: number) {
  let s = seme >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Le pennellate per un canvas `w`×`h`, a partire da `fuoco` (in frazioni di
 * larghezza e altezza): la stella e il viso.
 *
 * Non sono righe da un bordo all'altro —quelle sembrano una scansione, non
 * una mano—: sono colpi corti e un po' storti, uno per ogni casella di una
 * griglia larga quanto il pennello, spostati a caso dentro la casella. Si
 * stendono per distanza dal fuoco, con un po' di disordine, e partono uno
 * dopo l'altro in modo che ce ne siano sempre parecchi in corsa.
 */
export function progetta(
  w: number,
  h: number,
  durataTotale: number,
  fuoco: [number, number] = [0.4, 0.3],
): Pennellata[] {
  const caso = semi(20271104);
  const larghezza = Math.min(Math.max(Math.min(w, h) * 0.24, 90), 340);
  const casella = larghezza * 0.85;
  const colonne = Math.ceil(w / casella) + 1;
  const righe = Math.ceil(h / casella) + 1;
  const fx = fuoco[0] * w;
  const fy = fuoco[1] * h;
  const diagonale = Math.hypot(w, h);

  type Colpo = { cx: number; cy: number; ordine: number };
  const colpi: Colpo[] = [];
  for (let r = 0; r < righe; r++) {
    for (let c = 0; c < colonne; c++) {
      const cx = (c - 0.25 + caso() * 0.5) * casella;
      const cy = (r - 0.25 + caso() * 0.5) * casella;
      const distanza = Math.hypot(cx - fx, cy - fy) / diagonale;
      colpi.push({ cx, cy, ordine: distanza + caso() * 0.12 });
    }
  }
  colpi.sort((a, b) => a.ordine - b.ordine);

  const durata = Math.min(460, durataTotale * 0.3);
  const ultimo = durataTotale - durata;

  return colpi.map(({ cx, cy }, i) => {
    // Quasi orizzontali, un po' in salita come una mano destra, e ogni tanto
    // un colpo di ritorno.
    const angolo = -0.22 + (caso() - 0.5) * 0.7 + (caso() < 0.3 ? Math.PI : 0);
    const lungo = larghezza * (1.5 + caso() * 1.3);
    const dx = (Math.cos(angolo) * lungo) / 2;
    const dy = (Math.sin(angolo) * lungo) / 2;
    const p0: [number, number] = [cx - dx, cy - dy];
    const p3: [number, number] = [cx + dx, cy + dy];
    // Un arco leggero, perpendicolare alla direzione del colpo.
    const arco = (caso() - 0.5) * larghezza * 0.6;
    const nx = -Math.sin(angolo) * arco;
    const ny = Math.cos(angolo) * arco;

    const setole: Setola[] = Array.from({ length: 34 }, () => {
      // Più setole al centro che ai bordi: il pennello carico è pieno in
      // mezzo e sfrangiato fuori.
      const posto = (caso() + caso() - 1) * 0.62;
      const bordo = Math.abs(posto) * 2;
      return {
        posto,
        spessore: (larghezza / 34) * (3 + caso() * 2.6) * (1 - bordo * 0.35),
        colore: (0.55 + caso() * 0.45) * (1 - bordo * 0.3),
        inizio: caso() * 0.06 + bordo * caso() * 0.12,
        secco: 1 - bordo * caso() * 0.3 - caso() * 0.06,
        tremito: caso() * Math.PI * 2,
      };
    });

    return {
      da: (i / Math.max(1, colpi.length - 1)) * ultimo,
      durata: durata * (0.85 + caso() * 0.3),
      p0,
      p1: [p0[0] + (p3[0] - p0[0]) / 3 + nx, p0[1] + (p3[1] - p0[1]) / 3 + ny],
      p2: [p0[0] + ((p3[0] - p0[0]) * 2) / 3 + nx, p0[1] + ((p3[1] - p0[1]) * 2) / 3 + ny],
      p3,
      larghezza,
      onda: larghezza * 0.04,
      onde: 0.6 + caso(),
      fase: caso() * Math.PI * 2,
      setole,
    };
  });
}

function bezier(p: Pennellata, u: number): [number, number, number, number] {
  const v = 1 - u;
  const a = v * v * v;
  const b = 3 * v * v * u;
  const c = 3 * v * u * u;
  const d = u * u * u;
  const x = a * p.p0[0] + b * p.p1[0] + c * p.p2[0] + d * p.p3[0];
  const y = a * p.p0[1] + b * p.p1[1] + c * p.p2[1] + d * p.p3[1];
  // La tangente, per sapere da che parte sta la larghezza del pennello.
  const tx = 3 * v * v * (p.p1[0] - p.p0[0]) + 6 * v * u * (p.p2[0] - p.p1[0]) + 3 * u * u * (p.p3[0] - p.p2[0]);
  const ty = 3 * v * v * (p.p1[1] - p.p0[1]) + 6 * v * u * (p.p2[1] - p.p1[1]) + 3 * u * u * (p.p3[1] - p.p2[1]);
  const l = Math.hypot(tx, ty) || 1;
  return [x, y, -ty / l, tx / l];
}

/** Il pennello accelera, corre e frena: nessuna pennellata va a velocità costante. */
function curva(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * La pressione: il pennello si appoggia (le setole si aprono) e alla fine si
 * solleva. Allarga e stringe la pennellata.
 */
function pressione(u: number) {
  const appoggio = Math.min(1, u / 0.1);
  const stacco = Math.min(1, (1 - u) / 0.12);
  return 0.55 + 0.45 * Math.min(appoggio, stacco);
}

/**
 * Disegna la pennellata da `u0` a `u1` (0–1). Ogni setola è un tratto solo,
 * con un `stroke()` per setola e non per segmento.
 */
export function stendi(ctx: CanvasRenderingContext2D, p: Pennellata, u0: number, u1: number) {
  if (u1 <= u0) return;
  const lunghezza = Math.hypot(p.p3[0] - p.p0[0], p.p3[1] - p.p0[1]);
  const passi = Math.max(2, Math.ceil(((u1 - u0) * lunghezza) / (p.larghezza / 8)));

  const punti: [number, number, number, number, number][] = [];
  for (let i = 0; i <= passi; i++) {
    const u = u0 + ((u1 - u0) * i) / passi;
    const [x, y, nx, ny] = bezier(p, u);
    const scarto = Math.sin(u * Math.PI * 2 * p.onde + p.fase) * p.onda;
    punti.push([x + nx * scarto, y + ny * scarto, nx, ny, u]);
  }

  // Punte tagliate, non tonde: un tondo per setola, all'inizio e alla fine,
  // fa una fila di perle invece del bordo sfrangiato di un pennello.
  ctx.lineCap = "butt";
  ctx.lineJoin = "round";
  for (const s of p.setole) {
    ctx.beginPath();
    let aperto = false;
    for (const [x, y, nx, ny, u] of punti) {
      if (u < s.inizio) continue;
      if (u > s.secco) break;
      const off = s.posto * p.larghezza * pressione(u) + Math.sin(u * 40 + s.tremito) * 0.8;
      const px = x + nx * off;
      const py = y + ny * off;
      if (!aperto) {
        ctx.moveTo(px, py);
        aperto = true;
      } else ctx.lineTo(px, py);
    }
    if (!aperto) continue;
    // Il colore si consuma lungo la pennellata: verso la fine è più magro.
    ctx.globalAlpha = s.colore * (1 - 0.35 * u1);
    ctx.lineWidth = s.spessore;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** L'immagine adattata al canvas come `object-fit: cover` con `object-position`. */
export function copertura(
  img: HTMLImageElement,
  w: number,
  h: number,
  posX: number,
  posY: number,
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scala = Math.max(w / iw, h / ih);
  const dw = iw * scala;
  const dh = ih * scala;
  ctx.drawImage(img, (w - dw) * posX, (h - dh) * posY, dw, dh);
  return c;
}

/**
 * Fa partire la pittura. Restituisce la funzione che la ferma. `fine` si
 * chiama quando l'ultima pennellata è stesa.
 */
export function dipingi(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  { durata, posX, posY, fine }: { durata: number; posX: number; posY: number; fine: () => void },
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx || !img.naturalWidth) {
    fine();
    return () => {};
  }

  // Non oltre 1.5 pixel per punto: le setole non guadagnano niente dalla
  // definizione piena e il telefono ringrazia.
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const w = Math.round(canvas.clientWidth * dpr);
  const h = Math.round(canvas.clientHeight * dpr);
  canvas.width = w;
  canvas.height = h;

  const motivo = ctx.createPattern(copertura(img, w, h, posX, posY), "no-repeat");
  if (!motivo) {
    fine();
    return () => {};
  }
  ctx.strokeStyle = motivo;

  const pennellate = progetta(w, h, durata, [posX * 0.8, posY]);
  const fatto = pennellate.map(() => 0);
  let inizio = 0;
  let raf = 0;
  let chiuso = false;

  const fotogramma = (ora: number) => {
    if (!inizio) inizio = ora;
    const t = ora - inizio;
    let tutte = true;
    pennellate.forEach((p, i) => {
      const u = curva(Math.min(1, Math.max(0, (t - p.da) / p.durata)));
      if (u < 1) tutte = false;
      stendi(ctx, p, fatto[i], u);
      fatto[i] = u;
    });
    if (tutte) {
      chiuso = true;
      fine();
      return;
    }
    raf = requestAnimationFrame(fotogramma);
  };
  raf = requestAnimationFrame(fotogramma);

  return () => {
    cancelAnimationFrame(raf);
    if (!chiuso) chiuso = true;
  };
}
