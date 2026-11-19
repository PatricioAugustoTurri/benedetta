import Link from "next/link";
import { richiediAccesso } from "@/lib/auth";
import { listCategorieAdmin } from "@/lib/categorie";
import { listGiacenze } from "@/lib/magazzino";
import { listProdotti } from "@/lib/prodotti";
import { pingDb } from "@/lib/works";
import Cassetto from "../components/Cassetto";
import Sezione from "../components/Sezione";

export const metadata = { title: "Magazzino" };

/**
 * Il magazzino di lei: quante stampe ha davvero, formato per formato. Una
 * sezione per categoria, nell'ordine dello Shop.
 *
 * È solo un conto suo. Il sito non lo legge: una stampa a zero si vende lo
 * stesso. Per questo restano fuori i prodotti che il sito conta davvero —i
 * quaderni, con le copie in `prodotti.scorte`—, che hanno il loro magazzino
 * nello Shop: due numeri per la stessa cosa finirebbero per non tornare.
 */
export default async function MagazzinoPage() {
  await richiediAccesso("/admin/magazzino");
  if (!(await pingDb())) {
    return (
      <section className="shell py-24">
        <h1 className="display-lead font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.15]">
          Il database non risponde.
        </h1>
      </section>
    );
  }

  const [prodotti, categorie, giacenze] = await Promise.all([listProdotti(), listCategorieAdmin(), listGiacenze()]);
  const contatiNelloShop = prodotti.filter((p) => p.scorte !== null);

  const sezioni = categorie
    .filter((c) => c.vendita)
    .map((c) => ({ categoria: c, dentro: prodotti.filter((p) => p.categoria === c.slug && p.scorte === null) }))
    .filter((s) => s.dentro.length > 0);

  return (
    <section className="shell pt-8 pb-24 md:pt-12">
      <h1 className="sr-only">Magazzino</h1>
      <p className="mb-8 nota nota--neutra">
        Solo per te: il sito non lo legge. Una stampa a zero si vende lo stesso.
      </p>

      <div className="space-y-20 md:space-y-28">
        {sezioni.map(({ categoria: c, dentro }) => {
          let copie = 0;
          for (const p of dentro) {
            for (const f of p.formati) copie += giacenze[p.id]?.[f.formato] ?? 0;
          }
          return (
            <Sezione
              key={c.slug}
              id={`mag-${c.slug}`}
              titolo={c.label}
              accanto={`${copie} ${copie === 1 ? "copia" : "copie"} nel cassetto`}
              testo={
                <>
                  <p>Scrivi quante ne hai per ogni formato: si salva quando esci dal campo, o con Invio.</p>
                  <p>Vuoto vuol dire che quel formato non lo conti.</p>
                </>
              }
            >
              <Cassetto prodotti={dentro} giacenze={giacenze} />
            </Sezione>
          );
        })}

        {sezioni.length === 0 && <p className="text-sm text-ink-soft">Nello Shop non c’è ancora niente da contare.</p>}

        {contatiNelloShop.length > 0 && (
          <p className="max-w-[60ch] text-xs leading-relaxed text-ink-faint">
            {contatiNelloShop.length === 1 ? "Un prodotto conta" : `${contatiNelloShop.length} prodotti contano`} le
            copie nello Shop, e lì a zero risulta esaurito: {contatiNelloShop.map((p) => p.title).join(", ")}.{" "}
            <Link href="/admin/shop" className="link-underline text-ink-soft transition-colors hover:text-ink">
              Si cambiano dallo Shop
            </Link>
            .
          </p>
        )}
      </div>
    </section>
  );
}
