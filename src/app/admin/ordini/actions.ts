"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { avvisaSpedizione, correoConfigurado } from "@/lib/correo";
import { getOrdine, rimettiDaSpedire, segnaAvvisato, segnaSpedito, type Ordine } from "@/lib/prodotti";

export type EsitoSpedizione = { error?: string; fatto?: string };

const pulisci = (v: FormDataEntryValue | null, max: number) => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  return s.length > 0 ? s : null;
};

/**
 * Segna un ordine come spedito e, se lei lo lascia spuntato, scrive a chi ha
 * comprato con il corriere e il numero per seguire il pacco.
 *
 * Se la mail non parte, l'ordine resta comunque spedito —il pacco è partito
 * davvero— e il messaggio lo dice, così lei può avvisare a mano.
 */
export async function spedisciOrdine(
  _previo: EsitoSpedizione,
  formData: FormData,
): Promise<EsitoSpedizione> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Ordine non valido." };

  const ordine = await segnaSpedito(id, {
    corriere: pulisci(formData.get("corriere"), 80),
    tracking: pulisci(formData.get("tracking"), 300),
  });
  revalidatePath("/admin", "layout");
  if (!ordine) return { error: "Questo ordine era già segnato come spedito." };

  if (formData.get("avvisa") !== "on") return { fatto: "Segnato come spedito." };
  // L'esito resta scritto nell'ordine: la riga passa fra gli spediti e dice
  // lì se il cliente è stato avvisato, con il modo di riprovare.
  await avvisa(ordine);
  revalidatePath("/admin/ordini");
  return { fatto: "Segnato come spedito." };
}

/** Manda la mail di spedizione e, se parte, lo segna nell'ordine. */
async function avvisa(ordine: Ordine): Promise<boolean> {
  if (!correoConfigurado()) return false;
  try {
    await avvisaSpedizione(ordine);
    await segnaAvvisato(ordine.id);
    return true;
  } catch (e) {
    console.error("Ordini: la mail di spedizione non è partita.", e);
    return false;
  }
}

/** Riprova la mail di spedizione di un ordine già spedito. */
export async function riavvisaAzione(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const ordine = await getOrdine(id);
  if (!ordine || ordine.stato !== "spedito") return;
  await avvisa(ordine);
  revalidatePath("/admin/ordini");
}

/** Rimette un ordine fra quelli da spedire. Non scrive a nessuno. */
export async function rimettiDaSpedireAzione(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await rimettiDaSpedire(id);
  revalidatePath("/admin", "layout");
}
