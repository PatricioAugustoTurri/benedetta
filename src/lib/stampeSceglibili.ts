import { prezzoMinimo } from "@/data/shop";
import { listProdotti } from "@/lib/prodotti";
import { immagineFerma } from "@/lib/video";
import type { StampaSceglibile } from "@/app/admin/components/ScontoForm";

/** Le stampe come le vuole il selettore dello sconto: tutte, bozze comprese, nell'ordine dello Shop. */
export async function listStampeSceglibili(): Promise<StampaSceglibile[]> {
  return (await listProdotti()).map((p) => ({
    id: p.id,
    title: p.title,
    immagine: p.image[0] ? immagineFerma(p.image[0]) : null,
    minimo: prezzoMinimo(p.formati),
    pubblicato: p.pubblicato,
  }));
}
