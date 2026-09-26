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
  type TipoRisorsa,
} from "@/lib/cloudinary";
import { esImagenPropia, medidasPlausibles } from "@/lib/imagenes";
import { esVideo } from "@/lib/video";
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
 * Quello che restituisce un'azione di modulo. `useActionState` lo riceve sul
 * client e la schermata mostra `error` dove serve.
 */
export type EstadoFormulario = { error?: string; ok?: boolean };

/*
  Ogni azione ricontrolla la sessione. Non è ridondante con proxy.ts: una
  Server Action è un POST a un indirizzo proprio e si può invocare senza
  passare da nessuna pagina, quindi il proxy non la vede. La documentazione di
  Next lo dice a chiare lettere, ed è l'errore di sicurezza più comune di
  questo schema.
*/

/* ----------------------------------------------------------------- accesso */

export async function entrar(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const clave = String(formData.get("clave") ?? "");

  if (clave.length === 0) return { error: "Scrivi la password." };
  if (!checkPassword(clave)) return { error: "Questa password non è quella giusta." };

  await openSession();

  const desde = String(formData.get("desde") ?? "");
  redirect(desde.startsWith("/admin") ? desde : "/admin");
}

export async function salir(): Promise<void> {
  await closeSession();
  redirect("/admin/login");
}

/* ------------------------------------------------------ caricamento diretto */

/**
 * Il permesso perché il browser carichi un'immagine su Cloudinary.
 *
 * Il file non passa da questo server: il browser lo manda direttamente. È
 * questo che permette a una scansione da 30 MB di salire senza sbattere contro
 * il limite del corpo di una Server Action, ed è questo che lascia il progetto
 * senza una cartella di foto che cresce da sola.
 *
 * Quello che passa di qui è invece l'autorizzazione. La firma si calcola con
 * il segreto dell'account, che non esce mai dal server, e si consegna solo a
 * chi ha già una sessione: senza questo, il modulo sarebbe una porta aperta
 * per caricare qualsiasi cosa sull'account di lei.
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
        "Mancano le chiavi di Cloudinary. Completa CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET in .env.local e riavvia il server.",
    };
  }

  return { ok: true, permiso: permisoDeSubida(config) };
}

/**
 * Toglie da Cloudinary un'immagine che è stata rimossa dal modulo prima del
 * salvataggio.
 *
 * Siccome il caricamento avviene quando si sceglie il file e non quando si
 * salva, togliere un'immagine dal modulo ne lascia una orfana sull'account.
 * Questo la ripulisce sul momento. Non restituisce niente e non fallisce: è
 * pulizia, non un'operazione che la schermata stia aspettando.
 */
export async function descartarImagen(publicId: string, tipo: TipoRisorsa = "image"): Promise<void> {
  await requireSession();
  await borrarDeCloudinary(publicId, tipo === "video" ? "video" : "image");
}

/* --------------------------------------------------- immagini sciolte */

/**
 * Quanto margine si dà a un'immagine appena caricata prima di considerarla
 * sciolta. Un'ora.
 *
 * Non è prudenza di troppo: le immagini salgono quando si scelgono e l'opera
 * si salva dopo, quindi mentre qualcuno sta compilando il modulo ci sono
 * immagini su Cloudinary che non figurano ancora in nessuna riga. Senza questo
 * margine, una pulizia fatta in quel momento cancellerebbe le foto a chi sta
 * caricando.
 */
const MARGEN_MS = 60 * 60 * 1000;

export type Limpieza = {
  /** Cancellate davvero. */
  borradas: number;
  /** Quello che occupavano. */
  bytes: number;
  /**
   * Sciolte che esistono ma non si toccano ancora perché sono recenti.
   *
   * Si segnala a parte e non si somma alle cancellate perché dire «non ce
   * n'era nessuna» quando ce ne sono tre in attesa del margine è mentire: chi
   * legge concluderebbe che l'account è pulito e non tornerebbe a guardare.
   */
  recientes: number;
  error?: string;
};

/**
 * Cerca su Cloudinary le immagini che nessuna opera nomina, e le cancella.
 *
 * Esistono perché le immagini salgono quando si scelgono: se qualcuno sceglie
 * tre scansioni e chiude la scheda senza salvare, quelle tre restano a
 * occupare l'account senza che niente le reclami. Togliere un'immagine dal
 * modulo la cancella già sul momento; questo serve per quello che non è
 * passato di lì.
 *
 * Confronta con **tutte** le opere, non con una: un'immagine può stare in
 * qualsiasi riga, e guardare solo quella che si sta modificando cancellerebbe
 * quelle delle altre.
 */
