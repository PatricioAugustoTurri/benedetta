import { notFound } from "next/navigation";
import { richiediAccesso } from "@/lib/auth";
import { listCategorie } from "@/lib/categorie";
import { getProdottoById } from "@/lib/prodotti";
import { contaInviti } from "@/lib/recensioni";
import { listWorks } from "@/lib/works";
import ProdottoForm from "../../components/ProdottoForm";
import IndietroAlloShop from "../../components/IndietroAlloShop";
import QrRecensione from "../../components/QrRecensione";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  const p = await getProdottoById(Number(id));
  return { title: p ? p.title : "Prodotto" };
}

export default async function ModificaProdottoPage({ params }: Params) {
  await richiediAccesso();
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero)) notFound();

  const [prodotto, opere, tutte, inviti] = await Promise.all([
    getProdottoById(numero),
    listWorks(),
    listCategorie(),
    contaInviti(numero),
  ]);
  if (!prodotto) notFound();
  const categorie = tutte.filter((c) => c.vendita);
  const categoria = categorie.find((c) => c.slug === prodotto.categoria);
  if (!categoria) notFound();

  return (
    <section className="shell pt-8 pb-16 md:pt-12">
      <IndietroAlloShop />
      <ProdottoForm
        prodotto={prodotto}
        categoria={categoria}
        categorie={categorie}
        opere={opere.map((o) => ({ slug: o.slug, title: o.title }))}
        accanto={
          prodotto.pubblicato ? (
            <QrRecensione
              prodotto={{ id: prodotto.id, title: prodotto.title, slug: prodotto.slug }}
              aspetto="scheda"
              conto={inviti}
            />
          ) : (
            <div>
              <h2 className="label">Recensione dal vivo</h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                Quando è pubblicato, da qui fai il QR per chi l’ha comprato fuori dal sito: la
                recensione esce nella sua pagina, e una bozza non ce l’ha.
              </p>
            </div>
          )
        }
      />
    </section>
  );
}
