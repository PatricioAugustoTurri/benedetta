"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { esServizio, type Formato } from "@/data/shop";
import { requireSession } from "@/lib/auth";
import { armarImagenes, ErrorDeImagenes, quitarImagen } from "@/lib/immaginiModulo";
import {
  createProdotto,
  deleteProdotto,
  getProdottoById,
  segnaOrdine,
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

export async function segnaOrdineAzione(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("id"));
  const stato = formData.get("stato") === "spedito" ? "spedito" : "pagato";
  if (!Number.isInteger(id)) return;
  await segnaOrdine(id, stato);
  revalidatePath("/admin/ordini");
}

/*
  Lo Shop intero e le pagine d'opera: una stampa che esce da un'opera compare
  nella sua pagina come «Disponibile come stampa».
*/
function rivalida() {
  revalidatePath("/admin/shop");
  revalidatePath("/shop", "layout");
  revalidatePath("/opera/[slug]", "page");
  revalidatePath("/sitemap.xml");
}
