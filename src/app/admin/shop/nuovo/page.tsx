import { listWorks } from "@/lib/works";
import IndietroAlloShop from "../../components/IndietroAlloShop";
import ProdottoForm from "../../components/ProdottoForm";

export const metadata = { title: "Nuova stampa" };

export default async function NuovoProdottoPage() {
  const opere = await listWorks();

  return (
    <section className="shell pt-8 pb-16 md:pt-12">
      <IndietroAlloShop />
      <ProdottoForm opere={opere.map((o) => ({ slug: o.slug, title: o.title }))} />
    </section>
  );
}
