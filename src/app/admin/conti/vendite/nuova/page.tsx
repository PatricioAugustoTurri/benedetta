import { richiediAccesso } from "@/lib/auth";
import { listClienti } from "@/lib/conti";
import { oggiInItalia } from "@/lib/oggi";
import IndietroAiConti from "../../../components/IndietroAiConti";
import VenditaForm from "../../../components/VenditaForm";
import { stampeDelCassetto } from "../../stampeDelCassetto";

export const metadata = { title: "Nuova vendita" };

export default async function NuovaVenditaPage() {
  await richiediAccesso("/admin/conti/vendite/nuova");
  const [clienti, stampe] = await Promise.all([listClienti(), stampeDelCassetto()]);
  return (
    <section className="shell max-w-5xl pt-8 pb-24 md:pt-12">
      <IndietroAiConti />
      <h1 className="display-lead font-display text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15]">Nuova vendita</h1>
      <p className="mt-2 mb-10 max-w-[60ch] text-sm text-ink-soft">
        In contanti o con bonifico. Quelle del sito non si scrivono: entrano da sole dagli ordini.
      </p>
      <VenditaForm oggi={oggiInItalia()} clienti={clienti} stampe={stampe} />
    </section>
  );
}
