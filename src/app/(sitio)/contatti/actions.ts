"use server";

import { correoConfigurado, inviaALei, inviaConferma } from "@/lib/correo";
import { validaContatto, type DatiContatto, type ErroriContatto } from "@/lib/contacto";
import { getWork } from "@/lib/works";

export type EsitoContatto =
  | { ok: true }
  | { ok: false; errori?: ErroriContatto; error?: string };

/**
 * L'invio del modulo di contatto.
 *
 * Una Server Action è un POST pubblico: chiunque la può chiamare senza
 * passare dal modulo, quindi qui si ricontrolla tutto quello che il browser
 * ha già controllato.
 *
 * **L'ordine conta.** Prima parte la mail a lei, che è l'unica che decide se
 * il messaggio è arrivato: se fallisce, il visitatore lo sa e ha la mail
 * diretta come via d'uscita. La conferma al visitatore parte dopo, e se
 * fallisce non si dice niente: il messaggio è già nella casella di lei, e
 * dirgli «errore» lo farebbe riscrivere e lei riceverebbe due volte la stessa
 * richiesta.
 */
export async function inviaContatto(formData: FormData): Promise<EsitoContatto> {
  /*
    Il vasetto di miele: un campo che una persona non vede e un robot riempie.
    Al robot si risponde che è andato tutto bene, così non impara a
    cambiare strategia; semplicemente non parte niente.
  */
  if (String(formData.get("sito") ?? "").trim() !== "") return { ok: true };

  const dati: DatiContatto = {
    nome: String(formData.get("nome") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    oggetto: String(formData.get("oggetto") ?? "").trim(),
    messaggio: String(formData.get("messaggio") ?? "").trim(),
  };

  const errori = validaContatto(dati);
  if (Object.keys(errori).length > 0) return { ok: false, errori };

  if (!correoConfigurado()) {
    console.error("Contatti: RESEND_API_KEY non è configurata, il messaggio non è partito.");
    return { ok: false, error: "invio" };
  }

  /*
    L'opera la cerca il server a partire dallo slug, come fa la pagina: il
    titolo e il link che arrivano a lei sono quelli della tabella, non testo
    scritto da chi manda il modulo. Se il database non risponde, la mail parte
    lo stesso senza la riga dell'opera: l'oggetto dice già di cosa si parla.
  */
  const slug = String(formData.get("opera") ?? "").trim();
  let opera: { title: string; slug: string } | null = null;
  if (slug) {
    try {
      const w = await getWork(slug);
      if (w) opera = { title: w.title, slug: w.slug };
    } catch (e) {
      console.error("Contatti: non ho potuto leggere l'opera", slug, e);
    }
  }

  const contatto = { ...dati, opera, ricevuto: new Date() };

  try {
    await inviaALei(contatto);
  } catch (e) {
    console.error("Contatti: la mail a lei non è partita.", e);
    return { ok: false, error: "invio" };
  }

  try {
    await inviaConferma(contatto);
  } catch (e) {
    console.error("Contatti: la conferma al visitatore non è partita.", e);
  }

  return { ok: true };
}
