import { notFound } from "next/navigation";
import { richiediAccesso } from "@/lib/auth";
import { categoriaFissa, listCategorieAdmin } from "@/lib/categorie";
import CategoriaForm from "../../../components/CategoriaForm";
import IndietroAlloShop from "../../../components/IndietroAlloShop";

type Params = { params: Promise<{ slug: string }> };

async function cerca(slug: string) {
  return (await listCategorieAdmin()).find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const c = await cerca(slug);
  return { title: c ? c.label : "Categoria" };
}

export default async function CategoriaPage({ params }: Params) {
  const { slug } = await params;
  await richiediAccesso(`/admin/shop/categorie/${slug}`);
  const categoria = await cerca(slug);
  if (!categoria) notFound();

  return (
    <section className="shell pt-8 md:pt-12">
      <IndietroAlloShop />
      {/* La chiave rifà il modulo quando cambiano i conti: una cancellazione
          rifiutata torna qui con il prodotto che è entrato nel frattempo. */}
      <CategoriaForm
        key={`${categoria.prodotti}`}
        categoria={categoria}
        fissa={categoriaFissa(categoria.slug)}
      />
    </section>
  );
}
