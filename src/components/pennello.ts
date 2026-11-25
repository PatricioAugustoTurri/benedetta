/**
 * Il pennello dell'apertura: dipinge l'illustrazione su un canvas come la
 * dipingerebbe una mano, in tre passate sulla stessa tela.
 *
 *   abbozzo   pennello largo, colore pieno: ogni pennellata porta un colore
 *             solo, quello medio della zona che copre. Escono le masse —la
 *             sagoma, la chioma, l'alone della stella— senza un dettaglio.
 *   stesura   pennello medio che porta l'immagine stessa: ogni setola che
 *             passa scopre i pixel che ha sotto. Il disegno vero arriva sopra
 *             le masse.
 *   ritocchi  pennello sottile, solo dove il disegno ha dettaglio (viso,
 *             stella, mani, tatuaggi, i quadri del gilet), alla fine.
 *
 * Le tre passate si sovrappongono nel tempo, e ognuna comincia dalla stella e
 * dal viso. L'abbozzo sta su uno strato suo, sotto: una sua pennellata in
 * ritardo non copre mai il disegno già steso.
 *
 * Le pennellate seguono la forma. Prima di dipingere si legge l'immagine in
 * piccolo e se ne ricava, punto per punto, la direzione dei bordi e del
 * tratteggio (il tensore di struttura): un colpo sul braccio corre lungo il
 * braccio, uno sui capelli lungo le ciocche. E si ferma quando il colore
 * sotto cambia troppo, come una mano che non esce dalla forma.
 *
 * Il fondo prugna non si dipinge: è già il colore della tela. Tutto il tempo
 * va alla figura.
 *
 * Una pennellata è fatta di setole: ognuna con il suo spessore, la sua
 * quantità di colore e un punto in cui resta a secco. È quello che dà il
 * segno rigato e il bordo sfrangiato invece di un nastro pulito.
 */

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
  /** Solo nell'abbozzo: il colore della setola, un poco più chiaro o scuro. */
  tinta?: string;
};

export type Pennellata = {
  /** Quando parte e quanto dura, in ms dall'inizio. */
  da: number;
  durata: number;
  /** La curva, già campionata: x, y, normale x, normale y, u (0–1). */
  punti: Float32Array;
  larghezza: number;
  setole: Setola[];
};

type Passata = { strato: 0 | 1; pennellate: Pennellata[] };

// Il colore del fondo dell'illustrazione: lì non si dipinge.
const FONDO = [83, 57, 56] as const;

// I punti che contano, in frazioni dell'illustrazione quadrata: la stella e
// il viso. Ogni passata comincia da lì.
const FUOCHI: [number, number][] = [
  [0.27, 0.26],
  [0.48, 0.24],
];

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

const morbido = (x: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/* ------------------------------------------------------------------
   La lettura dell'immagine
   ------------------------------------------------------------------ */

type Mappa = {
  gw: number;
  gh: number;
  /** Pixel del canvas per casella. */
  passo: number;
  /** Colore medio della zona, 0–255. */
  r: Float32Array;
  g: Float32Array;
  b: Float32Array;
  /** 0 sul fondo prugna, 1 sulla figura. */
  figura: Float32Array;
  /** 0 dove il disegno è piatto, 1 dove ha più dettaglio. */
  dettaglio: Float32Array;
  /** La direzione dei bordi, ad angolo doppio (così si può mediare). */
  ex: Float32Array;
  ey: Float32Array;
};

/** Sfocatura a scatola separabile, `volte` passate di raggio `raggio`. */
function sfoca(a: Float32Array, gw: number, gh: number, raggio: number, volte = 1) {
  const tmp = new Float32Array(a.length);
  for (let v = 0; v < volte; v++) {
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        let s = 0;
        let n = 0;
        for (let k = -raggio; k <= raggio; k++) {
          const xx = x + k;
          if (xx < 0 || xx >= gw) continue;
          s += a[y * gw + xx];
          n++;
        }
        tmp[y * gw + x] = s / n;
      }
    }
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        let s = 0;
        let n = 0;
        for (let k = -raggio; k <= raggio; k++) {
          const yy = y + k;
          if (yy < 0 || yy >= gh) continue;
          s += tmp[yy * gw + x];
          n++;
        }
        a[y * gw + x] = s / n;
      }
    }
  }
  return a;
}

