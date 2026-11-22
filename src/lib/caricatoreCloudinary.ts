/**
 * Chi rimpicciolisce le immagini di Cloudinary: Cloudinary stesso.
 *
 * Prima passavano dall'ottimizzatore di `next/image`, cioè dal server del
 * sito: scaricava l'originale da Cloudinary —fino a 6 MB— e lo ricodificava
 * in AVIF alla misura chiesta. Ogni misura di ogni opera costava fra 1 e
 * 1,7 secondi di CPU la prima volta, e la home ne chiede sedici insieme:
 * misurato in produzione, chi arrivava con la cache vuota aspettava
 * 11–13 secondi prima di vedere la griglia. La cache non aiutava molto:
 * vive dentro il container, ogni deploy la svuota, e ogni larghezza di
 * schermo è una voce a parte.
 *
 * Cloudinary fa lo stesso lavoro sulla sua CDN: la prima volta la stessa
 * home arriva in poco più di un secondo, dalla seconda in un decimo, e
 * nessun deploy la cancella.
 *
 * `f_auto` sceglie il formato dall'`Accept` del browser —WebP oggi, AVIF se
 * l'account lo abilita— e non manda mai a un browser un formato che non sa
 * aprire. `f_avif` forzato peserebbe meno, ma su un iPhone fermo a iOS 15
 * l'immagine non comparirebbe proprio. `q_auto` sceglie la qualità guardando
 * l'immagine: la `quality` che passa `next/image` si ignora.
 *
 * `c_limit` non ingrandisce mai: una tavola più stretta della misura chiesta
 * esce alla sua misura.
 *
 * Puro, senza database: lo usa `Immagine`, che gira anche nel browser.
 */
export function esCloudinary(src: string): boolean {
  return src.startsWith("https://res.cloudinary.com/") && src.includes("/upload/");
}

export function caricatoreCloudinary({ src, width }: { src: string; width: number }): string {
  // Vale anche per il fotogramma di un video (`/video/upload/….jpg`): lì
  // `f_auto` resta su un formato d'immagine, come in `miniatura`.
  return src.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}
