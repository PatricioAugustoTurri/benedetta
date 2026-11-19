"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { aggiungiMovimento, cancellaMovimento, leggiImporto } from "@/lib/conti";
import type { EstadoFormulario } from "../actions";

/**
 * Una vendita fuori dal sito o una spesa. Le vendite del sito non passano
 * di qui: le porta l'ordine.
 */
export async function aggiungiMovimentoAzione(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireSession();

  const giorno = String(formData.get("giorno") ?? "");
  const tipo = formData.get("tipo") === "spesa" ? "spesa" : "vendita";
  const canaleCrudo = String(formData.get("canale") ?? "");
  const importo = leggiImporto(String(formData.get("importo") ?? ""));
  const nota = String(formData.get("nota") ?? "").replace(/\s+/g, " ").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(giorno) || Number.isNaN(Date.parse(`${giorno}T00:00:00Z`))) {
    return { error: "Manca il giorno." };
  }
  if (tipo === "vendita" && canaleCrudo !== "contanti" && canaleCrudo !== "bonifico") {
    return { error: "Scegli se è entrata in contanti o con bonifico." };
  }
  if (importo === null) return { error: "L’importo non si è capito: scrivilo così, 12,50." };
  if (nota.length > 200) return { error: "La nota è troppo lunga: al massimo 200 caratteri." };

  try {
    await aggiungiMovimento({
      giorno,
      tipo,
      canale: tipo === "vendita" ? (canaleCrudo as "contanti" | "bonifico") : null,
      importo,
      nota: nota || null,
    });
  } catch {
    return { error: "Il database non ha risposto. Riprova." };
  }
  revalidatePath("/admin/conti");
  return { ok: true };
}

export async function cancellaMovimentoAzione(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await cancellaMovimento(id);
  revalidatePath("/admin/conti");
}
