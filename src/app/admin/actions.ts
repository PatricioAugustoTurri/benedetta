"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, closeSession, openSession, requireSession } from "@/lib/auth";
import {
  borrarDeCloudinary,
  configCloudinary,
  listarDeCloudinary,
  permisoDeSubida,
  type PermisoDeSubida,
} from "@/lib/cloudinary";
import { esImagenPropia, medidasPlausibles } from "@/lib/imagenes";
import { borrarImagen } from "@/lib/uploads";
import {
  createWork,
  deleteWork,
  getWorkById,
  listWorks,
  reorderWorks,
  updateWork,
  type WorkImage,
} from "@/lib/works";

/**
 * Lo que devuelve una acción de formulario. `useActionState` lo recibe en el
 * cliente y la pantalla muestra `error` donde corresponda.
 */
export type EstadoFormulario = { error?: string; ok?: boolean };

/*
  Cada acción vuelve a comprobar la sesión. No es redundante con proxy.ts: una
  Server Action es un POST a una dirección propia y se puede invocar sin pasar
  por ninguna página, así que el proxy no la ve. La documentación de Next lo
  dice con todas las letras, y es el error de seguridad más común del patrón.
*/

/* ----------------------------------------------------------------- acceso */

export async function entrar(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const clave = String(formData.get("clave") ?? "");

  if (clave.length === 0) return { error: "Escribí la clave." };
  if (!checkPassword(clave)) return { error: "Esa clave no es." };

  await openSession();

  const desde = String(formData.get("desde") ?? "");
  redirect(desde.startsWith("/admin") ? desde : "/admin");
}

export async function salir(): Promise<void> {
  await closeSession();
  redirect("/admin/login");
}

/* --------------------------------------------------------- subida directa */

/**
 * El permiso para que el navegador suba una imagen a Cloudinary.
 *
 * El archivo no pasa por este servidor: el navegador lo manda directo. Eso
 * es lo que hace que un escaneo de 30 MB suba sin chocar contra el tope del
 * cuerpo de una Server Action, y lo que deja el proyecto sin una carpeta de
 * fotos que crece sola.
 *
 * Lo que sí pasa por acá es la autorización. La firma se calcula con el
 * secreto de la cuenta, que nunca sale del servidor, y sólo se entrega a
 * quien ya tiene sesión: sin esto, el formulario sería una puerta abierta
 * para subir cualquier cosa a la cuenta de ella.
 */
export async function pedirPermisoDeSubida(): Promise<
  { ok: true; permiso: PermisoDeSubida } | { ok: false; error: string }
> {
  await requireSession();

  const config = configCloudinary();
  if (!config) {
    return {
      ok: false,
      error:
        "Faltan las claves de Cloudinary. Completá CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en .env.local y reiniciá el servidor.",
    };
  }

  return { ok: true, permiso: permisoDeSubida(config) };
}

/**
 * Saca de Cloudinary una imagen que se quitó del formulario antes de guardar.
 *
 * Como la subida ocurre al elegir el archivo y no al guardar, quitar una
 * imagen del formulario deja una huérfana en la cuenta. Esto la limpia en el
 * momento. No devuelve nada ni falla: es limpieza, no una operación que la
 * pantalla esté esperando.
 */
export async function descartarImagen(publicId: string): Promise<void> {
  await requireSession();
  await borrarDeCloudinary(publicId);
}

/* --------------------------------------------------- imágenes sueltas */

/**
 * Cuánto margen se le da a una imagen recién subida antes de considerarla
 * suelta. Una hora.
 *
 * No es prudencia de más: las imágenes suben al elegirlas y la obra se guarda
 * después, así que mientras alguien está llenando el formulario hay imágenes
 * en Cloudinary que todavía no figuran en ninguna fila. Sin este margen, una
 * limpieza hecha en ese momento le borraría las fotos a quien está cargando.
 */
const MARGEN_MS = 60 * 60 * 1000;