export async function limpiarSueltas(): Promise<Limpieza> {
  await requireSession();

  if (!configCloudinary()) {
    return { borradas: 0, bytes: 0, recientes: 0, error: "Mancano le chiavi di Cloudinary." };
  }

  let enUso: Set<string>;
  try {
    const obras = await listWorks();
    enUso = new Set(
      obras.flatMap((o) => o.image.map((i) => i.publicId).filter((id): id is string => !!id)),
    );
  } catch {
    // Senza la lista di quello che è in uso, qualsiasi cancellazione sarebbe
    // alla cieca.
    return {
      borradas: 0,
      bytes: 0,
      recientes: 0,
      error: "Non è stato possibile leggere il database. Non è stato cancellato niente.",
    };
  }

  const corte = Date.now() - MARGEN_MS;
  const sueltas = (await listarDeCloudinary()).filter((img) => !enUso.has(img.publicId));
  const [maduras, recientes] = [
    sueltas.filter((img) => new Date(img.creada).getTime() < corte),
    sueltas.filter((img) => new Date(img.creada).getTime() >= corte),
  ];

  await Promise.all(maduras.map((img) => borrarDeCloudinary(img.publicId, img.tipo)));
  revalidatePath("/admin");

  return {
    borradas: maduras.length,
    bytes: maduras.reduce((t, i) => t + i.bytes, 0),
    recientes: recientes.length,
  };
}

/* ------------------------------------------------------------ validazione */

/*
  Le stesse regole che ha la tabella, qui sopra e in parole comprensibili. Il
  database resta quello che comanda —se qualcosa sfugge, il CHECK lo ferma lo
  stesso— ma un errore di Postgres a schermo non dice a nessuno cosa
  correggere.
*/
function validar(campos: {
  slug: string;
  title: string;
  year: string;
  tecnica: string;
}): string | null {
  if (campos.title.trim().length === 0) return "L’opera ha bisogno di un titolo.";

  if (campos.slug.trim().length === 0) return "Manca l’indirizzo dell’opera.";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(campos.slug)) {
    return "L’indirizzo ammette solo minuscole, numeri e trattini: «giardino-notturno».";
  }

  const year = Number(campos.year);
  if (!Number.isInteger(year)) return "L’anno deve essere un numero.";
  if (year < 1900 || year > 2200) return "Questo anno non può essere giusto.";

  if (campos.tecnica.trim().length === 0) return "Manca la tecnica.";

  return null;
}

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
function armarImagenes(formData: FormData): WorkImage[] {
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
class ErrorDeImagenes extends Error {}

/* ---------------------------------------------------- inserimento/modifica */

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
    return { error: e instanceof ErrorDeImagenes ? e.message : "Le immagini non si sono capite." };
  }

  if (imagenes.length === 0) {
    return {
      error: "L’opera ha bisogno di almeno un’immagine o un video: è quello che esce nella griglia.",
    };
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
    // Le immagini appena caricate non hanno più un padrone: se restano,
    // l'account Cloudinary raccoglie foto di opere che non sono mai entrate.
    const nuevas = imagenes.filter((img) => !anterior?.image.some((v) => v.url === img.url));
    await Promise.all(nuevas.map(quitarImagen));

    const mensaje = e instanceof Error ? e.message : "";
    if (mensaje.includes("works_slug_key")) {
      return { error: `C’è già un’opera su «${campos.slug}». Cambiale l’indirizzo.` };
    }
    return { error: "Il database ha rifiutato l’opera. Controlla i campi." };
  }

  // Le immagini che la modifica ha lasciato fuori.
  if (anterior) {
    const sobrantes = anterior.image.filter((v) => !imagenes.some((img) => img.url === v.url));
    await Promise.all(sobrantes.map(quitarImagen));
  }

  revalidar(campos.slug, anterior?.slug);
  redirect("/admin");
}

/* ------------------------------------------------------------ eliminazione */

export async function borrarObra(formData: FormData): Promise<void> {
  await requireSession();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const borrada = await deleteWork(id);
  if (!borrada) return;

  // Le immagini se ne vanno con l'opera: lasciarle sarebbe accumulare file
  // che non si possono più raggiungere da nessuna parte.
  await Promise.all(borrada.image.map(quitarImagen));

  revalidar(borrada.slug);
  redirect("/admin");
}

/* ------------------------------------------------------------ l'ordine */

