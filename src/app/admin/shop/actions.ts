"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { esServizio, type Colore, type Formato } from "@/data/shop";
import { requireSession } from "@/lib/auth";
import {
  aggiornaCategoria,
  cancellaCategoria,
  categoriaFissa,
  creaCategoria,
  getCategoria,
  listCategorie,
  spostaCategoria,
} from "@/lib/categorie";
import { listLibreria, setCopertina } from "@/lib/copertine";
import { aggiungiTestimonianza, cancellaTestimonianza } from "@/lib/testimonianze";
import { cancellaCodice, erroreCodice, normalizzaCodice, salvaCodice } from "@/lib/codici";
import { cancellaSconto, salvaSconto } from "@/lib/sconti";
import { armarImagenes, ErrorDeImagenes, quitarImagen } from "@/lib/immaginiModulo";
import {
  createProdotto,
  deleteProdotto,
  getProdottoById,
  riordinaProdotti,
  updateProdotto,
} from "@/lib/prodotti";
import { getServizio, updateServizio } from "@/lib/servizi";
import { esVideo } from "@/lib/video";
import type { WorkImage } from "@/lib/works";
import { getWork } from "@/lib/works";
import type { EstadoFormulario, Salida } from "../actions";

/*
  Ogni azione ricontrolla la sessione, come quelle delle opere: una Server
  Action si può chiamare senza passare da nessuna pagina, e il proxy non la
  vede.
*/

/**
 * I formati come li manda il modulo: un JSON con nome e prezzo in centesimi.
 *
 * Il database ha già un CHECK su questa forma, ma un errore di Postgres a
 * schermo non dice a nessuno cosa correggere: qui lo si dice in parole, riga
 * per riga.
 */
function leggiFormati(crudo: string): Formato[] | string {
  let lista: unknown;
  try {
    lista = JSON.parse(crudo);
  } catch {
    return "I formati non si sono capiti.";
  }
  if (!Array.isArray(lista)) return "I formati sono arrivati male.";

  const visti = new Set<string>();
  const formati: Formato[] = [];
  for (const [i, f] of lista.entries()) {
    const n = i + 1;
    const nome = typeof f?.formato === "string" ? f.formato.trim() : "";
    const prezzo = Number(f?.prezzo);
    if (nome.length === 0) return `Al formato ${n} manca il nome: «A4», «30 × 40 cm».`;
    if (nome.length > 40) return `Il nome del formato ${n} è troppo lungo.`;
    if (visti.has(nome.toLowerCase())) return `Il formato «${nome}» c’è due volte.`;
    if (!Number.isInteger(prezzo) || prezzo <= 0) return `Il prezzo di «${nome}» deve essere più di zero.`;
    if (prezzo > 10_000_00) return `Il prezzo di «${nome}» sembra sbagliato: più di 10.000 €.`;
    visti.add(nome.toLowerCase());
    formati.push({ formato: nome, prezzo });
  }
  return formati;
}

/**
 * I colori come li manda il modulo: nome e tinta. Vuoto vale: vuol dire che
 * chi compra non sceglie un colore. Anche qui il CHECK del database c'è già,
 * e anche qui si dice in parole cosa correggere.
 */