export type Limpieza = {
  /** Borradas de verdad. */
  borradas: number;
  /** Lo que ocupaban. */
  bytes: number;
  /**
   * Sueltas que existen pero todavía no se tocan por ser de hace poco.
   *
   * Se informa aparte y no se suma a las borradas porque decir «no había
   * ninguna» cuando hay tres esperando el margen es mentir: quien lo lee
   * concluiría que la cuenta está limpia y no volvería a mirar.
   */
  recientes: number;
  error?: string;
};

/**
 * Busca imágenes en Cloudinary que ninguna obra nombra, y las borra.
 *
 * Existen porque las imágenes suben al elegirlas: si alguien elige tres
 * escaneos y cierra la pestaña sin guardar, esos tres quedan ocupando la
 * cuenta sin que nada los reclame. Quitar una imagen del formulario ya la
 * borra en el momento; esto es para lo que no pasó por ahí.
 *
 * Compara contra **todas** las obras, no contra una: una imagen puede estar
 * en cualquier fila, y mirar sólo la que se está editando borraría las de las
 * demás.
 */
export async function limpiarSueltas(): Promise<Limpieza> {
  await requireSession();

  if (!configCloudinary()) {
    return { borradas: 0, bytes: 0, recientes: 0, error: "Faltan las claves de Cloudinary." };
  }

  let enUso: Set<string>;
  try {
    const obras = await listWorks();
    enUso = new Set(
      obras.flatMap((o) => o.image.map((i) => i.publicId).filter((id): id is string => !!id)),
    );
  } catch {
    // Sin la lista de lo que está en uso, cualquier borrado sería a ciegas.
    return {
      borradas: 0,
      bytes: 0,
      recientes: 0,
      error: "No se pudo leer la base. No se borró nada.",
    };
  }

  const corte = Date.now() - MARGEN_MS;
  const sueltas = (await listarDeCloudinary()).filter((img) => !enUso.has(img.publicId));
  const [maduras, recientes] = [
    sueltas.filter((img) => new Date(img.creada).getTime() < corte),
    sueltas.filter((img) => new Date(img.creada).getTime() >= corte),
  ];

  await Promise.all(maduras.map((img) => borrarDeCloudinary(img.publicId)));
  revalidatePath("/admin");

  return {
    borradas: maduras.length,
    bytes: maduras.reduce((t, i) => t + i.bytes, 0),
    recientes: recientes.length,
  };
}

/* ------------------------------------------------------------ validación */

/*
  Las mismas reglas que tiene la tabla, acá arriba y en castellano. La base
  sigue siendo la que manda —si algo se escapa, el CHECK lo frena igual— pero
  un error de Postgres en pantalla no le dice a nadie qué corregir.
*/
function validar(campos: {
  slug: string;
  title: string;
  year: string;
  tecnica: string;
}): string | null {
  if (campos.title.trim().length === 0) return "La obra necesita un título.";

  if (campos.slug.trim().length === 0) return "Falta la dirección de la obra.";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(campos.slug)) {
    return "La dirección sólo admite minúsculas, números y guiones: «jardin-nocturno».";
  }

  const year = Number(campos.year);
  if (!Number.isInteger(year)) return "El año tiene que ser un número.";
  if (year < 1900 || year > 2200) return "Ese año no puede ser.";

  if (campos.tecnica.trim().length === 0) return "Falta la técnica.";

  return null;
}

/**
 * Arma la lista de imágenes a partir del formulario.
 *
 * Ya no llegan archivos: llegan direcciones de Cloudinary, porque el
 * navegador subió cada imagen apenas la eligió. Lo que viaja es el orden, el
 * texto alternativo y, por cada una, la URL, las medidas que devolvió
 * Cloudinary y su nombre dentro de la cuenta.
 *
 * **Todo eso lo escribe el cliente, así que nada se cree sin mirarlo.** Una
 * Server Action se puede invocar con un POST armado a mano; si esta función
 * confiara en lo que recibe, cualquiera con sesión podría meter en el archivo
 * la URL de una imagen ajena, o de un servidor que registre quién entra.
 */
