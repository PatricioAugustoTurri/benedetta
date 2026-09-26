import { createHash } from "node:crypto";

/**
 * Cloudinary, senza il pacchetto ufficiale.
 *
 * L'unica cosa che serve del suo SDK sono due operazioni —firmare un
 * caricamento e cancellare un'immagine— e tutte e due sono una firma SHA-1 e
 * un `fetch`. Portarsi dietro il pacchetto intero per questo aggiunge megabyte
 * al server e una dipendenza in più da mantenere.
 *
 * ## Perché firmata e non «unsigned»
 *
 * Cloudinary permette caricamenti senza firma con un preset aperto. Questo
 * significa che chiunque legga il codice del sito può caricare sull'account di
 * lei tutto quello che vuole: il preset è pubblico per definizione. Qui il
 * browser chiede una firma al server —che controlla la sessione prima di
 * darla—, la firma scade dopo pochi minuti e serve solo per i parametri esatti
 * che sono stati firmati.
 *
 * L'`api_secret` non esce mai dal server. Il browser vede la firma, che è un
 * digest a senso unico e non si può invertire.
 */

export type ConfigCloudinary = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

/** La cartella dell'account dove finisce l'opera. */
export const CARPETA = "illustrando/works";

export function configCloudinary(): ConfigCloudinary | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export function cloudinaryConfigurado(): boolean {
  return configCloudinary() !== null;
}

/**
 * La firma che chiede Cloudinary.
 *
 * La costruzione del testo sta nella loro documentazione e non ammette
 * varianti: si ordinano i parametri per nome, si uniscono come
 * `chiave=valore&chiave=valore`, e si attacca l'`api_secret` in fondo senza
 * separatore. Restano fuori dal calcolo `file`, `api_key`, `cloud_name` e
 * `resource_type`.
 *
 * L'algoritmo è SHA-1, che è il predefinito di Cloudinary. Un account può
 * essere configurato su SHA-256, e in quel caso la firma esce sbagliata e
 * Cloudinary risponde «Invalid Signature» —che il modulo mostra tale e quale—.
 * Per questo c'è la variabile: si mette `sha256` in .env.local e basta, senza
 * toccare il codice.
 */
function firmar(params: Record<string, string | number>, apiSecret: string): string {
  const texto = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  const algoritmo = process.env.CLOUDINARY_SIGNATURE_ALGORITHM === "sha256" ? "sha256" : "sha1";
  return createHash(algoritmo).update(texto + apiSecret).digest("hex");
}

export type PermisoDeSubida = {
  url: string;
  /**
   * Dove salgono i video. È un indirizzo a parte perché Cloudinary separa
   * immagini e video per tipo di risorsa, ma la firma è la stessa: il tipo
   * resta fuori dal calcolo.
   */
  urlVideo: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};

/**
 * Il permesso di cui il browser ha bisogno per caricare un'immagine, e
 * nient'altro.
 *
 * È legato alla cartella e al momento: Cloudinary rifiuta una firma di più di
 * un'ora, quindi un permesso trapelato smette di servire da solo. Non include
 * il nome del file —lo mette Cloudinary— né permette di sovrascrivere niente.
 */
export function permisoDeSubida(config: ConfigCloudinary): PermisoDeSubida {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: CARPETA, timestamp };

  return {
    url: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    urlVideo: `https://api.cloudinary.com/v1_1/${config.cloudName}/video/upload`,
    apiKey: config.apiKey,
    timestamp,
    signature: firmar(params, config.apiSecret),
    folder: CARPETA,
  };
}

/** Come Cloudinary chiama i due tipi di file che l'opera può avere. */
export type TipoRisorsa = "image" | "video";

/**
 * Cancella un'immagine —o un video— dall'account.
 *
 * Il tipo va detto: Cloudinary cerca il `public_id` solo fra le risorse del
 * tipo chiesto, e cancellare un video come immagine risponde «not found» e
 * lo lascia dov'è.
 *
 * Silenziosa di proposito, come la cancellazione su disco che sostituisce: che
 * l'immagine non ci sia più è il risultato cercato, e far fallire la
 * cancellazione di un'opera perché Cloudinary non ha risposto lascerebbe la
 * riga nel database per qualcosa che si può ripulire dopo a mano.
 */
export async function borrarDeCloudinary(
  publicId: string,
  tipo: TipoRisorsa = "image",
): Promise<void> {
  const config = configCloudinary();
  if (!config || !publicId) return;

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = firmar({ public_id: publicId, timestamp }, config.apiSecret);

  const cuerpo = new URLSearchParams({
    public_id: publicId,
    api_key: config.apiKey,
    timestamp: String(timestamp),
    signature,
  });

  try {
    await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/${tipo}/destroy`, {
      method: "POST",
      body: cuerpo,
    });
  } catch {
    // La riga è già cancellata; l'immagine orfana si ripulisce dal pannello.
  }
}

export type ImagenEnCuenta = {
  publicId: string;
  bytes: number;
  creada: string;
  tipo: TipoRisorsa;
};

/**
 * Quello che è conservato nella cartella d'opera dell'account.
 *
 * Usa l'API di amministrazione, che va con autenticazione basic —chiave e
 * segreto— e non con la firma. È l'unico modo per sapere cosa c'è lassù: il
 * database sa quello che *dovrebbe* esserci, e confrontare le due liste è
 * quello che scopre le immagini rimaste sciolte.
 */
export async function listarDeCloudinary(): Promise<ImagenEnCuenta[]> {
  const config = configCloudinary();
  if (!config) return [];

  const credenciales = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64");
  const imagenes: ImagenEnCuenta[] = [];

  // Immagini e video si elencano separati: l'API ne restituisce un tipo alla
  // volta, e guardare solo le immagini lascerebbe i video sciolti per sempre.
  for (const tipo of ["image", "video"] as const) {
    let cursor: string | undefined;

    // L'API pagina a gruppi di 500. Un account da portfolio non ci arriverà
    // mai, ma un ciclo che guarda solo la prima pagina cancellerebbe di meno e
    // direbbe di aver finito.
    do {
      const url = new URL(`https://api.cloudinary.com/v1_1/${config.cloudName}/resources/${tipo}`);
      url.searchParams.set("type", "upload");
      url.searchParams.set("prefix", CARPETA);
      url.searchParams.set("max_results", "500");
      if (cursor) url.searchParams.set("next_cursor", cursor);

      const respuesta = await fetch(url, { headers: { Authorization: `Basic ${credenciales}` } });
      if (!respuesta.ok) break;

      const cuerpo = (await respuesta.json()) as {
        resources?: Array<{ public_id: string; bytes: number; created_at: string }>;
        next_cursor?: string;
      };

      for (const r of cuerpo.resources ?? []) {
        imagenes.push({ publicId: r.public_id, bytes: r.bytes, creada: r.created_at, tipo });
      }
      cursor = cuerpo.next_cursor;
    } while (cursor);
  }

  return imagenes;
}
