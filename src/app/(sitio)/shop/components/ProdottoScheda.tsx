import Link from "next/link";
import AggiungiAlCarrello from "@/components/carrello/AggiungiAlCarrello";
import { ArrowRight } from "@/components/Icon";
import Reveal from "@/components/Reveal";
import { legaliPronte } from "@/data/legale";
import type { Prodotto } from "@/lib/prodotti";
import { immagineFerma } from "@/lib/video";

/** «24 dicembre», dal «2026-12-24» dello sconto. */
const giorno = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );

/**
 * La colonna di una stampa, al posto della scheda di un'opera: formato,
 * prezzo, carrello, e il filo che riporta all'opera da cui esce.
 */
export default function ProdottoScheda({
  prodotto,
  opera,
  sconto,
}: {
  prodotto: Prodotto;
  /** L'opera dell'archivio da cui esce la stampa, se esce da una. */
  opera: { slug: string; title: string } | null;
  /** Lo sconto in corso su questa stampa, se c'è. */
  sconto?: { percentuale: number; titolo: string; al: string } | null;
}) {
  const portada = prodotto.image[0];

  return (
    <div className="opera__scheda">
      <Reveal delay={90}>
        {/*
          Lo sconto si dice sopra i formati, con il suo nome e il suo ultimo
          giorno: è un prezzo che scade, e chi compra deve saperlo.
        */}
        {sconto && (
          <p className="mb-5 flex items-start gap-2.5 text-sm leading-relaxed text-ink">
            <span aria-hidden="true" className="mt-[0.55em] block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>
              {sconto.titolo}: <strong className="font-medium">−{sconto.percentuale}%</strong> fino al{" "}
              {giorno(sconto.al)}.
            </span>
          </p>
        )}
        <AggiungiAlCarrello
          sconto={sconto?.percentuale}
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
          Le domande che vengono subito dopo il prezzo —che carta, quando
          arriva, se si può restituire— hanno una pagina sola. Qui la strada,
          in piccolo, sotto l'azione.
        */}
        <p className="mt-6 text-xs leading-relaxed text-ink-faint">
          Stampata su ordinazione
          {legaliPronte() && (
            <>
              {" · "}
              <Link
                href="/spedizioni-e-resi"
                className="area-tocco link-underline text-ink-soft transition-colors hover:text-ink"
              >
                carta, misure e resi
              </Link>
            </>
          )}
        </p>

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
    </div>
  );
}