function armarImagenes(formData: FormData): WorkImage[] {
  const crudo = String(formData.get("imagenes") ?? "[]");

  let lista: unknown;
  try {
    lista = JSON.parse(crudo);
  } catch {
    throw new ErrorDeImagenes("No se entendió la lista de imágenes.");
  }

  if (!Array.isArray(lista)) throw new ErrorDeImagenes("La lista de imágenes vino mal.");

  return lista.map((item, i) => {
    const n = i + 1;
    if (typeof item !== "object" || item === null) {
      throw new ErrorDeImagenes(`La imagen ${n} vino mal.`);
    }

    const { url, alt, width, height, publicId } = item as Record<string, unknown>;

    if (typeof url !== "string" || !esImagenPropia(url)) {
      throw new ErrorDeImagenes(
        `La imagen ${n} no viene de tu cuenta de Cloudinary. Volvé a subirla.`,
      );
    }

    const imagen: WorkImage = {
      url,
      alt: typeof alt === "string" ? alt : "",
      width: Number(width),
      height: Number(height),
      ...(typeof publicId === "string" && publicId.length > 0 ? { publicId } : {}),
    };

    if (!medidasPlausibles(imagen)) {
      throw new ErrorDeImagenes(`No se leyeron bien las medidas de la imagen ${n}.`);
    }

    return imagen;
  });
}

/** Un problema con lo que el formulario mandó como imágenes. */
class ErrorDeImagenes extends Error {}

/* ------------------------------------------------------------ alta/edición */

