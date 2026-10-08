import { listCopertine } from "@/lib/copertine";
import CopertineForm from "../../components/CopertineForm";
import IndietroAlloShop from "../../components/IndietroAlloShop";

export const metadata = { title: "Copertine dello Shop" };

export default async function CopertinePage() {
  const copertine = await listCopertine();

  return (
    <section className="shell pt-8 pb-16 md:pt-12">
      <IndietroAlloShop />
      <CopertineForm copertine={copertine} />
    </section>
  );
}
