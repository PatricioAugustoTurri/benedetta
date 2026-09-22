import { createHash } from "node:crypto";

/**
 * Cloudinary, sin el paquete oficial.
 *
 * Lo único que hace falta de su SDK son dos cosas —firmar una subida y borrar
 * una imagen— y las dos son una firma SHA-1 y un `fetch`. Traer el paquete
 * entero para eso agrega megabytes al servidor y una dependencia más que
 * mantener.
 *
 * ## Por qué firmada y no «unsigned»
 *
 * Cloudinary permite subidas sin firma con un preset abierto. Eso significa
 * que cualquiera que lea el código del sitio puede subir a la cuenta de ella
 * todo lo que quiera: el preset es público por definición. Acá el navegador
 * pide una firma al servidor —que comprueba la sesión antes de darla—, la
 * firma vence a los pocos minutos y sólo sirve para los parámetros exactos
 * que se firmaron.
 *
 * El `api_secret` nunca sale del servidor. El navegador ve la firma, que es
 * un resumen de un solo sentido y no se puede revertir.
 */

export type ConfigCloudinary = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

/** La carpeta de la cuenta donde cae la obra. */
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
 * La firma que pide Cloudinary.
 *
 * El armado del texto está en su documentación y no admite variantes: se
 * ordenan los parámetros por nombre, se unen como `clave=valor&clave=valor`,
 * y se le pega el `api_secret` al final sin separador. Quedan fuera del
 * cálculo `file`, `api_key`, `cloud_name` y `resource_type`.
 *
 * El algoritmo es SHA-1, que es el predeterminado de Cloudinary. Una cuenta
 * puede estar configurada en SHA-256, y en ese caso la firma sale mal y
 * Cloudinary contesta «Invalid Signature» —que el formulario muestra tal
 * cual—. Para eso está la variable: se pone `sha256` en .env.local y listo,
 * sin tocar código.
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
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};

/**
 * El permiso que el navegador necesita para subir una imagen, y nada más.
 *
 * Va atado a la carpeta y al momento: Cloudinary rechaza una firma de más de
 * una hora, así que un permiso filtrado deja de servir solo. No incluye el
 * nombre del archivo —lo pone Cloudinary— ni permite sobrescribir nada.
 */
export function permisoDeSubida(config: ConfigCloudinary): PermisoDeSubida {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: CARPETA, timestamp };

  return {
    url: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    apiKey: config.apiKey,
    timestamp,
    signature: firmar(params, config.apiSecret),
    folder: CARPETA,
  };
}

/**
 * Borra una imagen de la cuenta.
 *
 * Silenciosa a propósito, como el borrado en disco al que reemplaza: que la
 * imagen ya no esté es el resultado buscado, y hacer fallar el borrado de una
 * obra porque Cloudinary no contestó dejaría la fila en la base por algo que
 * se puede limpiar después a mano.
 */
export async function borrarDeCloudinary(publicId: string): Promise<void> {
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
    await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`, {
      method: "POST",
      body: cuerpo,
    });
  } catch {
    // La fila ya se borró; la imagen huérfana se limpia desde el panel.
  }
}

export type ImagenEnCuenta = { publicId: string; bytes: number; creada: string };

/**
 * Lo que hay guardado en la carpeta de obra de la cuenta.
 *
 * Usa la API de administración, que va con autenticación básica —clave y
 * secreto— y no con firma. Es la única forma de saber qué hay allá arriba:
 * la base de datos sabe lo que *debería* haber, y comparar las dos listas es
 * lo que descubre las imágenes que quedaron sueltas.
 */
export async function listarDeCloudinary(): Promise<ImagenEnCuenta[]> {
  const config = configCloudinary();
  if (!config) return [];

  const credenciales = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64");
  const imagenes: ImagenEnCuenta[] = [];
  let cursor: string | undefined;

  // La API pagina de a 500. Una cuenta de portfolio no va a llegar nunca,
  // pero un bucle que sólo mira la primera página borraría de menos y diría
  // que terminó.
  do {
    const url = new URL(`https://api.cloudinary.com/v1_1/${config.cloudName}/resources/image`);
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
      imagenes.push({ publicId: r.public_id, bytes: r.bytes, creada: r.created_at });
    }
    cursor = cuerpo.next_cursor;
  } while (cursor);

  return imagenes;
}
