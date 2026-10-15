/**
 * Un'immagine di Cloudinary in piccolo, tagliata da Cloudinary stesso alla
 * misura in cui si vede.
 *
 * Serve ai `<img>` dell'admin, che non passano da `next/image`: senza, una
 * casella di 48px scaricava l'originale intero —una scansione arriva a 6 MB—
 * e aprire un'opera con otto immagini voleva dire scaricarne venticinque.
 * Le misure si chiedono doppie di quelle a schermo, per i display retina.
 *
 * Vale anche per il fotogramma di un video: `/video/upload/` contiene
 * `/upload/`. Un indirizzo che non è di Cloudinary passa com'è.
 *
 * Puro, senza database: lo usano anche i componenti che girano nel browser.
 */
export function miniatura(url: string, larghezza: number, altezza: number): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/c_fill,g_auto,w_${larghezza},h_${altezza},q_auto,f_auto/`);
}
