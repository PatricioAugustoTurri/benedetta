import Link from "next/link";
import { ArrowRight } from "@/components/Icon";
import Reveal from "@/components/Reveal";
import { shopHref, type ShopCategory } from "@/data/shop";
import type { Prodotto } from "@/lib/prodotti";
import GrigliaProdotti from "./GrigliaProdotti";

/**
 * Le stampe: il nome della sezione, la riga di nota se c'è, e la griglia.
 * Oggi è l'unica categoria con una lista; i due servizi hanno una pagina sola.
 *
 * Il nome va in display e non in maiuscoletto: qui non apre una lista
 * qualunque, apre una parte del negozio, e chi scorre la pagina deve sapere
 * dove comincia la successiva senza leggere.
 *
 * **Una categoria vuota non sparisce.** Se si nascondesse, il menu
 * prometterebbe una sezione che la pagina non ha. Dice che non c'è ancora
 * niente e lascia la strada che c'è sempre: scriverle, con l'oggetto già
 * scritto.
 */
export default function SezioneCategoria({
  categoria,
  prodotti,
  titolo = "h2",
  conLink = false,
  eager = 0,
}: {
  categoria: ShopCategory;
  prodotti: Prodotto[];
  /** h1 nella pagina della categoria, h2 dentro lo Shop. */
  titolo?: "h1" | "h2";
  /** Il rimando alla pagina della categoria, solo dentro lo Shop. */
  conLink?: boolean;
  eager?: number;
}) {
  const Titolo = titolo;

  return (
    <section aria-labelledby={`categoria-${categoria.slug}`}>
      <Reveal>
        <div className="flex items-baseline justify-between gap-6 border-t border-line pt-6">
          <Titolo
            id={`categoria-${categoria.slug}`}
            className={
              titolo === "h1"
                ? "display-h1 text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance"
                : "display-section font-display text-[clamp(1.375rem,2.4vw,1.75rem)] leading-tight"
            }
          >
            {categoria.label}
          </Titolo>

          {conLink && prodotti.length > 0 && (
            <Link
              href={shopHref(categoria)}
              className="group inline-flex shrink-0 items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
            >
              <span className="link-underline">Vedi tutto</span>
              <ArrowRight
                size={16}
                className="shrink-0 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:translate-x-0.5"
              />
            </Link>
          )}
        </div>

        {categoria.note && (
          <p className="prose-measure mt-3 text-sm text-ink-soft">{categoria.note}</p>
        )}
      </Reveal>

      <Reveal delay={90}>
        <div className="mt-8 md:mt-10">
          {prodotti.length > 0 ? (
            <GrigliaProdotti prodotti={prodotti} eager={eager} />
          ) : (
            <p className="prose-measure text-sm leading-relaxed text-ink-faint">
              Non ci sono ancora stampe in vendita.{" "}
              <Link
                href={`/contatti?shop=${categoria.slug}`}
                className="link-underline text-ink-soft transition-colors hover:text-ink"
              >
                Scrivimi
              </Link>{" "}
              e ne parliamo.
            </p>
          )}
        </div>
      </Reveal>
    </section>
  );
}