function percentile(a: Float32Array, p: number) {
  const c = Float32Array.from(a).sort();
  return c[Math.min(c.length - 1, Math.floor(c.length * p))] || 1;
}

/** Legge l'opera già adattata al canvas, in piccolo: colori, figura, dettaglio, direzioni. */
function leggi(nitida: HTMLCanvasElement, w: number, h: number): Mappa {
  const gw = 128;
  const gh = Math.max(8, Math.round((gw * h) / w));
  const passo = w / gw;
  const n = gw * gh;
  const r = new Float32Array(n);
  const g = new Float32Array(n);
  const b = new Float32Array(n);
  const figura = new Float32Array(n).fill(1);
  const dettaglio = new Float32Array(n).fill(0.3);
  const ex = new Float32Array(n);
  const ey = new Float32Array(n);
  const mappa: Mappa = { gw, gh, passo, r, g, b, figura, dettaglio, ex, ey };

  const piccola = document.createElement("canvas");
  piccola.width = gw;
  piccola.height = gh;
  const pctx = piccola.getContext("2d", { willReadFrequently: true });
  let dati: Uint8ClampedArray | null = null;
  try {
    if (pctx) {
      pctx.imageSmoothingQuality = "high";
      pctx.drawImage(nitida, 0, 0, gw, gh);
      dati = pctx.getImageData(0, 0, gw, gh).data;
    }
  } catch {
    dati = null;
  }
  // Senza lettura (un'immagine che il browser non lascia leggere) si dipinge
  // tutto, con colpi in diagonale: il risultato di prima.
  if (!dati) {
    r.fill(FONDO[0]);
    g.fill(FONDO[1]);
    b.fill(FONDO[2]);
    ex.fill(Math.cos(-0.7));
    ey.fill(Math.sin(-0.7));
    return mappa;
  }

  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    r[i] = dati[i * 4];
    g[i] = dati[i * 4 + 1];
    b[i] = dati[i * 4 + 2];
    lum[i] = 0.299 * r[i] + 0.587 * g[i] + 0.114 * b[i];
  }

  // La figura: quanto il colore si allontana dal fondo prugna, un poco
  // allargata, così i bordi della sagoma si dipingono per intero.
  for (let i = 0; i < n; i++) {
    const d = Math.hypot(r[i] - FONDO[0], g[i] - FONDO[1], b[i] - FONDO[2]);
    figura[i] = morbido(d, 14, 36);
  }
  sfoca(figura, gw, gh, 2, 2);
  for (let i = 0; i < n; i++) figura[i] = Math.min(1, figura[i] * 1.8);

  // I colori medi che porta l'abbozzo.
  sfoca(r, gw, gh, 1, 2);
  sfoca(g, gw, gh, 1, 2);
  sfoca(b, gw, gh, 1, 2);

  // Gradiente (Sobel) e tensore di struttura.
  sfoca(lum, gw, gh, 1);
  const jxx = new Float32Array(n);
  const jyy = new Float32Array(n);
  const jxy = new Float32Array(n);
  const L = (x: number, y: number) =>
    lum[Math.min(gh - 1, Math.max(0, y)) * gw + Math.min(gw - 1, Math.max(0, x))];
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const gx =
        L(x + 1, y - 1) + 2 * L(x + 1, y) + L(x + 1, y + 1) - L(x - 1, y - 1) - 2 * L(x - 1, y) - L(x - 1, y + 1);
      const gy =
        L(x - 1, y + 1) + 2 * L(x, y + 1) + L(x + 1, y + 1) - L(x - 1, y - 1) - 2 * L(x, y - 1) - L(x + 1, y - 1);
      const i = y * gw + x;
      jxx[i] = gx * gx;
      jyy[i] = gy * gy;
      jxy[i] = gx * gy;
      dettaglio[i] = Math.hypot(gx, gy);
    }
  }
  sfoca(dettaglio, gw, gh, 2);
  const tetto = percentile(dettaglio, 0.95);
  for (let i = 0; i < n; i++) dettaglio[i] = Math.min(1, dettaglio[i] / tetto);

  // Sfocato largo: la direzione dei bordi entra anche nelle zone piatte, e
  // dentro il braccio i colpi corrono lungo il braccio.
  sfoca(jxx, gw, gh, 4, 3);
  sfoca(jyy, gw, gh, 4, 3);
  sfoca(jxy, gw, gh, 4, 3);
  const traccia = new Float32Array(n);
  for (let i = 0; i < n; i++) traccia[i] = jxx[i] + jyy[i];
  const debole = percentile(traccia, 0.15);
  const forte = percentile(traccia, 0.6);
  // Dove il disegno non dice niente, colpi in diagonale che salgono verso
  // destra, come una mano destra.
  const base = -0.7 * 2;
  for (let i = 0; i < n; i++) {
    const t = traccia[i] + 1e-6;
    const fiducia = morbido(traccia[i], debole, forte);
    // Il gradiente ad angolo doppio, girato di 90°: la direzione del bordo.
    ex[i] = (-(jxx[i] - jyy[i]) / t) * fiducia + Math.cos(base) * 0.15;
    ey[i] = ((-2 * jxy[i]) / t) * fiducia + Math.sin(base) * 0.15;
  }
  return mappa;
}

