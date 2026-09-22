import { unlink } from "node:fs/promises";
import path from "node:path";

/** Dónde caían los archivos cuando el admin guardaba en disco. */
const CARPETA = path.join(process.cwd(), "public", "ilustraciones");
const PREFIJO = "/ilustraciones";

/**
 * Borra una imagen que vive en el disco del proyecto.
 *
 * **Esto es compatibilidad, no el camino actual.** Las imágenes de la obra
 * suben directo del navegador a Cloudinary y se borran de allá por su
 * `publicId`; lo que queda acá es para las filas anteriores a ese cambio,
 * cuyas URL empiezan con `/ilustraciones/`. El día que no quede ninguna en la
 * base, este archivo se va entero.
 *
 * Silenciosa a propósito: que el archivo ya no esté es el resultado buscado,
 * y hacer fallar el borrado de una obra porque su archivo no aparece deja la
 * fila en la base por un problema que no importa. Sólo toca lo que está
 * dentro de public/ilustraciones/, así que una URL de otro lado no hace nada.
 */
export async function borrarImagen(url: string): Promise<void> {
  if (!url.startsWith(`${PREFIJO}/`)) return;

  const nombre = path.basename(url);
  const destino = path.join(CARPETA, nombre);

  // Después de resolver: si el nombre traía algo raro y se fue de la carpeta,
  // acá se nota y no se borra nada.
  if (path.dirname(path.resolve(destino)) !== path.resolve(CARPETA)) return;

  try {
    await unlink(destino);
  } catch {
    // No estaba. Que no esté es lo que se quería.
  }
}
