/**
 * I limiti di caricamento.
 *
 * Hanno cambiato senso quando le immagini sono passate a salire direttamente
 * dal browser a Cloudinary. Prima il file attraversava il server di Next e il
 * numero che contava era quanto corpo accettasse una Server Action; adesso il
 * file non lo tocca, e l'unica cosa che viaggia al salvataggio è un JSON di
 * qualche centinaio di byte con indirizzi e misure.
 */

/**
 * Quanto può pesare una singola immagine.
 *
 * Il numero non l'ho scelto io: è il tetto del piano gratuito di Cloudinary
 * per le immagini. Controllarlo qui prima di caricare non è diffidenza, è
 * cortesia — dire a qualcuno che il suo file è troppo grande dopo avergli
 * fatto aspettare l'intero caricamento è il modo peggiore per dirglielo.
 *
 * Se il piano dell'account sale, questo numero sale con lui e non cambia
 * nient'altro.
 */
export const MAX_ARCHIVO_MB = 10;

/**
 * Quanto può pesare un video. Stessa origine del numero sopra: è il tetto del
 * piano gratuito di Cloudinary per i video. Oltre quel peso Cloudinary esige
 * il caricamento a pezzi, che questo modulo non fa.
 */
export const MAX_VIDEO_MB = 100;

/**
 * Quello che il framework accetta nel corpo di una Server Action.
 *
 * Next porta 1 MB. Due bastano e avanzano per il JSON di un'opera con molte
 * immagini, e tenerlo basso è deliberato: un limite alto su un'azione che non
 * riceve più file non fa che ingrandire quello che qualcuno potrebbe mandare
 * al server.
 */
export const MAX_CUERPO_MB = 2;

export const MB = 1024 * 1024;

/** Per i messaggi: «2,4 MB» e non «2516582 byte». */
export function enMB(bytes: number): string {
  return `${(bytes / MB).toFixed(1)} MB`;
}
