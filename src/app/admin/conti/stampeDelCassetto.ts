import { listCategorieAdmin } from "@/lib/categorie";
import { listGiacenze } from "@/lib/magazzino";
import { listProdotti } from "@/lib/prodotti";
import type { StampaDelCassetto } from "../components/VenditaForm";

/**
 * Le stampe che una vendita può togliere dal magazzino: le stesse del
 * Magazzino —quelle che il sito non conta—, nell'ordine dello Shop, con le
 * copie di ogni formato.
 */
export async function stampeDelCassetto(): Promise<StampaDelCassetto[]> {
  const [prodotti, categorie, giacenze] = await Promise.all([listProdotti(), listCategorieAdmin(), listGiacenze()]);
  return categorie.flatMap((c) =>
    prodotti
      .filter((p) => p.categoria === c.slug && p.scorte === null)
      .map((p) => ({
        id: p.id,
        titolo: p.title,
        categoria: c.label,
        formati: p.formati.map((f) => ({ formato: f.formato, copie: giacenze[p.id]?.[f.formato] ?? null })),
      })),
  );
}
