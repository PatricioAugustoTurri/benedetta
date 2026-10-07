import type { WorkImage } from "@/lib/works";

/**
 * Il mockup tagliato alla proporzione esatta della stampa.
 *
 * I mockup escono dal generatore in 4:5 e le stampe hanno ognuna la sua
 * proporzione (A5 e A3 sono 1:√2, Aotunno è quadrata). Nel carosello e nel
 * visore le due immagini stanno una dopo l'altra, e se non hanno la stessa
 * misura il passaggio salta (cliente, 2026-10-07). Qui il mockup prende le
 * dimensioni della stampa: lo taglia Cloudinary (`c_fill`), che con
 * `g_auto` tiene al centro la cornice e sacrifica muro e mobili. Si toglie
 * il meno possibile: il lato lungo del mockup resta intero.
 *
 * Il file salvato non si tocca: se domani la copertina cambia proporzione,
 * il taglio la segue da solo.
 */
export function mockupComeStampa(mockup: WorkImage, stampa: WorkImage): WorkImage {
  const r = stampa.width / stampa.height;
  const largo = mockup.width / mockup.height > r;
  const width = largo ? Math.round(mockup.height * r) : mockup.width;
  const height = largo ? mockup.height : Math.round(mockup.width / r);

  // Solo gli indirizzi di Cloudinary sanno tagliare; un altro resta com'è.
  if (!mockup.url.includes("/image/upload/")) return mockup;
  const url = mockup.url.replace(
    "/image/upload/",
    `/image/upload/c_fill,ar_${stampa.width}:${stampa.height},g_auto/`,
  );

  return { ...mockup, url, width, height };
}
