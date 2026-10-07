import { notFound } from "next/navigation";
import { getProdottoById } from "@/lib/prodotti";
import { listWorks } from "@/lib/works";
import ProdottoForm from "../../components/ProdottoForm";
import IndietroAlloShop from "../../components/IndietroAlloShop";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  const p = await getProdottoById(Number(id));
  return { title: p ? p.title : "Prodotto" };
}

export default async function ModificaProdottoPage({ params }: Params) {
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero)) notFound();

  const [prodotto, opere] = await Promise.all([getProdottoById(numero), listWorks()]);
  if (!prodotto) notFound();

  return (
    <section className="shell pt-8 pb-16 md:pt-12">
      <IndietroAlloShop />
      <ProdottoForm prodotto={prodotto} opere={opere.map((o) => ({ slug: o.slug, title: o.title }))} />
    </section>
  );
}
