import { notFound } from "next/navigation";
import { richiediAccesso } from "@/lib/auth";
import { getCodice } from "@/lib/codici";
import CodiceForm from "../../../components/CodiceForm";
import IndietroAlloShop from "../../../components/IndietroAlloShop";

type Params = { params: Promise<{ id: string }> };

export const metadata = { title: "Codice sconto" };

export default async function ModificaCodicePage({ params }: Params) {
  const { id } = await params;
  await richiediAccesso(`/admin/shop/codici/${id}`);
  const n = Number(id);
  if (!Number.isInteger(n)) notFound();
  const codice = await getCodice(n);
  if (!codice) notFound();
  return (
    <section className="shell pt-8 md:pt-12">
      <IndietroAlloShop />
      <CodiceForm codice={codice} />
    </section>
  );
}
