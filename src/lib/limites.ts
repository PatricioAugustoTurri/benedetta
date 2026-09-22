/**
 * Los topes de subida.
 *
 * Cambiaron de sentido cuando las imágenes pasaron a subir directo del
 * navegador a Cloudinary. Antes el archivo atravesaba el servidor de Next y
 * el número que importaba era cuánto cuerpo aceptaba una Server Action; ahora
 * el archivo no lo toca, y lo único que viaja al guardar es un JSON de unos
 * cientos de bytes con direcciones y medidas.
 */

/**
 * Lo que puede pesar una imagen sola.
 *
 * El número no lo elegí yo: es el techo del plan gratuito de Cloudinary para
 * imágenes. Comprobarlo acá antes de subir no es desconfianza, es cortesía —
 * decirle a alguien que su archivo es muy grande después de hacerle esperar
 * la subida entera es la peor forma de decírselo.
 *
 * Si el plan de la cuenta sube, este número sube con él y nada más cambia.
 */
export const MAX_ARCHIVO_MB = 10;

/**
 * Lo que acepta el framework en el cuerpo de una Server Action.
 *
 * Next trae 1 MB. Dos alcanzan de sobra para el JSON de una obra con muchas
 * imágenes, y dejarlo bajo es deliberado: un tope alto en una acción que ya
 * no recibe archivos sólo agranda lo que alguien podría mandarle al servidor.
 */
export const MAX_CUERPO_MB = 2;

export const MB = 1024 * 1024;

/** Para los mensajes: «2,4 MB» y no «2516582 bytes». */
export function enMB(bytes: number): string {
  return `${(bytes / MB).toFixed(1)} MB`;
}
