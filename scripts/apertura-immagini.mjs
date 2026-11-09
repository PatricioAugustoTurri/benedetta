/**
 * Le misure dell'immagine dell'apertura, fatte una volta qui e servite come
 * file statici da public/apertura/.
 *
 * Perché non `next/image`: in produzione l'ottimizzatore codifica l'AVIF al
 * momento della prima richiesta di ogni misura, e sul server ci mette fra 6
 * e 13 secondi (misurato il 2026-11-09). L'apertura aspetta l'immagine al
 * massimo qualche secondo, quindi si alzava quasi sempre senza averla
 * mostrata. Un file già pronto arriva in decimi di secondo.
 *
 * Si rilancia solo se cambia l'illustrazione:
 *   node scripts/apertura-immagini.mjs
 */
import sharp from "sharp";

const ORIGINE = "public/instagram/3.jpg";
const MISURE = [640, 960, 1280, 1600, 2048];

for (const w of MISURE) {
  const base = sharp(ORIGINE).resize(w, w);
  await base.clone().avif({ quality: 45, effort: 6 }).toFile(`public/apertura/apertura-${w}.avif`);
  await base.clone().webp({ quality: 72 }).toFile(`public/apertura/apertura-${w}.webp`);
}