function leggiColori(crudo: string): Colore[] | string {
  let lista: unknown;
  try {
    lista = JSON.parse(crudo);
  } catch {
    return "I colori non si sono capiti.";
  }
  if (!Array.isArray(lista)) return "I colori sono arrivati male.";

  const visti = new Set<string>();
  const colori: Colore[] = [];
  for (const [i, c] of lista.entries()) {
    const n = i + 1;
    const nome = typeof c?.nome === "string" ? c.nome.trim() : "";
    const tinta = typeof c?.tinta === "string" ? c.tinta.trim().toLowerCase() : "";
    if (nome.length === 0) return `Al colore ${n} manca il nome: «Verde», «Celeste».`;
    if (nome.length > 30) return `Il nome del colore ${n} è troppo lungo.`;
    if (visti.has(nome.toLowerCase())) return `Il colore «${nome}» c’è due volte.`;
    if (!/^#[0-9a-f]{6}$/.test(tinta)) return `La tinta di «${nome}» non si è capita. Sceglila di nuovo.`;
    visti.add(nome.toLowerCase());
    colori.push({ nome, tinta });
  }
  return colori;
}

export async function guardaProdotto(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireSession();

  const idCrudo = String(formData.get("id") ?? "");
  const id = idCrudo.length > 0 ? Number(idCrudo) : null;

  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const descripcion = String(formData.get("description") ?? "").trim();
  const pubblicato = formData.get("pubblicato") === "on";

  // La categoria la sceglie il modulo, ma la conferma la tabella: dev'essere
  // una che si compra, non un servizio né una che non c'è più.
  const categoria = await getCategoria(String(formData.get("categoria") ?? "stampe"));
  if (!categoria || !categoria.vendita) return { error: "Questa categoria non esiste più. Scegline un’altra." };
  const stampa = categoria.slug === "stampe";

  if (title.length === 0) return { error: stampa ? "La stampa ha bisogno di un titolo." : "Manca il titolo." };
  if (slug.length === 0) return { error: stampa ? "Manca l’indirizzo della stampa." : "Manca l’indirizzo." };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return { error: "L’indirizzo ammette solo minuscole, numeri e trattini: «ritratto-di-famiglia»." };
  }

  const formati = leggiFormati(String(formData.get("formati") ?? "[]"));
  if (typeof formati === "string") return { error: formati };
  if (formati.length === 0) {
    return {
      error: stampa
        ? "Una stampa ha bisogno di almeno un formato con il suo prezzo."
        : "Serve almeno un formato con il suo prezzo: senza, non si può comprare.",
    };
  }

  const colori = leggiColori(String(formData.get("colori") ?? "[]"));
  if (typeof colori === "string") return { error: colori };

  // «Dall'opera» è delle stampe: è quello che fa dire alla pagina dell'opera
  // «Disponibile come stampa».
  let operaSlug: string | null = null;
  const opera = stampa ? String(formData.get("opera") ?? "").trim() : "";
  if (opera.length > 0) {
    if (!(await getWork(opera))) return { error: "L’opera scelta non esiste più. Scegline un’altra." };
    operaSlug = opera;
  }

  let imagenes: WorkImage[];
  try {
    imagenes = armarImagenes(formData);
  } catch (e) {
    return { error: e instanceof ErrorDeImagenes ? e.message : "Le immagini non si sono capite." };
  }
  if (imagenes.length === 0) {
    return {
      error: stampa
        ? "La stampa ha bisogno di almeno un’immagine: è quella che esce nello Shop."
        : "Serve almeno un’immagine: è quella che esce nello Shop.",
    };
  }

  let mockup: WorkImage | null;
  try {
    const lista = armarImagenes(formData, "mockup");
    if (lista.length > 1) return { error: "Il mockup è uno solo. Togli quelli in più." };
    mockup = lista[0] ?? null;
  } catch (e) {
    return { error: e instanceof ErrorDeImagenes ? e.message : "Il mockup non si è capito." };
  }
  if (mockup && esVideo(mockup)) return { error: "Il mockup deve essere un’immagine, non un video." };

  const entrada = {
    categoria: categoria.slug,
    slug,
    title,
    description: descripcion.length > 0 ? descripcion : null,
    image: imagenes,
    formati,
    colori,
    operaSlug,
    mockup,
    pubblicato,
  };

  const anterior = id !== null ? await getProdottoById(id) : null;

  try {
    if (id !== null) await updateProdotto(id, entrada);
    else await createProdotto(entrada);
  } catch (e) {
    const nuevas = imagenes.filter((img) => !anterior?.image.some((v) => v.url === img.url));
    if (mockup && mockup.url !== anterior?.mockup?.url) nuevas.push(mockup);
    await Promise.all(nuevas.map(quitarImagen));

    const mensaje = e instanceof Error ? e.message : "";
    if (mensaje.includes("prodotti_slug_key")) {
      return { error: `C’è già un prodotto su «${slug}», in questa o in un’altra categoria. Cambia l’indirizzo.` };
    }
    return { error: "Il database ha rifiutato il salvataggio. Controlla i campi." };
  }

  if (anterior) {
    const sobrantes = anterior.image.filter((v) => !imagenes.some((img) => img.url === v.url));
    // Il mockup sostituito o tolto se ne va anche lui da Cloudinary.
    if (anterior.mockup && anterior.mockup.url !== mockup?.url) sobrantes.push(anterior.mockup);
    await Promise.all(sobrantes.map(quitarImagen));
  }

  rivalida();
  redirect("/admin/shop");
}

/**
 * Salva uno dei due servizi. Non c'è un «crea» né un «cancella»: i servizi
 * sono due e sempre quelli, e qui si cambia solo quello che si vede —nome,
 * testo, immagini—.
 */
