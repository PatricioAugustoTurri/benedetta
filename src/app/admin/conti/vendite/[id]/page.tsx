import { notFound } from "next/navigation";
import { richiediAccesso } from "@/lib/auth";
import { getVendita, listClienti } from "@/lib/conti";
import { oggiInItalia } from "@/lib/oggi";
import CancellaRiga from "../../../components/CancellaRiga";
import IndietroAiConti from "../../../components/IndietroAiConti";
import VenditaForm from "../../../components/VenditaForm";
import { cancellaVenditaAzione } from "../../actions";

export const metadata = { title: "Vendita" };

type Params = { params: Promise<{ id: string }> };

export default async function ModificaVenditaPage({ params }: Params) {
  const { id } = await params;
  await richiediAccesso(`/admin/conti/vendite/${id}`);
  const n = Number(id);
  const vendita = Number.isInteger(n) ? await getVendita(n) : null;
  if (!vendita) notFound();
  const clienti = await listClienti();

  return (
    <section className="shell max-w-5xl pt-8 pb-24 md:pt-12">
      <IndietroAiConti mese={vendita.giorno.slice(0, 7)} />
      <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <h1 className="display-lead font-display text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15]">{vendita.nome}</h1>
          <p className="figures mt-1 text-xs text-ink-faint">{vendita.numero}</p>
        </div>
        <CancellaRiga
          azione={cancellaVenditaAzione}
          id={vendita.id}
          descrizione={`la vendita ${vendita.numero}`}
          testo="Cancella la vendita"
        />
      </div>
      <VenditaForm vendita={vendita} oggi={oggiInItalia()} clienti={clienti} stampe={[]} />
    </section>
  );
}
