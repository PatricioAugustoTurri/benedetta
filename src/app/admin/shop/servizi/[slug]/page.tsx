import { notFound } from "next/navigation";
import { richiediAccesso } from "@/lib/auth";
import { getServizio } from "@/lib/servizi";
import { listTestimonianze } from "@/lib/testimonianze";
import Testimonianze from "../../../components/Testimonianze";
import IndietroAlloShop from "../../../components/IndietroAlloShop";
import ServizioForm from "../../../components/ServizioForm";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const s = await getServizio(slug);
  return { title: s ? s.title : "Servizio" };
}

export default async function ModificaServizioPage({ params }: Params) {
  await richiediAccesso();
  const { slug } = await params;
  const servizio = await getServizio(slug);
  if (!servizio) notFound();
  const testimonianze = await listTestimonianze(servizio.slug);

  return (
    <section className="shell pt-8 pb-16 md:pt-12">
      <IndietroAlloShop />
      <ServizioForm servizio={servizio} />
      <Testimonianze servizio={servizio.slug} lista={testimonianze} />
    </section>
  );
}
