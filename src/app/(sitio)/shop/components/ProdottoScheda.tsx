import Link from "next/link";
import AggiungiAlCarrello from "@/components/carrello/AggiungiAlCarrello";
import { ArrowRight } from "@/components/Icon";
import Reveal from "@/components/Reveal";
import type { Prodotto } from "@/lib/prodotti";
import { immagineFerma } from "@/lib/video";

/**
 * La colonna di una stampa, al posto della scheda di un'opera: formato,
 * prezzo, carrello, e il filo che riporta all'opera da cui esce.
 */
export default function ProdottoScheda({
  prodotto,
  opera,
}: {
  prodotto: Prodotto;
  /** L'opera dell'archivio da cui esce la stampa, se esce da una. */
  opera: { slug: string; title: string } | null;
}) {
  const portada = prodotto.image[0];

  return (
    <aside className="opera__scheda">
      <Reveal delay={90}>
        <AggiungiAlCarrello
          slug={prodotto.slug}
          title={prodotto.title}
          formati={prodotto.formati}
          immagine={
            portada
              ? {
                  url: immagineFerma(portada),
                  width: portada.width,
                  height: portada.height,
                  alt: portada.alt,
                }
              : undefined
          }
        />

        {/*
          Il filo che riporta all'archivio: la stampa è la copia, l'opera è
          l'originale con la sua storia. Va dopo l'azione, in piccolo, perché
          è una strada laterale e non la ragione per cui si è qui.
        */}
        {opera && (
          <p className="mt-8 border-t border-line pt-4 text-sm text-ink-soft">
            Dall&apos;opera{" "}
            <Link
              href={`/opera/${opera.slug}`}
              className="group inline-flex items-center gap-1 text-ink transition-colors hover:text-accent"
            >
              <span className="link-underline">{opera.title}</span>
              <ArrowRight size={14} className="shrink-0" />
            </Link>
          </p>
        )}
      </Reveal>
    </aside>
  );
}
