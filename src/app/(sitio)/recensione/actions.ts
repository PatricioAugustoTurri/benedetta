"use server";

import { revalidatePath } from "next/cache";
import { MAX_RECENSIONE, scriviRecensioni, type VoceRecensione } from "@/lib/recensioni";

export type EsitoRecensione = {
  fatto?: boolean;
  errore?: string;
  /** Il motivo per campo: «autore», o l'id del prodotto. */
  campi?: Record<string, string>;
};

const pulisci = (v: FormDataEntryValue | null, max: number) =>
  String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/**
 * Le recensioni di un ordine, tutte insieme. Un prodotto senza stelle e
 * senza testo si salta —si può recensire solo quello che si vuole—; uno
 * con le stelle e senza parole, o al contrario, si ferma e lo dice.
 */
export async function inviaRecensioni(_previo: EsitoRecensione, formData: FormData): Promise<EsitoRecensione> {
  const chiave = String(formData.get("chiave") ?? "");
  const autore = pulisci(formData.get("autore"), MAX_RECENSIONE.autore);
  const campi: Record<string, string> = {};
  const voci: VoceRecensione[] = [];

  for (const id of formData.getAll("prodotto").map(Number).filter(Number.isInteger)) {
    const voto = Number(formData.get(`voto-${id}`) ?? 0);
    const testo = String(formData.get(`testo-${id}`) ?? "").trim().slice(0, MAX_RECENSIONE.testo);
    if (!voto && !testo) continue;
    if (!(voto >= 1 && voto <= 5)) campi[id] = "Scegli da 1 a 5 stelle.";
    else if (testo.length < 3) campi[id] = "Scrivi due parole su com’è.";
    else voci.push({ prodotto: id, voto, testo });
  }
  if (autore.length < 2) campi.autore = "Scrivi il nome con cui firmare.";
  if (Object.keys(campi).length > 0) return { errore: "Manca qualcosa: è segnato più su.", campi };
  if (voci.length === 0) return { errore: "Dai le stelle ad almeno un prodotto." };

  try {
    const esito = await scriviRecensioni(chiave, autore, voci);
    if (!esito.ok) {
      return {
        errore: {
          chiave: "Questo link non è valido.",
          presto: "Potrai lasciare la recensione quando il pacco sarà partito.",
          rimborsato: "Quest’ordine è stato rimborsato: non si può recensire.",
          usata: "Hai già lasciato la tua recensione per quest’ordine. Grazie!",
          niente: "Questi prodotti hanno già la loro recensione. Grazie!",
        }[esito.motivo],
      };
    }
  } catch (e) {
    console.error("Recensioni: non salvate.", e);
    return { errore: "Non sono riuscita a salvarle. Riprova fra poco." };
  }

  // La pagina del prodotto si fa a ogni visita; il resto dello Shop si
  // rifà ogni cinque minuti. Rifarlo adesso costa poco e non lascia dubbi.
  revalidatePath("/shop", "layout");
  return { fatto: true };
}
