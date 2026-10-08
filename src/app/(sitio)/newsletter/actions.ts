"use server";

import { revalidatePath } from "next/cache";
import { correoConfigurado, inviaConfermaIscrizione } from "@/lib/correo";
import {
  confermaIscrizione,
  disiscrivi,
  emailValida,
  pulisciNome,
  richiediIscrizione,
} from "@/lib/newsletter";
import { origine } from "@/lib/origine";

export type EsitoIscrizione = { ok: true } | { ok: false; error: string };

/**
 * L'iscrizione dal piè di pagina. È un POST pubblico, quindi si ricontrolla
 * tutto, e la risposta è la stessa per un indirizzo nuovo e per uno già
 * iscritto: il modulo non deve dire chi c'è nella lista.
 */
export async function iscriviti(formData: FormData): Promise<EsitoIscrizione> {
  // Il vasetto di miele, come nel modulo di contatto.
  if (String(formData.get("sito") ?? "").trim() !== "") return { ok: true };

  const email = String(formData.get("email") ?? "").trim();
  const nomeScritto = pulisciNome(String(formData.get("nome") ?? ""));
  if (!emailValida(email)) return { ok: false, error: "Questa email non sembra completa." };

  if (!correoConfigurado()) {
    console.error("Newsletter: RESEND_API_KEY non è configurata.");
    return { ok: false, error: "Non riesco a iscriverti in questo momento. Riprova più tardi." };
  }

  try {
    const { token, nome, inviaConferma } = await richiediIscrizione(email, nomeScritto);
    if (inviaConferma) {
      await inviaConfermaIscrizione(email, nome, `${await origine()}/newsletter/conferma/${token}`);
    }
  } catch (e) {
    console.error("Newsletter: iscrizione non riuscita.", e);
    return { ok: false, error: "Non riesco a iscriverti in questo momento. Riprova più tardi." };
  }

  return { ok: true };
}

/** Il pulsante della pagina di conferma. */
export async function confermaAzione(formData: FormData): Promise<void> {
  await confermaIscrizione(String(formData.get("token") ?? ""));
  // La pagina si ridisegna con lo stato nuovo.
  revalidatePath("/newsletter", "layout");
}

/** Il pulsante della pagina di disiscrizione. */
export async function disiscriviAzione(formData: FormData): Promise<void> {
  await disiscrivi(String(formData.get("token") ?? ""));
  revalidatePath("/newsletter", "layout");
}