/**
 * Come si esce da un salvataggio fallito.
 *
 * Viaggia insieme all'errore perché non da tutti i fallimenti si esce allo
 * stesso modo, e offrire la via d'uscita sbagliata è peggio che non offrirne
 * nessuna: un «Riprova» su un ordine che il database ha già rifiutato perché
 * vecchio fallisce di nuovo esattamente uguale, e il secondo messaggio
 * identico fa pensare che la schermata sia rotta.
 */
export type Salida = "reintentar" | "recargar";

/**
 * Salva l'ordine della griglia. `orden` sono gli id di tutte le opere, dalla
 * prima all'ultima.
 *
 * La chiama la schermata quando si lascia un pezzo, non un modulo: per questo
 * riceve un array e restituisce un risultato invece di reindirizzare. Chi
 * trascina sta già guardando il risultato —la griglia si è sistemata al
 * rilascio—, quindi l'unica cosa che resta da dirgli è se quello è rimasto
 * scritto.
 */
export async function reordenarArchivo(
  orden: number[],
): Promise<{ ok: true } | { ok: false; error: string; salida: Salida }> {
  await requireSession();

  /*
    Una Server Action è un POST a un indirizzo proprio: quello che arriva può
    venire da qualsiasi parte, non solo dalla schermata che l'ha scritto. Che
    siano interi si controlla qui; che siano *queste* opere e che ci siano
    tutte, lo controlla reorderWorks contro la tabella, che è l'unica a
    saperlo.
  */
  if (!Array.isArray(orden) || orden.some((id) => !Number.isInteger(id))) {
    return { ok: false, error: "L’ordine è arrivato male.", salida: "reintentar" };
  }

  let guardado: boolean;
  try {
    guardado = await reorderWorks(orden);
  } catch {
    return { ok: false, error: "Il database non ha accettato l’ordine.", salida: "reintentar" };
  }

  /*
    Il rifiuto ha una sola causa pratica: la lista è stata costruita
    all'apertura della schermata, e da allora l'archivio è cambiato —un'altra
    scheda, un altro momento—. Riprovare manderebbe la stessa lista vecchia e
    fallirebbe uguale, quindi la via d'uscita è ricaricare.

    Il messaggio dice le due cose che lei ha bisogno di sapere e nessuna delle
    due è ovvia: che questo **non è rimasto scritto**, e che ricaricare scarta
    quello che ha sistemato. Può essere stata mezz'ora di lavoro, e «l'archivio
    è cambiato» e basta si legge come un avviso, non come una perdita.
  */
  if (!guardado) {
    return {
      ok: false,
      error:
        "L’archivio è cambiato da quando hai aperto questa schermata, quindi quest’ordine non è stato salvato. " +
        "Ricarica e risistemalo su quello che c’è adesso.",
      salida: "recargar",
    };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  /*
    E ogni pagina d'opera, perché la paginazione in fondo —la precedente e la
    successiva— esce dallo stesso ordine della griglia. Senza questo, spostare
    un pezzo lascerebbe tutte le schede a puntare a vicine che non lo sono più.
    Si rivalida il percorso intero e non uno slug: è cambiato l'ordine, quindi
    non se ne salva nessuna.
  */
  revalidatePath("/opera/[slug]", "page");

  return { ok: true };
}

/* --------------------------------------------------------------- pulizia */

/**
 * Toglie un'immagine da dovunque si trovi.
 *
 * Ci sono due provenienze possibili e l'URL dice quale: le nuove vivono su
 * Cloudinary e si cancellano tramite il loro `publicId`; quelle rimaste da
 * quando l'admin salvava su disco cominciano con `/ilustraciones/` e si
 * cancellano dal filesystem. Una sola funzione per entrambe, perché chi
 * cancella un'opera non deve sapere da dove è uscita ogni foto.
 */
async function quitarImagen(img: WorkImage): Promise<void> {
  if (img.publicId) return borrarDeCloudinary(img.publicId, esVideo(img) ? "video" : "image");
  if (img.url.startsWith("/")) return borrarImagen(img.url);
}

/* ------------------------------------------------------------ aggiornamento */

/*
  La home e la pagina dell'opera si rifanno. Se la modifica ha cambiato lo
  slug, bisogna rifare anche l'indirizzo vecchio: lì è rimasta una pagina che
  adesso è un 404 e continuerebbe a mostrarsi dalla cache.
*/
function revalidar(slug: string, slugAnterior?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/opera/${slug}`);
  if (slugAnterior && slugAnterior !== slug) revalidatePath(`/opera/${slugAnterior}`);
}
