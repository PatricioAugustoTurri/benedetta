import { unlink } from "node:fs/promises";
import path from "node:path";

/** Dove finivano i file quando l'admin salvava su disco. */
const CARPETA = path.join(process.cwd(), "public", "ilustraciones");
const PREFIJO = "/ilustraciones";

/**
 * Cancella un'immagine che vive sul disco del progetto.
 *
 * **Questa è compatibilità, non la strada attuale.** Le immagini dell'opera
 * salgono direttamente dal browser a Cloudinary e si cancellano da lì tramite
 * il loro `publicId`; quello che resta qui serve per le righe precedenti a
 * quel cambiamento, i cui URL cominciano con `/ilustraciones/`. Il giorno in
 * cui non ne resterà nessuna nel database, questo file se ne va per intero.
 *
 * Silenziosa di proposito: che il file non ci sia più è il risultato cercato,
 * e far fallire la cancellazione di un'opera perché il suo file non si trova
 * lascerebbe la riga nel database per un problema che non conta. Tocca solo
 * quello che sta dentro public/ilustraciones/, quindi un URL di altra
 * provenienza non fa niente.
 */
export async function borrarImagen(url: string): Promise<void> {
  if (!url.startsWith(`${PREFIJO}/`)) return;

  const nombre = path.basename(url);
  const destino = path.join(CARPETA, nombre);

  // Dopo la risoluzione: se il nome portava qualcosa di strano ed è uscito
  // dalla cartella, qui si nota e non si cancella niente.
  if (path.dirname(path.resolve(destino)) !== path.resolve(CARPETA)) return;

  try {
    await unlink(destino);
  } catch {
    // Non c'era. Che non ci sia è quello che si voleva.
  }
}