export async function guardarObra(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireSession();

  const idCrudo = String(formData.get("id") ?? "");
  const id = idCrudo.length > 0 ? Number(idCrudo) : null;

  const campos = {
    slug: String(formData.get("slug") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    year: String(formData.get("year") ?? "").trim(),
    tecnica: String(formData.get("tecnica") ?? "").trim(),
  };

  const problema = validar(campos);
  if (problema) return { error: problema };

  const descripcion = String(formData.get("description") ?? "").trim();

  let imagenes: WorkImage[];
  try {
    imagenes = armarImagenes(formData);
  } catch (e) {
    return { error: e instanceof ErrorDeImagenes ? e.message : "No se entendieron las imágenes." };
  }

  if (imagenes.length === 0) {
    return { error: "La obra necesita al menos una imagen: es la que sale en la grilla." };
  }

  const entrada = {
    slug: campos.slug,
    title: campos.title,
    description: descripcion.length > 0 ? descripcion : null,
    image: imagenes,
    year: Number(campos.year),
    tecnica: campos.tecnica,
  };

  const anterior = id !== null ? await getWorkById(id) : null;

  try {
    if (id !== null) {
      await updateWork(id, entrada);
    } else {
      await createWork(entrada);
    }
  } catch (e) {
    // Las imágenes que se acababan de subir ya no tienen dueño: si quedan,
    // la cuenta de Cloudinary junta fotos de obras que nunca entraron.
    const nuevas = imagenes.filter((img) => !anterior?.image.some((v) => v.url === img.url));
    await Promise.all(nuevas.map(quitarImagen));

    const mensaje = e instanceof Error ? e.message : "";
    if (mensaje.includes("works_slug_key")) {
      return { error: `Ya hay una obra en «${campos.slug}». Cambiale la dirección.` };
    }
    return { error: "La base rechazó la obra. Revisá los campos." };
  }

  // Las imágenes que la edición dejó afuera.
  if (anterior) {
    const sobrantes = anterior.image.filter((v) => !imagenes.some((img) => img.url === v.url));
    await Promise.all(sobrantes.map(quitarImagen));
  }

  revalidar(campos.slug, anterior?.slug);
  redirect("/admin");
}

/* ------------------------------------------------------------------ baja */

export async function borrarObra(formData: FormData): Promise<void> {
  await requireSession();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const borrada = await deleteWork(id);
  if (!borrada) return;

  // Las imágenes se van con la obra: dejarlas sería juntar archivos que ya
  // no se pueden alcanzar desde ningún lado.
  await Promise.all(borrada.image.map(quitarImagen));

  revalidar(borrada.slug);
  redirect("/admin");
}

/* ------------------------------------------------------------ el orden */

/**
 * Cómo se sale de un guardado que falló.
 *
 * Viaja con el error porque no todas las fallas se salen igual, y ofrecer la
 * salida equivocada es peor que no ofrecer ninguna: un «Reintentar» sobre un
 * orden que la base ya rechazó por viejo vuelve a fallar exactamente igual, y
 * el segundo mensaje idéntico hace pensar que la pantalla está rota.
 */
export type Salida = "reintentar" | "recargar";

/**
 * Guarda el orden de la grilla. `orden` son los ids de todas las obras, de la
 * primera a la última.
 *
 * Lo llama la pantalla al soltar una pieza, no un formulario: por eso recibe
 * un arreglo y devuelve un resultado en vez de redirigir. Quien arrastra ya
 * está mirando el resultado —la grilla se acomodó al soltar—, así que lo
 * único que falta contarle es si eso quedó escrito.
 */
export async function reordenarArchivo(
  orden: number[],
): Promise<{ ok: true } | { ok: false; error: string; salida: Salida }> {
  await requireSession();

  /*
    Una Server Action es un POST a una dirección propia: lo que llega puede
    venir de cualquier lado, no sólo de la pantalla que la escribió. Que sean
    enteros se comprueba acá; que sean *estas* obras y estén todas, lo
    comprueba reorderWorks contra la tabla, que es lo único que lo sabe.
  */
  if (!Array.isArray(orden) || orden.some((id) => !Number.isInteger(id))) {
    return { ok: false, error: "El orden vino mal.", salida: "reintentar" };
  }

  let guardado: boolean;
  try {
    guardado = await reorderWorks(orden);
  } catch {
    return { ok: false, error: "La base no aceptó el orden.", salida: "reintentar" };
  }

  /*
    El rechazo tiene una sola causa práctica: la lista se armó cuando se abrió
    la pantalla, y desde entonces el archivo cambió —otra pestaña, otro rato—.
    Reintentar mandaría la misma lista vieja y fallaría igual, así que la
    salida es recargar.

    El mensaje dice las dos cosas que ella necesita saber y ninguna es
    obvia: que esto **no quedó escrito**, y que recargar descarta lo que
    acomodó. Puede haber sido media hora de trabajo, y «el archivo cambió»
    a secas se lee como un aviso, no como una pérdida.
  */
  if (!guardado) {
    return {
      ok: false,
      error:
        "El archivo cambió desde que abriste esta pantalla, así que este orden no se guardó. " +
        "Recargá y volvé a acomodarlo sobre lo que hay ahora.",
      salida: "recargar",
    };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  /*
    Y cada página de obra, porque el paginado de abajo —la anterior y la
    siguiente— sale del mismo orden que la grilla. Sin esto, mover una pieza
    dejaría todas las fichas apuntando a vecinas que ya no lo son. Se
    revalida la ruta entera y no un slug: cambió el orden, así que no hay
    ninguna que se salve.
  */
  revalidatePath("/opera/[slug]", "page");

  return { ok: true };
}

/* --------------------------------------------------------------- limpieza */

/**
 * Saca una imagen de donde esté.
 *
 * Hay dos procedencias posibles y la URL dice cuál: las nuevas viven en
 * Cloudinary y se borran por su `publicId`; las que quedaron de cuando el
 * admin guardaba en disco empiezan con `/ilustraciones/` y se borran del
 * sistema de archivos. Una sola función para las dos, porque quien borra una
 * obra no tiene por qué saber de dónde salió cada foto.
 */
async function quitarImagen(img: WorkImage): Promise<void> {
  if (img.publicId) return borrarDeCloudinary(img.publicId);
  if (img.url.startsWith("/")) return borrarImagen(img.url);
}

/* --------------------------------------------------------------- refresco */

/*
  La portada y la página de la obra se rehacen. Si la edición cambió el slug,
  también hay que rehacer la dirección vieja: ahí quedó una página que ahora
  es un 404 y seguiría mostrándose de la caché.
*/
function revalidar(slug: string, slugAnterior?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/opera/${slug}`);
  if (slugAnterior && slugAnterior !== slug) revalidatePath(`/opera/${slugAnterior}`);
}