export async function guardaServizio(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireSession();

  const slug = String(formData.get("slug") ?? "");
  if (!esServizio(slug)) return { error: "Questo servizio non esiste." };

  const title = String(formData.get("title") ?? "").trim();
  if (title.length === 0) return { error: "Il servizio ha bisogno di un nome." };
  const descripcion = String(formData.get("description") ?? "").trim();

  let imagenes: WorkImage[];
  try {
    imagenes = armarImagenes(formData);
  } catch (e) {
    return { error: e instanceof ErrorDeImagenes ? e.message : "Le immagini non si sono capite." };
  }

  const anterior = await getServizio(slug);
  try {
    await updateServizio(slug, {
      title,
      description: descripcion.length > 0 ? descripcion : null,
      image: imagenes,
    });
  } catch {
    const nuevas = imagenes.filter((img) => !anterior?.image.some((v) => v.url === img.url));
    await Promise.all(nuevas.map(quitarImagen));
    return { error: "Il database ha rifiutato le modifiche. Controlla i campi." };
  }

  // Le immagini tolte se ne vanno anche da Cloudinary.
  if (anterior) {
    const sobrantes = anterior.image.filter((v) => !imagenes.some((img) => img.url === v.url));
    await Promise.all(sobrantes.map(quitarImagen));
  }

  rivalida();
  redirect("/admin/shop");
}

/**
 * Salva le copertine delle categorie, tutte insieme: si scelgono guardandole
 * una accanto all'altra, come escono nella pagina /shop.
 *
 * Ogni categoria manda l'indirizzo dell'immagine scelta (`copertina-<slug>`),
 * o niente per tornare a quella di riserva. L'immagine la prende il server
 * dalla biblioteca, non dal modulo: si può scegliere solo quello che è già
 * caricato nel sito. E non si cancella niente da Cloudinary, perché ogni
 * immagine appartiene ancora alla stampa, all'opera o al servizio da cui
 * viene.
 */
export async function guardaCopertine(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireSession();

  const libreria = new Map(
    (await listLibreria()).flatMap((g) =>
      g.immagini.map((i) => {
        const img: WorkImage = { url: i.url, alt: i.alt, width: i.width, height: i.height };
        if (i.publicId) img.publicId = i.publicId;
        return [i.url, img] as const;
      }),
    ),
  );

  const nuove: { categoria: string; immagine: WorkImage | null }[] = [];
  for (const c of await listCategorie()) {
    const url = String(formData.get(`copertina-${c.slug}`) ?? "").trim();
    if (!url) {
      nuove.push({ categoria: c.slug, immagine: null });
      continue;
    }
    const immagine = libreria.get(url);
    if (!immagine) {
      return { error: `L’immagine scelta per ${c.label} non c’è più nel sito. Scegline un’altra.` };
    }
    nuove.push({ categoria: c.slug, immagine });
  }

  try {
    for (const n of nuove) await setCopertina(n.categoria, n.immagine);
  } catch {
    return { error: "Il database ha rifiutato le copertine. Riprova." };
  }

  rivalida();
  redirect("/admin/shop");
}

/** Aggiunge una testimonianza a un servizio. */
export async function aggiungiTestimonianzaAzione(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireSession();
  const servizio = String(formData.get("servizio") ?? "");
  if (!esServizio(servizio)) return { error: "Questo servizio non esiste." };
  const testo = String(formData.get("testo") ?? "").trim();
  const autore = String(formData.get("autore") ?? "").replace(/\s+/g, " ").trim();
  const dettaglio = String(formData.get("dettaglio") ?? "").replace(/\s+/g, " ").trim();
  if (!testo) return { error: "Manca il testo." };
  if (testo.length > 800) return { error: "Il testo è troppo lungo: al massimo 800 caratteri." };
  if (!autore) return { error: "Manca chi l’ha scritta: anche solo il nome." };
  if (autore.length > 80 || dettaglio.length > 80) return { error: "Nome o dettaglio troppo lunghi." };

  await aggiungiTestimonianza({ servizio, testo, autore, dettaglio: dettaglio || null });
  revalidatePath(`/admin/shop/servizi/${servizio}`);
  revalidatePath(`/shop/${servizio}`);
  return { ok: true };
}

export async function cancellaTestimonianzaAzione(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("id"));
  const servizio = String(formData.get("servizio") ?? "");
  if (!Number.isInteger(id)) return;
  await cancellaTestimonianza(id);
  revalidatePath(`/admin/shop/servizi/${servizio}`);
  revalidatePath(`/shop/${servizio}`);
}

/**
 * Salva uno sconto di stagione. Le date sono il primo e l'ultimo giorno,
 * compresi; le stampe arrivano come lista di id nell'ordine scelto.
 */
