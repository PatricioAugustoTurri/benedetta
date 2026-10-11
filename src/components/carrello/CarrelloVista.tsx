"use client";

import Image from "next/image";
import Link from "next/link";
import { AZIONE } from "@/components/azione";
import { ArrowRight, Meno, Plus } from "@/components/Icon";
import { prezzo, prodottoHref } from "@/data/shop";
import { tariffeSpedizione } from "@/lib/spedizione";
import { Conto } from "./Conti";
import { cambiaQuantita, MAX_QUANTITA, togli, totaleCarrello, type VoceCarrello } from "./store";
import { useCarrelloVerificato } from "./useCarrelloVerificato";

const [ITALIA, UE] = tariffeSpedizione();

/**
 * Il carrello: le righe a sinistra, il subtotale e la strada per la cassa a
 * destra. Qui si decide cosa e quante copie; chi riceve, dove, e il codice
 * sconto si scrivono alla cassa (/carrello/cassa), come su qualsiasi pagina
 * di pagamento.
 *
 * Le righe sono la lista di filetti del sistema, non schede: miniatura,
 * nome, formato, quantità e importo, ognuno al suo posto in ogni riga perché
 * si confrontino scorrendo in verticale. I conti sono la stessa lista di
 * filetti della scheda di un'opera, con le cifre a destra in tabulari.
 */
export default function CarrelloVista() {
  const { voci, montato, avviso } = useCarrelloVerificato();

  if (!montato) return <div className="min-h-[40vh]" aria-hidden="true" />;

  if (voci.length === 0) {
    return (
      <div className="flex min-h-[36vh] flex-col justify-center">
        {avviso && <p className="mb-6 text-sm text-accent">{avviso}</p>}
        <p className="prose-measure text-lg leading-relaxed text-ink-soft">Il carrello è vuoto.</p>
        <Link
          href="/shop/stampe"
          className="group mt-5 inline-flex items-center gap-1.5 self-start text-sm text-ink transition-colors hover:text-accent"
        >
          <span className="link-underline" data-active="true">
            Guarda le stampe
          </span>
          <ArrowRight size={16} className="shrink-0" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-12 md:grid-cols-12 md:gap-16">
      <div className="md:col-span-7">
        {avviso && (
          <p role="status" className="mb-6 border-l border-accent py-1 pl-3 text-sm text-accent">
            {avviso}
          </p>
        )}

        <ul className="border-t border-line">
          {voci.map((v) => (
            <Riga key={`${v.slug}|${v.formato}`} voce={v} />
          ))}
        </ul>
      </div>

      {/*
        I conti restano in vista mentre si scorre una lista lunga: sono quello
        che si guarda per decidere, e il pulsante che li chiude non deve
        richiedere di tornare giù.
      */}
      <div className="md:col-span-4 md:col-start-9">
        <div className="md:sticky md:top-40">
          <h2 className="label">Riepilogo</h2>
          <dl className="mt-3 border-t border-line">
            <Conto etichetta="Subtotale" valore={prezzo(totaleCarrello(voci))} />
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-ink-faint">
            Spedizione alla cassa: <span className="figures">{prezzo(ITALIA.prezzo)}</span> in Italia,{" "}
            <span className="figures">{prezzo(UE.prezzo)}</span> nell&apos;Unione Europea, una volta per
            ordine. Lì scrivi anche il codice sconto, se ce l&apos;hai.
          </p>

          <Link href="/carrello/cassa" className={`mt-8 w-full justify-center ${AZIONE}`}>
            Procedi all&apos;acquisto
            <ArrowRight size={16} className="shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Una riga: la copertina in 4:5 come nella griglia, nome e formato, la
 * quantità con meno e più, e l'importo della riga.
 *
 * I pulsanti della quantità misurano 32px e non 20: sono il bersaglio più
 * piccolo della pagina e sul telefono si toccano col pollice.
 */
function Riga({ voce: v }: { voce: VoceCarrello }) {
  const href = prodottoHref({ categoria: "stampe", slug: v.slug });

  return (
    <li className="flex gap-4 border-b border-line py-5 sm:gap-5">
      <Link href={href} className="block w-20 shrink-0 self-start overflow-hidden bg-paper-deep sm:w-24" tabIndex={-1} aria-hidden="true">
        {v.immagine && (
          <Image
            src={v.immagine.url}
            alt=""
            width={v.immagine.width}
            height={v.immagine.height}
            sizes="96px"
            className="aspect-[4/5] w-full object-cover"
          />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={href}
              className="link-underline text-[0.9375rem] leading-snug text-ink transition-colors hover:text-accent"
            >
              {v.title}
            </Link>
            <p className="mt-1 text-sm text-ink-soft">
              {v.formato}
              <span aria-hidden="true"> · </span>
              <span className="figures">{prezzo(v.prezzo)}</span>
            </p>
          </div>
          <p className="figures shrink-0 text-sm text-ink">{prezzo(v.prezzo * v.quantita)}</p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center" role="group" aria-label={`Copie di ${v.title}, ${v.formato}`}>
            <button
              type="button"
              onClick={() => cambiaQuantita(v.slug, v.formato, v.quantita - 1)}
              disabled={v.quantita <= 1}
              className="flex h-8 w-8 items-center justify-center border border-line text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-40"
            >
              <span className="sr-only">Una copia in meno</span>
              <Meno size={14} />
            </button>
            <output
              aria-live="polite"
              className="figures flex h-8 min-w-9 items-center justify-center border-y border-line px-2 text-sm"
            >
              {v.quantita}
            </output>
            <button
              type="button"
              onClick={() => cambiaQuantita(v.slug, v.formato, v.quantita + 1)}
              disabled={v.quantita >= MAX_QUANTITA}
              className="flex h-8 w-8 items-center justify-center border border-line text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-40"
            >
              <span className="sr-only">Una copia in più</span>
              <Plus size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => togli(v.slug, v.formato)}
            className="text-xs text-ink-faint transition-colors hover:text-accent"
          >
            <span className="link-underline">Togli</span>
          </button>
        </div>
      </div>
    </li>
  );
}
