/**
 * Genera ilustraciones placeholder ORIGINALES (composiciones abstractas).
 * Su unico proposito es poblar la grilla mientras no estan las obras reales.
 * Para reemplazarlas: borra public/ilustraciones/*.svg y pone los archivos
 * de la clienta, despues actualiza src/data/illustrations.ts.
 *
 * Uso: node scripts/generate-placeholders.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";

const OUT = "public/ilustraciones";
mkdirSync(OUT, { recursive: true });

const palettes = {
  terracotta: { bg: "#F1E7DA", ink: "#2C2823", a: "#C4643C", b: "#D9A03F", c: "#8C7A63" },
  sage:       { bg: "#E9EBE0", ink: "#262B24", a: "#7E8C6A", b: "#C4A05C", c: "#5E6B55" },
  clay:       { bg: "#F4E5DC", ink: "#2E2622", a: "#A8674F", b: "#E0B48C", c: "#6F5347" },
  sky:        { bg: "#E4EAEE", ink: "#212A31", a: "#7A97A8", b: "#D9A03F", c: "#4C6273" },
  plum:       { bg: "#EFE6E9", ink: "#2B2328", a: "#8A5A6B", b: "#D9A88C", c: "#5E4450" },
  ochre:      { bg: "#F4EDDD", ink: "#2C2720", a: "#D9A03F", b: "#9A7B4F", c: "#6B5636" },
};

/* --- motivos abstractos, todos dibujados desde cero --- */

