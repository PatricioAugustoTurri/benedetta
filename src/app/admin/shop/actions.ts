"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { esServizio, shopCategories, type Formato } from "@/data/shop";
import { requireSession } from "@/lib/auth";
import { listLibreria, setCopertina } from "@/lib/copertine";
import { aggiungiTestimonianza, cancellaTestimonianza } from "@/lib/testimonianze";
import { cancellaSconto, salvaSconto } from "@/lib/sconti";
import { armarImagenes, ErrorDeImagenes, quitarImagen } from "@/lib/immaginiModulo";
import {
  createProdotto,
  deleteProdotto,
  getProdottoById,
  spostaProdotto,
  updateProdotto,
} from "@/lib/prodotti";
import { getServizio, updateServizio } from "@/lib/servizi";
import { esVideo } from "@/lib/video";
import type { WorkImage } from "@/lib/works";
import { getWork } from "@/lib/works";
import type { EstadoFormulario } from "../actions";

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

  if (title.length === 0) return { error: "La stampa ha bisogno di un titolo." };
  if (slug.length === 0) return { error: "Manca l’indirizzo della stampa." };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return { error: "L’indirizzo ammette solo minuscole, numeri e trattini: «ritratto-di-famiglia»." };
  }

  const formati = leggiFormati(String(formData.get("formati") ?? "[]"));
  if (typeof formati === "string") return { error: formati };
  if (formati.length === 0) return { error: "Una stampa ha bisogno di almeno un formato con il suo prezzo." };

  let operaSlug: string | null = null;
  const opera = String(formData.get("opera") ?? "").trim();
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
    return { error: "La stampa ha bisogno di almeno un’immagine: è quella che esce nello Shop." };
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
    categoria: "stampe" as const,
    slug,
    title,
    description: descripcion.length > 0 ? descripcion : null,
    image: imagenes,
    formati,
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
      return { error: `C’è già una stampa su «${slug}». Cambiale l’indirizzo.` };
    }
    return { error: "Il database ha rifiutato la stampa. Controlla i campi." };
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

  const nuove: { categoria: (typeof shopCategories)[number]["slug"]; immagine: WorkImage | null }[] = [];
  for (const c of shopCategories) {
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

export async function spostaProdottoAzione(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("id"));
  const verso = Number(formData.get("verso"));
  if (!Number.isInteger(id) || (verso !== 1 && verso !== -1)) return;
  await spostaProdotto(id, verso);
  rivalida();
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