function casella(m: Mappa, x: number, y: number) {
  const cx = Math.min(m.gw - 1, Math.max(0, Math.floor(x / m.passo)));
  const cy = Math.min(m.gh - 1, Math.max(0, Math.floor(y / m.passo)));
  return cy * m.gw + cx;
}

/** La direzione del bordo in un punto, come vettore unitario (con verso a caso). */
function direzione(m: Mappa, x: number, y: number): [number, number] {
  const i = casella(m, x, y);
  const a = Math.atan2(m.ey[i], m.ex[i]) / 2;
  return [Math.cos(a), Math.sin(a)];
}

/* ------------------------------------------------------------------
   Le pennellate
   ------------------------------------------------------------------ */

/**
 * Segue la forma a partire da (x, y), metà lunghezza avanti e metà indietro,
 * e restituisce la curva campionata con le normali. Si ferma prima se il
 * colore sotto cambia più di `soglia`.
 */
function traccia(m: Mappa, x: number, y: number, lungo: number, larghezza: number, soglia: number) {
  const passo = larghezza * 0.28;
  const i0 = casella(m, x, y);
  const [d0x, d0y] = direzione(m, x, y);

  const segui = (verso: number) => {
    const pts: [number, number][] = [];
    let dx = d0x * verso;
    let dy = d0y * verso;
    let px = x;
    let py = y;
    const passi = Math.max(1, Math.round(lungo / 2 / passo));
    for (let s = 0; s < passi; s++) {
      let [nx, ny] = direzione(m, px, py);
      if (nx * dx + ny * dy < 0) {
        nx = -nx;
        ny = -ny;
      }
      // Gira, ma non di colpo: una mano non fa angoli.
      dx = dx * 0.6 + nx * 0.4;
      dy = dy * 0.6 + ny * 0.4;
      const l = Math.hypot(dx, dy) || 1;
      dx /= l;
      dy /= l;
      px += dx * passo;
      py += dy * passo;
      const i = casella(m, px, py);
      const diff = Math.hypot(m.r[i] - m.r[i0], m.g[i] - m.g[i0], m.b[i] - m.b[i0]);
      if (s >= 1 && diff > soglia) break;
      pts.push([px, py]);
    }
    return pts;
  };

  let pts: [number, number][] = [...segui(-1).reverse(), [x, y], ...segui(1)];
  if (pts.length < 2) pts = [[x - d0x * passo, y - d0y * passo], [x + d0x * passo, y + d0y * passo]];

  // Un giro di Chaikin: la curva si ammorbidisce e si infittisce.
  if (pts.length > 2) {
    const liscia: [number, number][] = [pts[0]];
    for (let k = 0; k < pts.length - 1; k++) {
      const [ax, ay] = pts[k];
      const [bx, by] = pts[k + 1];
      liscia.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
    }
    liscia.push(pts[pts.length - 1]);
    pts = liscia;
  }

  const n = pts.length;
  const lun = new Float32Array(n);
  for (let k = 1; k < n; k++) lun[k] = lun[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
  const tot = lun[n - 1] || 1;
  const punti = new Float32Array(n * 5);
  for (let k = 0; k < n; k++) {
    const a = pts[Math.max(0, k - 1)];
    const b = pts[Math.min(n - 1, k + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    punti.set([pts[k][0], pts[k][1], -ty / l, tx / l, lun[k] / tot], k * 5);
  }
  return punti;
}

type Mano = {
  strato: 0 | 1;
  /** Larghezza del pennello in frazioni del lato corto, con limiti in px. */
  larghezza: number;
  minimo: number;
  massimo: number;
  /** Lunghezza in larghezze di pennello. */
  lungo: [number, number];
  /** Lato della griglia in larghezze di pennello. */
  griglia: number;
  setole: number;
  /** Il colore pieno della zona (abbozzo) invece dell'immagine. */
  pieno: boolean;
  /** Dove si dipinge: quanto deve essere figura, quanto dettaglio. */
  figura: number;
  dettaglio: number;
  /** Quanto disordine nell'ordine dal fuoco verso i bordi. */
  disordine: number;
  /** Finestra delle partenze e durata di un colpo, in frazioni del totale. */
  primo: number;
  ultimo: number;
  colpo: number;
  soglia: number;
  /** Non più di tante pennellate: il telefono ringrazia. */
  tetto: number;
};

const MANI: Mano[] = [
  {
    strato: 0, larghezza: 0.11, minimo: 44, massimo: 190, lungo: [2.4, 4], griglia: 0.7,
    setole: 28, pieno: true, figura: 0.35, dettaglio: 0, disordine: 0.22,
    primo: 0, ultimo: 0.36, colpo: 0.2, soglia: 95, tetto: 200,
  },
  {
    strato: 1, larghezza: 0.07, minimo: 28, massimo: 120, lungo: [2.4, 4], griglia: 0.8,
    setole: 20, pieno: false, figura: 0.3, dettaglio: 0, disordine: 0.12,
    primo: 0.16, ultimo: 0.7, colpo: 0.18, soglia: 80, tetto: 320,
  },
  {
    strato: 1, larghezza: 0.032, minimo: 12, massimo: 56, lungo: [2, 4], griglia: 0.9,
    setole: 9, pieno: false, figura: 0.5, dettaglio: 0.42, disordine: 0.06,
    primo: 0.5, ultimo: 0.88, colpo: 0.12, soglia: 45, tetto: 260,
  },
];

function progettaMano(
  mano: Mano,
  m: Mappa,
  w: number,
  h: number,
  durata: number,
  fuochi: [number, number][],
  caso: () => number,
): Pennellata[] {
  let larghezza = Math.min(Math.max(Math.min(w, h) * mano.larghezza, mano.minimo), mano.massimo);
  const diagonale = Math.hypot(w, h);

  type Colpo = { x: number; y: number; ordine: number; peso: number };
  const posa = () => {
    const lato = larghezza * mano.griglia;
    const colonne = Math.ceil(w / lato) + 1;
    const righe = Math.ceil(h / lato) + 1;
    const colpi: Colpo[] = [];
    for (let r = 0; r < righe; r++) {
      for (let c = 0; c < colonne; c++) {
        const x = (c - 0.25 + caso() * 0.5) * lato;
        const y = (r - 0.25 + caso() * 0.5) * lato;
        const i = casella(m, x, y);
        const disordine = caso();
        if (m.figura[i] < mano.figura) continue;
        if (m.dettaglio[i] < mano.dettaglio) continue;
        const vicino = Math.min(...fuochi.map(([fx, fy]) => Math.hypot(x - fx, y - fy))) / diagonale;
        colpi.push({ x, y, ordine: vicino + disordine * mano.disordine, peso: m.dettaglio[i] });
      }
    }
    return colpi;
  };

  let colpi = posa();
  if (mano.dettaglio > 0) {
    // I ritocchi: con troppi colpi si tengono quelli dove il disegno ha più
    // da dire.
    if (colpi.length > mano.tetto) colpi = colpi.sort((a, b) => b.peso - a.peso).slice(0, mano.tetto);
  } else {
    // Le passate che coprono non lasciano buchi: con troppi colpi —uno schermo
    // stretto e alto, dove la figura è quasi tutto— si allarga il pennello.
    for (let volta = 0; volta < 4 && colpi.length > mano.tetto; volta++) {
      larghezza *= Math.sqrt(colpi.length / mano.tetto) * 1.03;
      colpi = posa();
    }
  }
  colpi.sort((a, b) => a.ordine - b.ordine);

  const colpo = durata * mano.colpo;
  const primo = durata * mano.primo;
  const ultimo = durata * mano.ultimo;

  return colpi.map(({ x, y }, k) => {
    const lungo = larghezza * (mano.lungo[0] + caso() * (mano.lungo[1] - mano.lungo[0]));
    const punti = traccia(m, x, y, lungo, larghezza, mano.soglia);
    const i = casella(m, x, y);

    const setole: Setola[] = Array.from({ length: mano.setole }, () => {
      // Più setole al centro che ai bordi: il pennello carico è pieno in
      // mezzo e sfrangiato fuori.
      const posto = (caso() + caso() - 1) * 0.62;
      const bordo = Math.abs(posto) * 2;
      const setola: Setola = {
        posto,
        spessore: (larghezza / mano.setole) * (1.8 + caso() * 2.2) * (1 - bordo * 0.35),
        colore: (0.6 + caso() * 0.4) * (1 - bordo * 0.3),
        // Le setole di fuori toccano dopo e si seccano prima: la punta e la
        // coda della pennellata si sfrangiano invece di tagliarsi dritte.
        inizio: caso() * 0.06 + Math.pow(bordo, 1.5) * (0.12 + caso() * 0.16),
        secco: 1 - Math.pow(bordo, 1.5) * (0.1 + caso() * 0.25) - caso() * 0.08,
        tremito: caso() * Math.PI * 2,
      };
      if (mano.pieno) {
        // Il colore della zona, un poco più chiaro o più scuro per setola: il
        // colore mescolato male che fa la pittura.
        const tono = 1 + (caso() - 0.5) * 0.14;
        const c = (v: number) => Math.round(Math.min(255, v * tono));
        setola.tinta = `rgb(${c(m.r[i])},${c(m.g[i])},${c(m.b[i])})`;
      }
      return setola;
    });

    return {
      da: primo + (k / Math.max(1, colpi.length - 1)) * (ultimo - primo),
      durata: colpo * (0.85 + caso() * 0.3),
      punti,
      larghezza,
      setole,
    };
  });
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
  const appoggio = Math.min(1, u / 0.18);
  const stacco = Math.min(1, (1 - u) / 0.2);
  const m = Math.min(appoggio, stacco);
  return 0.3 + 0.7 * m * (2 - m);
}

/** Il punto della curva in `u`, interpolato. */
function punto(p: Float32Array, u: number): [number, number, number, number, number] {
  const n = p.length / 5;
  let k = 1;
  while (k < n - 1 && p[k * 5 + 4] < u) k++;
  const a = (k - 1) * 5;
  const b = k * 5;
  const span = p[b + 4] - p[a + 4] || 1;
  const f = Math.min(1, Math.max(0, (u - p[a + 4]) / span));
  const nx = p[a + 2] + (p[b + 2] - p[a + 2]) * f;
  const ny = p[a + 3] + (p[b + 3] - p[a + 3]) * f;
  const l = Math.hypot(nx, ny) || 1;
  return [p[a] + (p[b] - p[a]) * f, p[a + 1] + (p[b + 1] - p[a + 1]) * f, nx / l, ny / l, u];
}

/**
 * Disegna la pennellata da `u0` a `u1` (0–1). Ogni setola è un tratto solo,
 * con un `stroke()` per setola e non per segmento.
 */
export function stendi(ctx: CanvasRenderingContext2D, p: Pennellata, u0: number, u1: number) {
  if (u1 <= u0) return;
  const tratto: [number, number, number, number, number][] = [punto(p.punti, u0)];
  for (let k = 0; k < p.punti.length; k += 5) {
    const u = p.punti[k + 4];
    if (u > u0 && u < u1) tratto.push([p.punti[k], p.punti[k + 1], p.punti[k + 2], p.punti[k + 3], u]);
  }
  tratto.push(punto(p.punti, u1));

  // Punte tagliate, non tonde: un tondo per setola, all'inizio e alla fine,
  // fa una fila di perle invece del bordo sfrangiato di un pennello.
  ctx.lineCap = "butt";
  ctx.lineJoin = "round";
  for (const s of p.setole) {
    ctx.beginPath();
    let aperto = false;
    for (const [x, y, nx, ny, u] of tratto) {
      if (u < s.inizio) continue;
      if (u > s.secco) break;
      const off = s.posto * p.larghezza * pressione(u) + Math.sin(u * 40 + s.tremito) * 0.8;
      if (!aperto) {
        ctx.moveTo(x + nx * off, y + ny * off);
        aperto = true;
      } else ctx.lineTo(x + nx * off, y + ny * off);
    }
    if (!aperto) continue;
    if (s.tinta) ctx.strokeStyle = s.tinta;
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

/* ------------------------------------------------------------------
   Il quadro
   ------------------------------------------------------------------ */

export type Quadro = {
  /** Quanto dura la pittura, in ms. */
  durata: number;
  /**
   * Porta il quadro al tempo `t` (ms dall'inizio), aggiungendo solo i pezzi
   * di pennellata nuovi. Restituisce `true` quando è tutto steso.
   */
  disegna: (t: number) => boolean;
};

/**
 * Prepara la pittura sul canvas: misura, legge l'immagine e progetta le
 * pennellate. `null` se il canvas o l'immagine non ci sono.
 */
export function prepara(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  { durata, posX, posY, dpr = 1 }: { durata: number; posX: number; posY: number; dpr?: number },
): Quadro | null {
  const ctx = canvas.getContext("2d");
  if (!ctx || !img.naturalWidth) return null;
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
  canvas.width = w;
  canvas.height = h;

  const nitida = copertura(img, w, h, posX, posY);
  const motivo = ctx.createPattern(nitida, "no-repeat");
  if (!motivo) return null;
  const mappa = leggi(nitida, w, h);

  // I fuochi, dall'illustrazione al canvas.
  const scala = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scala;
  const dh = img.naturalHeight * scala;
  const ox = (w - dw) * posX;
  const oy = (h - dh) * posY;
  const fuochi = FUOCHI.map(([fx, fy]) => [ox + fx * dw, oy + fy * dh] as [number, number]);

  const caso = semi(20271104);
  const passate: Passata[] = MANI.map((mano) => ({
    strato: mano.strato,
    pennellate: progettaMano(mano, mappa, w, h, durata, fuochi, caso),
  }));

  // Due strati: sotto l'abbozzo, sopra il disegno. Il canvas visibile li
  // ricompone a ogni fotogramma.
  const strati = [0, 1].map(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  });
  const sctx = strati.map((c) => c.getContext("2d"));
  if (!sctx[0] || !sctx[1]) return null;
  sctx[1].strokeStyle = sctx[1].createPattern(nitida, "no-repeat") ?? motivo;

  const fatto = passate.map((p) => p.pennellate.map(() => 0));
  const fine = Math.max(
    ...passate.flatMap((p) => p.pennellate.map((q) => q.da + q.durata)),
    1,
  );

  return {
    durata: fine,
    disegna(t: number) {
      let tutte = true;
      passate.forEach((passata, j) => {
        const c = sctx[passata.strato]!;
        passata.pennellate.forEach((p, i) => {
          const u = curva(Math.min(1, Math.max(0, (t - p.da) / p.durata)));
          if (u < 1) tutte = false;
          stendi(c, p, fatto[j][i], u);
          fatto[j][i] = u;
        });
      });
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(strati[0], 0, 0);
      ctx.drawImage(strati[1], 0, 0);
      return tutte;
    },
  };
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
  // Non oltre 1.5 pixel per punto: le setole non guadagnano niente dalla
  // definizione piena e il telefono ringrazia.
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const quadro = prepara(canvas, img, { durata, posX, posY, dpr });
  if (!quadro) {
    fine();
    return () => {};
  }

  let inizio = 0;
  let raf = 0;
  const fotogramma = (ora: number) => {
    if (!inizio) inizio = ora;
    if (quadro.disegna(ora - inizio)) {
      fine();
      return;
    }
    raf = requestAnimationFrame(fotogramma);
  };
  raf = requestAnimationFrame(fotogramma);

  return () => cancelAnimationFrame(raf);
}
