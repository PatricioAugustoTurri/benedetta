import { configCloudinary } from "@/lib/cloudinary";
import type { WorkImage } from "@/lib/works";

/**
 * Cosa si accetta come immagine di un'opera, dal lato server.
 *
 * Esiste perché da quando le immagini salgono direttamente dal browser a
 * Cloudinary, quello che arriva al server al salvataggio non è più un file: è
 * un indirizzo. E un indirizzo lo scrive chi manda il modulo.
 *
 * Senza questo controllo, qualcuno con una sessione —o con un POST costruito a
 * mano verso la Server Action— potrebbe infilare nel database l'URL di una
 * qualsiasi immagine di internet, e il sito di lei la mostrerebbe come opera
 * sua. Peggio: potrebbe puntare a un server che registra chi guarda il
 * portfolio.
 *
 * La regola è una sola ed è stretta di proposito: deve venire da
 * `res.cloudinary.com` e dall'account configurato in questo progetto.
 */
export function esImagenPropia(url: string): boolean {
  const config = configCloudinary();
  if (!config) return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  return (
    parsed.protocol === "https:" &&
    parsed.hostname === "res.cloudinary.com" &&
    // Il primo tratto del percorso è il nome dell'account. Confrontare su
    // `pathname` e non sull'URL intero evita che un `?` o un `#` infilato
    // faccia passare qualcosa che non è di qui.
    parsed.pathname.startsWith(`/${config.cloudName}/`)
  );
}

/** Le misure devono essere numeri veri, non testo che sembra un numero. */
export function medidasPlausibles(img: WorkImage): boolean {
  return (
    Number.isInteger(img.width) &&
    Number.isInteger(img.height) &&
    img.width > 0 &&
    img.height > 0 &&
    img.width <= 20000 &&
    img.height <= 20000
  );
}
