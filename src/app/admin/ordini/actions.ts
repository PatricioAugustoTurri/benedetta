"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import {
  bigliettoDi,
  correggiBiglietto,
  creaBiglietto,
  erroreCodice,
  fissaScadenza,
  normalizzaCodice,
} from "@/lib/codici";
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
  // Il biglietto comincia a contare da oggi: 90 giorni, se lei non ha scelto.
  await fissaScadenza(id).catch((e) => console.error("Ordini: scadenza del biglietto non fissata.", e));

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
    // Il codice del biglietto va anche nella mail, se vale ancora: un
    // biglietto si perde, una mail si ritrova.
    const biglietto = await bigliettoDi(ordine.id).catch(() => null);
    await avvisaSpedizione(ordine, biglietto);
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

export type EsitoBiglietto = { error?: string; fatto?: number };

/**
 * Il biglietto corretto da lei prima di spedire: un codice suo («GIULIA15»),
 * un'altra percentuale, un'altra scadenza. La scadenza vuota vuol dire «90
 * giorni dalla spedizione» finché il pacco non parte.
 */
export async function correggiBigliettoAzione(
  _previo: EsitoBiglietto,
  formData: FormData,
): Promise<EsitoBiglietto> {
  await requireSession();
  const ordine = Number(formData.get("ordine"));
  if (!Number.isInteger(ordine)) return { error: "Ordine non valido." };
  const codice = normalizzaCodice(String(formData.get("codice") ?? ""));
  const percentuale = Number(formData.get("percentuale"));
  const scade = String(formData.get("scade") ?? "").trim() || null;

  const errore = erroreCodice(codice, percentuale, scade);
  if (errore) return { error: errore };

  try {
    await correggiBiglietto(ordine, { codice, percentuale, scade });
  } catch (e) {
    if (e instanceof Error && e.message.includes("codici_codice_key")) {
      return { error: `Il codice «${codice}» c’è già. Scegline un altro.` };
    }
    console.error("Ordini: biglietto non salvato.", e);
    return { error: "Il database ha rifiutato il biglietto. Riprova." };
  }
  revalidatePath("/admin/ordini");
  revalidatePath("/admin/shop");
  return { fatto: Date.now() };
}

/** Il biglietto di un ordine che non l'ha avuto: arrivato prima dei codici, o il webhook non ce l'ha fatta. */
export async function creaBigliettoAzione(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("ordine"));
  if (!Number.isInteger(id)) return;
  const ordine = await getOrdine(id);
  if (!ordine) return;
  await creaBiglietto(id);
  if (ordine.stato === "spedito") await fissaScadenza(id);
  revalidatePath("/admin/ordini");
}
