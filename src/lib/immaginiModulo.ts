import { borrarDeCloudinary } from "@/lib/cloudinary";
import { esImagenPropia, medidasPlausibles } from "@/lib/imagenes";
import { borrarImagen } from "@/lib/uploads";
import { esVideo } from "@/lib/video";
import type { WorkImage } from "@/lib/works";

/*
  Quello che le azioni dell'admin fanno con le immagini di un modulo:
  leggerle senza crederci, e toglierle da dove stanno. Lo usano le opere e i
  prodotti dello Shop, che caricano con lo stesso campo (CampoImmagini).

  Non è un file "use server": esporta funzioni che girano dentro un'azione,
  non azioni che il browser possa chiamare da solo.
*/

/**
 * Costruisce la lista delle immagini a partire dal modulo.
 *
 * Non arrivano più file: arrivano indirizzi di Cloudinary, perché il browser
 * ha caricato ogni immagine appena è stata scelta. Quello che viaggia è
 * l'ordine, il testo alternativo e, per ognuna, l'URL, le misure restituite da
 * Cloudinary e il suo nome dentro l'account.
 *
 * **Tutto questo lo scrive il client, quindi non si crede a niente senza
 * guardarlo.** Una Server Action si può invocare con un POST costruito a mano;
 * se questa funzione si fidasse di quello che riceve, chiunque con una
 * sessione potrebbe infilare nell'archivio l'URL di un'immagine altrui, o di
 * un server che registra chi entra.
 */
export function armarImagenes(formData: FormData): WorkImage[] {
  const crudo = String(formData.get("imagenes") ?? "[]");

  let lista: unknown;
  try {
    lista = JSON.parse(crudo);
  } catch {
    throw new ErrorDeImagenes("La lista delle immagini non si è capita.");
  }

  if (!Array.isArray(lista)) throw new ErrorDeImagenes("La lista delle immagini è arrivata male.");

  return lista.map((item, i) => {
    const n = i + 1;
    if (typeof item !== "object" || item === null) {
      throw new ErrorDeImagenes(`L’immagine ${n} è arrivata male.`);
    }

    const { url, alt, width, height, publicId, tipo } = item as Record<string, unknown>;
    const video = tipo === "video";

    if (typeof url !== "string" || !esImagenPropia(url)) {
      throw new ErrorDeImagenes(
        `L’immagine ${n} non viene dal tuo account Cloudinary. Caricala di nuovo.`,
      );
    }

    /*
      Il tipo lo dichiara il client, quindi si confronta con l'indirizzo, che
      Cloudinary scrive con il tipo dentro. Un video dichiarato immagine
      finirebbe dentro un <img> che non lo mostra; un'immagine dichiarata
      video, dentro un <video> che resta nero.
    */
    if (video !== new URL(url).pathname.includes("/video/upload/")) {
      throw new ErrorDeImagenes(`Il pezzo ${n} non è quello che dice di essere. Caricalo di nuovo.`);
    }

    const imagen: WorkImage = {
      url,
      alt: typeof alt === "string" ? alt : "",
      width: Number(width),
      height: Number(height),
      ...(typeof publicId === "string" && publicId.length > 0 ? { publicId } : {}),
      ...(video ? { tipo: "video" as const } : {}),
    };

    if (!medidasPlausibles(imagen)) {
      throw new ErrorDeImagenes(`Le misure dell’immagine ${n} non si sono lette bene.`);
    }

    return imagen;
  });
}

/** Un problema con quello che il modulo ha mandato come immagini. */
export class ErrorDeImagenes extends Error {}

/**
 * Toglie un'immagine da dovunque si trovi.
 *
 * Ci sono due provenienze possibili e l'URL dice quale: le nuove vivono su
 * Cloudinary e si cancellano tramite il loro `publicId`; quelle rimaste da
 * quando l'admin salvava su disco cominciano con `/ilustraciones/` e si
 * cancellano dal filesystem. Una sola funzione per entrambe, perché chi
 * cancella un'opera non deve sapere da dove è uscita ogni foto.
 */
export async function quitarImagen(img: WorkImage): Promise<void> {
  if (img.publicId) return borrarDeCloudinary(img.publicId, esVideo(img) ? "video" : "image");
  if (img.url.startsWith("/")) return borrarImagen(img.url);
}
