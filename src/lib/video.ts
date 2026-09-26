import type { WorkImage } from "@/lib/works";

/**
 * I pezzi di un'opera che sono video e non immagini.
 *
 * Vivono nella stessa lista delle immagini —la colonna `image`— perché per
 * l'opera sono la stessa cosa: una tavola in più, con il suo posto
 * nell'ordine, il suo testo alternativo e le sue misure. Quello che li
 * distingue è solo `tipo: "video"`; un elemento senza `tipo` è un'immagine,
 * così le righe salvate prima che esistessero i video restano valide senza
 * toccarle.
 *
 * Questo file è puro —niente database— perché lo leggono anche i componenti
 * che girano nel browser.
 */
export function esVideo(pezzo: Pick<WorkImage, "tipo">): boolean {
  return pezzo.tipo === "video";
}

/**
 * Il fotogramma fermo di un video, come immagine.
 *
 * Cloudinary lo genera da solo: basta chiedere lo stesso indirizzo con
 * l'estensione di un'immagine al posto di `.mp4`. Esce con le misure del
 * video, quindi `width` e `height` del pezzo valgono anche per lui.
 *
 * Serve dove un video non deve muoversi: la copertina mentre carica, la
 * griglia dell'admin, la paginazione fra opere e l'anteprima quando si
 * condivide il link.
 */
export function fotogramma(url: string): string {
  return url.replace(/\.[a-z0-9]+$/i, ".jpg");
}

/** L'indirizzo da usare dove serve un'immagine ferma, qualunque sia il pezzo. */
export function immagineFerma(pezzo: Pick<WorkImage, "url" | "tipo">): string {
  return esVideo(pezzo) ? fotogramma(pezzo.url) : pezzo.url;
}

/**
 * Quanti pezzi ha un'opera, detto in parole: «3 immagini», «1 video»,
 * «2 immagini e 1 video». Per le schede dell'admin, dove contarli tutti come
 * «immagini» direbbe una cosa falsa appena entra un video.
 */
export function contarPezzi(pezzi: Pick<WorkImage, "tipo">[]): string {
  const video = pezzi.filter(esVideo).length;
  const immagini = pezzi.length - video;
  const parti = [
    immagini > 0 ? `${immagini} ${immagini === 1 ? "immagine" : "immagini"}` : null,
    video > 0 ? `${video} video` : null,
  ].filter(Boolean);
  return parti.length > 0 ? parti.join(" e ") : "0 immagini";
}
