import { richiediAccesso } from "@/lib/auth";
import { listStampeSceglibili } from "@/lib/stampeSceglibili";
import IndietroAlloShop from "../../../components/IndietroAlloShop";
import ScontoForm from "../../../components/ScontoForm";

export const metadata = { title: "Nuovo sconto" };

export default async function NuovoScontoPage() {
  await richiediAccesso("/admin/shop/sconti/nuovo");
  const stampe = await listStampeSceglibili();
  return (
    <section className="shell pt-8 md:pt-12">
      <IndietroAlloShop />
      <ScontoForm stampe={stampe} />
    </section>
  );
}
