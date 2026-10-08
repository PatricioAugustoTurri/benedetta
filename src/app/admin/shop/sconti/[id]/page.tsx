import { notFound } from "next/navigation";
import { richiediAccesso } from "@/lib/auth";
import { getSconto } from "@/lib/sconti";
import { listStampeSceglibili } from "@/lib/stampeSceglibili";
import IndietroAlloShop from "../../../components/IndietroAlloShop";
import ScontoForm from "../../../components/ScontoForm";

type Params = { params: Promise<{ id: string }> };

export const metadata = { title: "Sconto" };

export default async function ModificaScontoPage({ params }: Params) {
  const { id } = await params;
  await richiediAccesso(`/admin/shop/sconti/${id}`);
  const n = Number(id);
  if (!Number.isInteger(n)) notFound();
  const [sconto, stampe] = await Promise.all([getSconto(n), listStampeSceglibili()]);
  if (!sconto) notFound();
  return (
    <section className="shell pt-8 md:pt-12">
      <IndietroAlloShop />
      <ScontoForm sconto={sconto} stampe={stampe} />
    </section>
  );
}
