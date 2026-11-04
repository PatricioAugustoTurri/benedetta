import { richiediAccesso } from "@/lib/auth";
import CategoriaForm from "../../../components/CategoriaForm";
import IndietroAlloShop from "../../../components/IndietroAlloShop";

export const metadata = { title: "Nuova categoria" };

export default async function NuovaCategoriaPage() {
  await richiediAccesso("/admin/shop/categorie/nuova");
  return (
    <section className="shell pt-8 md:pt-12">
      <IndietroAlloShop />
      <CategoriaForm />
    </section>
  );
}
