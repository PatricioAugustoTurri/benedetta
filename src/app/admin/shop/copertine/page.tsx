import { listLibreria, listPorte } from "@/lib/copertine";
import CopertineForm from "../../components/CopertineForm";
import IndietroAlloShop from "../../components/IndietroAlloShop";

export const metadata = { title: "Copertine dello Shop" };

export default async function CopertinePage() {
  const [porte, libreria] = await Promise.all([listPorte(), listLibreria()]);

  return (
    <section className="shell pt-8 md:pt-12">
      <IndietroAlloShop />
      <CopertineForm porte={porte} libreria={libreria} />
    </section>
  );
}
