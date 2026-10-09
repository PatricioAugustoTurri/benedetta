import { richiediAccesso } from "@/lib/auth";
import CodiceForm from "../../../components/CodiceForm";
import IndietroAlloShop from "../../../components/IndietroAlloShop";

export const metadata = { title: "Nuovo codice" };

export default async function NuovoCodicePage() {
  await richiediAccesso("/admin/shop/codici/nuovo");
  return (
    <section className="shell pt-8 md:pt-12">
      <IndietroAlloShop />
      <CodiceForm />
    </section>
  );
}
