import { notFound } from "next/navigation";
import { getServizio } from "@/lib/servizi";
import IndietroAlloShop from "../../../components/IndietroAlloShop";
import ServizioForm from "../../../components/ServizioForm";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const s = await getServizio(slug);
  return { title: s ? s.title : "Servizio" };
}

export default async function ModificaServizioPage({ params }: Params) {
  const { slug } = await params;
  const servizio = await getServizio(slug);
  if (!servizio) notFound();

  return (
    <section className="shell pt-8 pb-16 md:pt-12">
      <IndietroAlloShop />
      <ServizioForm servizio={servizio} />
    </section>
  );
}
