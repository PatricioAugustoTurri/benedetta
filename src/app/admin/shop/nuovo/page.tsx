import { notFound } from "next/navigation";
import { richiediAccesso } from "@/lib/auth";
import { listCategorie } from "@/lib/categorie";
import { listWorks } from "@/lib/works";
import IndietroAlloShop from "../../components/IndietroAlloShop";
import ProdottoForm from "../../components/ProdottoForm";

type Params = { searchParams: Promise<{ categoria?: string }> };

export async function generateMetadata({ searchParams }: Params) {
  const { categoria } = await searchParams;
  return { title: !categoria || categoria === "stampe" ? "Nuova stampa" : "Nuovo prodotto" };
}

/**
 * Un prodotto nuovo, nella categoria da cui si è entrati: la casella
 * tratteggiata di ogni griglia porta qui con `?categoria=<slug>`. Senza,
 * è una stampa, come prima che esistessero altre categorie.
 */
export default async function NuovoProdottoPage({ searchParams }: Params) {
  const { categoria: slug = "stampe" } = await searchParams;
  await richiediAccesso(`/admin/shop/nuovo?categoria=${encodeURIComponent(slug)}`);
  const [opere, tutte] = await Promise.all([listWorks(), listCategorie()]);
  const categorie = tutte.filter((c) => c.vendita);
  const categoria = categorie.find((c) => c.slug === slug);
  if (!categoria) notFound();

  return (
    <section className="shell pt-8 pb-16 md:pt-12">
      <IndietroAlloShop />
      <ProdottoForm
        categoria={categoria}
        categorie={categorie}
        opere={opere.map((o) => ({ slug: o.slug, title: o.title }))}
      />
    </section>
  );
}