export async function salvaScontoAzione(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireSession();
  const idCrudo = String(formData.get("id") ?? "");
  const id = idCrudo ? Number(idCrudo) : undefined;
  const titolo = String(formData.get("titolo") ?? "").replace(/\s+/g, " ").trim();
  const testo = String(formData.get("testo") ?? "").trim();
  const percentuale = Number(formData.get("percentuale"));
  const dal = String(formData.get("dal") ?? "");
  const al = String(formData.get("al") ?? "");
  const attivo = formData.get("attivo") === "on";
  let stampe: number[] = [];
  try {
    const l = JSON.parse(String(formData.get("stampe") ?? "[]"));
    if (Array.isArray(l)) stampe = [...new Set(l.map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  } catch {
    return { error: "Le stampe scelte non si sono capite." };
  }

  if (!titolo) return { error: "Lo sconto ha bisogno di un nome: «Sconti di Natale»." };
  if (titolo.length > 80) return { error: "Il nome è troppo lungo: al massimo 80 caratteri." };
  if (testo.length > 400) return { error: "Il testo è troppo lungo: al massimo 400 caratteri." };
  if (!Number.isInteger(percentuale) || percentuale < 1 || percentuale > 90) {
    return { error: "Lo sconto va da 1 a 90 per cento." };
  }
  const ok = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
  if (!ok(dal) || !ok(al)) return { error: "Scegli il primo e l’ultimo giorno." };
  if (al < dal) return { error: "L’ultimo giorno viene prima del primo." };
  if (stampe.length === 0) return { error: "Scegli almeno una stampa." };

  try {
    await salvaSconto({ id, titolo, testo: testo || null, percentuale, dal, al, attivo, stampe });
  } catch (e) {
    console.error("Sconti: salvataggio fallito.", e);
    return { error: "Il database ha rifiutato lo sconto. Riprova." };
  }
  rivalida();
  redirect("/admin/shop");
}

export async function cancellaScontoAzione(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await cancellaSconto(id);
  rivalida();
  redirect("/admin/shop");
}

/**
 * Salva un codice sconto. Il codice si salva come lo controlla il carrello:
 * maiuscolo e senza spazi, così «benzibet 98» scritto qui è lo stesso che
 * chi compra trova sul biglietto.
 */
export async function salvaCodiceAzione(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireSession();
  const idCrudo = String(formData.get("id") ?? "");
  const id = idCrudo ? Number(idCrudo) : undefined;
  const codice = normalizzaCodice(String(formData.get("codice") ?? ""));
  const percentuale = Number(formData.get("percentuale"));
  const attivo = formData.get("attivo") === "on";
  const monouso = formData.get("monouso") === "on";
  const scade = String(formData.get("scade") ?? "").trim() || null;

  const errore = erroreCodice(codice, percentuale, scade);
  if (errore) return { error: errore };

  try {
    await salvaCodice({ id, codice, percentuale, attivo, scade, monouso });
  } catch (e) {
    if (e instanceof Error && e.message.includes("codici_codice_key")) {
      return { error: `Il codice «${codice}» c’è già.` };
    }
    console.error("Codici: salvataggio fallito.", e);
    return { error: "Il database ha rifiutato il codice. Riprova." };
  }
  revalidatePath("/admin/shop");
  redirect("/admin/shop");
}

export async function cancellaCodiceAzione(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await cancellaCodice(id);
  revalidatePath("/admin/shop");
  redirect("/admin/shop");
}

export async function cancellaProdotto(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const fuori = await deleteProdotto(id);
  if (!fuori) return;
  await Promise.all([...fuori.image, ...(fuori.mockup ? [fuori.mockup] : [])].map(quitarImagen));

  rivalida();
  redirect("/admin/shop");
}

/**
 * L'ordine dei prodotti di una categoria, come lo lascia la griglia
 * dell'admin. Stessa forma di `reordenarArchivo`, e per la stessa ragione: la
 * griglia è la stessa e i suoi guasti pure.
 */
export async function riordinaStampe(
  categoria: string,
  orden: number[],
): Promise<{ ok: true } | { ok: false; error: string; salida: Salida }> {
  await requireSession();
  if (typeof categoria !== "string" || categoria.length === 0) {
    return { ok: false, error: "L’ordine è arrivato male.", salida: "reintentar" };
  }
  if (!Array.isArray(orden) || orden.some((id) => !Number.isInteger(id))) {
    return { ok: false, error: "L’ordine è arrivato male.", salida: "reintentar" };
  }

  let guardado: boolean;
  try {
    guardado = await riordinaProdotti(categoria, orden);
  } catch {
    return { ok: false, error: "Il database non ha accettato l’ordine.", salida: "reintentar" };
  }
  if (!guardado) {
    return {
      ok: false,
      error:
        "La griglia è cambiata da quando hai aperto questa schermata, quindi quest’ordine non è stato salvato. " +
        "Ricarica e risistemalo su quello che c’è adesso.",
      salida: "recargar",
    };
  }

  rivalida();
  return { ok: true };
}

/* ------------------------------------------------------------ categorie */

/** Da nome a indirizzo: «Calendario 2027» → «calendario-2027». */
function aIndirizzo(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Crea una categoria. Nasce come Stampe —prodotti con formati, prezzo e
 * carrello—, in fondo al menu e nascosta: si accende quando ha qualcosa da
 * mostrare.
 */
export async function creaCategoriaAzione(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireSession();
  const label = String(formData.get("label") ?? "").replace(/\s+/g, " ").trim();
  const scritto = String(formData.get("slug") ?? "").trim();
  const slug = scritto || aIndirizzo(label);

  if (!label) return { error: "La categoria ha bisogno di un nome: «Calendario 2027»." };
  if (label.length > 60) return { error: "Il nome è troppo lungo: al massimo 60 caratteri." };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return { error: "L’indirizzo ammette solo minuscole, numeri e trattini: «calendario-2027»." };
  }
  // /admin/shop/categorie/nuova è la pagina che crea: una categoria con quel
  // nome non si potrebbe più aprire.
  if (slug === "nuova") return { error: "«nuova» è già usato dall’admin. Scegli un altro indirizzo." };

  try {
    await creaCategoria({ slug, label });
  } catch (e) {
    if (e instanceof Error && e.message.includes("categorie_pkey")) {
      return { error: `C’è già una categoria su «${slug}». Cambia l’indirizzo.` };
    }
    console.error("Categorie: creazione fallita.", e);
    return { error: "Il database ha rifiutato la categoria. Riprova." };
  }

  rivalida();
  redirect(`/admin/shop/categorie/${slug}`);
}

/** Cambia il nome di una categoria e se si vede nel sito. */
export async function salvaCategoriaAzione(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireSession();
  const slug = String(formData.get("slug") ?? "");
  const label = String(formData.get("label") ?? "").replace(/\s+/g, " ").trim();
  const visibile = formData.get("visibile") === "on";

  if (!(await getCategoria(slug))) return { error: "Questa categoria non esiste più." };
  if (!label) return { error: "La categoria ha bisogno di un nome." };
  if (label.length > 60) return { error: "Il nome è troppo lungo: al massimo 60 caratteri." };

  try {
    await aggiornaCategoria(slug, { label, visibile });
  } catch (e) {
    console.error("Categorie: salvataggio fallito.", e);
    return { error: "Il database ha rifiutato le modifiche. Riprova." };
  }

  rivalida();
  redirect("/admin/shop");
}

/** Una categoria un posto più su o più giù nel menu. */
export async function spostaCategoriaAzione(formData: FormData): Promise<void> {
  await requireSession();
  const slug = String(formData.get("slug") ?? "");
  const verso = formData.get("verso") === "giu" ? "giu" : "su";
  await spostaCategoria(slug, verso);
  rivalida();
}

/**
 * Cancella una categoria, solo se è vuota e non è una di quelle fisse. Se
 * qualcosa è cambiato nel frattempo —un prodotto entrato da un'altra
 * scheda— non cancella e torna alla sua pagina, che lo dice.
 */
export async function cancellaCategoriaAzione(formData: FormData): Promise<void> {
  await requireSession();
  const slug = String(formData.get("slug") ?? "");
  if (categoriaFissa(slug)) return;
  const fatto = await cancellaCategoria(slug);
  if (!fatto) {
    revalidatePath(`/admin/shop/categorie/${slug}`);
    return;
  }
  rivalida();
  redirect("/admin/shop");
}

/*
  Lo Shop intero e le pagine d'opera: una stampa che esce da un'opera compare
  nella sua pagina come «Disponibile come stampa».
*/
function rivalida() {
  revalidatePath("/admin/shop");
  // Tutto il sito: la cinta degli sconti è in ogni pagina.
  revalidatePath("/", "layout");
  revalidatePath("/shop", "layout");
  revalidatePath("/opera/[slug]", "page");
  revalidatePath("/sitemap.xml");
}