const motifs = {
  arcs: (w, h, p) => {
    const cx = w / 2;
    const cy = h * 0.62;
    let s = "";
    for (let i = 0; i < 6; i++) {
      const r = h * (0.12 + i * 0.075);
      const col = i % 2 === 0 ? p.a : p.c;
      s += `<path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="${col}" stroke-width="${h * 0.012}" opacity="${0.85 - i * 0.08}"/>`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="${h * 0.055}" fill="${p.b}"/>`;
    s += `<line x1="${w * 0.12}" y1="${cy}" x2="${w * 0.88}" y2="${cy}" stroke="${p.ink}" stroke-width="${h * 0.006}" opacity="0.5"/>`;
    return s;
  },

  hills: (w, h, p) => {
    let s = `<circle cx="${w * 0.7}" cy="${h * 0.26}" r="${h * 0.11}" fill="${p.b}"/>`;
    s += `<path d="M0 ${h * 0.62} C ${w * 0.25} ${h * 0.44}, ${w * 0.42} ${h * 0.72}, ${w} ${h * 0.55} L ${w} ${h} L 0 ${h} Z" fill="${p.a}" opacity="0.92"/>`;
    s += `<path d="M0 ${h * 0.78} C ${w * 0.3} ${h * 0.62}, ${w * 0.66} ${h * 0.9}, ${w} ${h * 0.74} L ${w} ${h} L 0 ${h} Z" fill="${p.c}" opacity="0.9"/>`;
    for (let i = 0; i < 5; i++) {
      const x = w * (0.1 + i * 0.19);
      s += `<line x1="${x}" y1="${h * 0.86}" x2="${x}" y2="${h * 0.95}" stroke="${p.bg}" stroke-width="${h * 0.007}" opacity="0.6"/>`;
    }
    return s;
  },

  branch: (w, h, p) => {
    const bx = w * 0.5;
    let s = `<circle cx="${w * 0.5}" cy="${h * 0.3}" r="${h * 0.145}" fill="none" stroke="${p.a}" stroke-width="${h * 0.011}"/>`;
    s += `<path d="M ${bx} ${h * 0.95} C ${bx - w * 0.04} ${h * 0.72}, ${bx + w * 0.03} ${h * 0.6}, ${bx} ${h * 0.42}" fill="none" stroke="${p.c}" stroke-width="${h * 0.01}"/>`;
    for (let i = 0; i < 5; i++) {
      const t = 0.46 + i * 0.1;
      const y = h * (0.92 - i * 0.11);
      const dir = i % 2 === 0 ? 1 : -1;
      const lw = w * 0.16 * dir;
      s += `<path d="M ${bx} ${y} C ${bx + lw * 0.5} ${y - h * 0.055}, ${bx + lw} ${y - h * 0.03}, ${bx + lw * 0.92} ${y + h * 0.012} C ${bx + lw * 0.5} ${y + h * 0.035}, ${bx + lw * 0.2} ${y + h * 0.022}, ${bx} ${y} Z" fill="${i % 2 === 0 ? p.a : p.c}" opacity="${0.55 + t * 0.35}"/>`;
    }
    return s;
  },

  vessel: (w, h, p) => {
    const cx = w / 2;
    let s = "";
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * w * 0.11;
      s += `<path d="M ${cx} ${h * 0.58} C ${x} ${h * 0.44}, ${x} ${h * 0.34}, ${x + (i - 1) * w * 0.03} ${h * 0.2}" fill="none" stroke="${p.c}" stroke-width="${h * 0.008}"/>`;
      s += `<circle cx="${x + (i - 1) * w * 0.03}" cy="${h * 0.19}" r="${h * 0.035}" fill="${i === 1 ? p.b : p.a}"/>`;
    }
    s += `<path d="M ${cx - w * 0.17} ${h * 0.58} C ${cx - w * 0.23} ${h * 0.78}, ${cx - w * 0.12} ${h * 0.9}, ${cx} ${h * 0.9} C ${cx + w * 0.12} ${h * 0.9}, ${cx + w * 0.23} ${h * 0.78}, ${cx + w * 0.17} ${h * 0.58} Z" fill="${p.a}"/>`;
    s += `<rect x="${cx - w * 0.2}" y="${h * 0.55}" width="${w * 0.4}" height="${h * 0.035}" rx="${h * 0.017}" fill="${p.ink}" opacity="0.75"/>`;
    return s;
  },

  lattice: (w, h, p) => {
    let s = `<circle cx="${w * 0.5}" cy="${h * 0.5}" r="${Math.min(w, h) * 0.3}" fill="${p.a}" opacity="0.9"/>`;
    const cols = 7, rows = 9;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = w * (0.1 + (i / (cols - 1)) * 0.8);
        const y = h * (0.08 + (j / (rows - 1)) * 0.84);
        const d = Math.hypot(x - w * 0.5, y - h * 0.5);
        const inside = d < Math.min(w, h) * 0.3;
        s += `<circle cx="${x}" cy="${y}" r="${h * 0.008}" fill="${inside ? p.bg : p.c}" opacity="${inside ? 0.9 : 0.55}"/>`;
      }
    }
    s += `<circle cx="${w * 0.5}" cy="${h * 0.5}" r="${Math.min(w, h) * 0.3}" fill="none" stroke="${p.ink}" stroke-width="${h * 0.005}" opacity="0.4"/>`;
    return s;
  },

  waves: (w, h, p) => {
    let s = "";
    const cols = [p.a, p.c, p.b, p.a, p.c];
    for (let i = 0; i < 5; i++) {
      const y = h * (0.22 + i * 0.15);
      s += `<path d="M0 ${y} C ${w * 0.3} ${y - h * 0.07}, ${w * 0.6} ${y + h * 0.07}, ${w} ${y - h * 0.02}" fill="none" stroke="${cols[i]}" stroke-width="${h * 0.02}" opacity="${0.85 - i * 0.1}" stroke-linecap="round"/>`;
    }
    s += `<circle cx="${w * 0.22}" cy="${h * 0.14}" r="${h * 0.045}" fill="${p.b}"/>`;
    return s;
  },

  leaf: (w, h, p) => {
    const cx = w / 2;
    let s = `<path d="M ${cx} ${h * 0.1} C ${cx + w * 0.26} ${h * 0.32}, ${cx + w * 0.22} ${h * 0.66}, ${cx} ${h * 0.9} C ${cx - w * 0.22} ${h * 0.66}, ${cx - w * 0.26} ${h * 0.32}, ${cx} ${h * 0.1} Z" fill="${p.a}"/>`;
    s += `<line x1="${cx}" y1="${h * 0.13}" x2="${cx}" y2="${h * 0.88}" stroke="${p.bg}" stroke-width="${h * 0.008}" opacity="0.8"/>`;
    for (let i = 0; i < 7; i++) {
      const y = h * (0.24 + i * 0.09);
      const sp = w * (0.17 - Math.abs(i - 3) * 0.028);
      s += `<path d="M ${cx} ${y} Q ${cx + sp * 0.6} ${y + h * 0.012}, ${cx + sp} ${y + h * 0.05}" fill="none" stroke="${p.bg}" stroke-width="${h * 0.005}" opacity="0.7"/>`;
      s += `<path d="M ${cx} ${y} Q ${cx - sp * 0.6} ${y + h * 0.012}, ${cx - sp} ${y + h * 0.05}" fill="none" stroke="${p.bg}" stroke-width="${h * 0.005}" opacity="0.7"/>`;
    }
    return s;
  },

  arch: (w, h, p) => {
    const m = w * 0.16;
    const aw = w - m * 2;
    const top = h * 0.14;
    let s = `<path d="M ${m} ${h * 0.88} L ${m} ${top + aw / 2} A ${aw / 2} ${aw / 2} 0 0 1 ${m + aw} ${top + aw / 2} L ${m + aw} ${h * 0.88} Z" fill="${p.a}" opacity="0.18" stroke="${p.ink}" stroke-width="${h * 0.006}"/>`;
    s += `<circle cx="${w * 0.5}" cy="${h * 0.36}" r="${h * 0.09}" fill="${p.b}"/>`;
    s += `<path d="M ${m + aw * 0.12} ${h * 0.88} C ${w * 0.38} ${h * 0.6}, ${w * 0.6} ${h * 0.72}, ${m + aw * 0.88} ${h * 0.88} Z" fill="${p.c}"/>`;
    for (let i = 0; i < 3; i++) {
      const x = w * (0.34 + i * 0.16);
      s += `<line x1="${x}" y1="${h * 0.62}" x2="${x}" y2="${h * 0.86}" stroke="${p.a}" stroke-width="${h * 0.007}" opacity="0.8"/>`;
    }
    return s;
  },
};

const items = [
  { file: "01-jardin-nocturno",   motif: "branch",  palette: "sage",       w: 900,  h: 1200 },
  { file: "02-mediodia",          motif: "hills",   palette: "terracotta", w: 1200, h: 900  },
  { file: "03-ritmo",             motif: "arcs",    palette: "clay",       w: 1000, h: 1000 },
  { file: "04-herbario",          motif: "leaf",    palette: "sage",       w: 900,  h: 1200 },
  { file: "05-marea",             motif: "waves",   palette: "sky",        w: 1200, h: 900  },
  { file: "06-ceramica",          motif: "vessel",  palette: "ochre",      w: 960,  h: 1200 },
  { file: "07-constelacion",      motif: "lattice", palette: "plum",       w: 1000, h: 1000 },
  { file: "08-umbral",            motif: "arch",    palette: "clay",       w: 960,  h: 1200 },
  { file: "09-siesta",            motif: "hills",   palette: "ochre",      w: 1200, h: 900  },
  { file: "10-tallos",            motif: "vessel",  palette: "sage",       w: 900,  h: 1200 },
  { file: "11-eco",               motif: "arcs",    palette: "sky",        w: 1000, h: 1000 },
  { file: "12-bordado",           motif: "lattice", palette: "terracotta", w: 900,  h: 1200 },
];

let n = 0;
for (const it of items) {
  const p = palettes[it.palette];
  const { w, h } = it;
  const grainId = `g${n}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
  <defs>
    <filter id="${grainId}">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="${n + 7}"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="${p.bg}"/>
  ${motifs[it.motif](w, h, p)}
  <rect width="${w}" height="${h}" filter="url(#${grainId})" opacity="0.06" style="mix-blend-mode:multiply"/>
</svg>
`;
  writeFileSync(`${OUT}/${it.file}.svg`, svg);
  n++;
}

console.log(`Generadas ${items.length} ilustraciones placeholder en ${OUT}/`);
