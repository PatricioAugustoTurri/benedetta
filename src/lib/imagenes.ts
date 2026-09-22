import { configCloudinary } from "@/lib/cloudinary";
import type { WorkImage } from "@/lib/works";

/**
 * Qué se acepta como imagen de una obra, del lado del servidor.
 *
 * Existe porque desde que las imágenes suben directo del navegador a
 * Cloudinary, lo que llega al servidor al guardar ya no es un archivo: es una
 * dirección. Y una dirección la escribe quien manda el formulario.
 *
 * Sin esta comprobación, alguien con sesión —o con un POST armado a mano a la
 * Server Action— podría meter en la base la URL de cualquier imagen de
 * internet, y el sitio de ella la mostraría como obra suya. Peor: podría
 * apuntar a un servidor que registre quién mira el portfolio.
 *
 * La regla es una sola y es estrecha a propósito: tiene que venir de
 * `res.cloudinary.com` y de la cuenta configurada en este proyecto.
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
    // El primer tramo del camino es el nombre de la cuenta. Comparar sobre
    // `pathname` y no sobre la URL entera evita que un `?` o un `#` colado
    // haga pasar algo que no es de acá.
    parsed.pathname.startsWith(`/${config.cloudName}/`)
  );
}

/** Las medidas tienen que ser números de verdad, no texto que parezca número. */
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
