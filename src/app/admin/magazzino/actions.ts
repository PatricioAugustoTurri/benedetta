"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { fissaGiacenza } from "@/lib/magazzino";
import { getProdottoById } from "@/lib/prodotti";

export type EsitoGiacenza = { copie: number | null } | { error: string };

/**
 * Le copie di un formato, come lei le scrive: un numero, o vuoto per non
 * contarlo. Tocca solo il magazzino: il sito non lo legge, e per questo non
 * si rifà nessuna pagina pubblica.
 */
export async function fissaGiacenzaAzione(prodottoId: number, formato: string, crudo: string): Promise<EsitoGiacenza> {
  await requireSession();
  if (!Number.isInteger(prodottoId) || typeof formato !== "string") return { error: "Non ho capito quale stampa." };

  const pulito = String(crudo ?? "").trim();
  let copie: number | null = null;
  if (pulito) {
    if (!/^\d{1,5}$/.test(pulito)) return { error: "Scrivi un numero intero, o lascia vuoto." };
    copie = Number(pulito);
  }

  try {
    const prodotto = await getProdottoById(prodottoId);
    if (!prodotto) return { error: "Questa stampa non c’è più." };
    if (!prodotto.formati.some((f) => f.formato === formato)) return { error: "Questo formato non c’è più." };
    await fissaGiacenza(prodottoId, formato, copie);
  } catch {
    return { error: "Il database non ha risposto. Riprova." };
  }
  revalidatePath("/admin/magazzino");
  return { copie };
}
