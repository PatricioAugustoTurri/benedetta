"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { vaiAlPagamento, verificaCarrello, type EsitoPagamento } from "@/app/(sitio)/carrello/actions";
import { AZIONE } from "@/components/azione";
import { ArrowRight, Meno, Plus } from "@/components/Icon";
import { prezzo, prodottoHref } from "@/data/shop";
import type { TariffaSpedizione, Zona } from "@/lib/stripe";
import {
  cambiaQuantita,
  MAX_QUANTITA,
  sostituisci,
  togli,
  totaleCarrello,
  useCarrello,
  type VoceCarrello,
} from "./store";

const nessuno = () => () => {};

/**
 * Il carrello: le righe a sinistra, i conti e il pagamento a destra.
 *
 * Le righe sono la lista di filetti del sistema, non schede: miniatura,
 * nome, formato, quantità e importo, ognuno al suo posto in ogni riga perché
 * si confrontino scorrendo in verticale. I conti sono la stessa lista di
 * filetti della scheda di un'opera, con le cifre a destra in tabulari.
 *
 * **La zona di spedizione si sceglie qui e non su Stripe.** Vedi
 * `tariffeSpedizione`: così a Stripe arriva una tariffa sola e i paesi di
 * quella zona, e il prezzo della spedizione non può non coincidere con
 * l'indirizzo.
 */
export default function CarrelloVista({
  tariffe,
  inProva,
}: {
  tariffe: TariffaSpedizione[];
  inProva: boolean;
}) {
  const voci = useCarrello();
  // Il carrello vive nel browser: sul server e al primo disegno non si sa cosa
  // c'è. Finché non si è montato, la pagina non dice «vuoto», che sarebbe
  // falso per mezzo secondo.
  const montato = useSyncExternalStore(nessuno, () => true, () => false);
  const [avviso, setAvviso] = useState<string | null>(null);
  const [zona, setZona] = useState<Zona>("italia");
  const [esito, paga, pagando] = useActionState<EsitoPagamento, FormData>(vaiAlPagamento, {});
  const verificato = useRef(false);
  const id = useId();

  /*
    Una volta per visita, appena il carrello si legge, le righe si rifanno
    contro la tabella. Quello che c'è nel browser è una fotografia di quando si
    è aggiunto: il prezzo può essere cambiato, la stampa può non esserci più.
  */
  useEffect(() => {
    if (!montato || verificato.current || voci.length === 0) return;
    verificato.current = true;
    verificaCarrello(voci)
      .then(({ voci: nuove, tolte, prezziCambiati }) => {
        sostituisci(nuove);
        const cose = [
          tolte > 0 &&
            (tolte === 1
              ? "Una stampa non è più disponibile ed è uscita dal carrello."
              : `${tolte} stampe non sono più disponibili e sono uscite dal carrello.`),
          prezziCambiati && "Alcuni prezzi sono cambiati da quando li hai aggiunti: qui vedi quelli di adesso.",
        ].filter(Boolean);
        if (cose.length > 0) setAvviso(cose.join(" "));
      })
      .catch(() => {
        // Senza rete il carrello resta com'era: il pagamento lo rifà comunque.
      });
  }, [montato, voci]);

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

  const subtotale = totaleCarrello(voci);
  const tariffa = tariffe.find((t) => t.zona === zona);
  const spedizione = tariffa?.prezzo ?? null;

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
      <aside className="md:col-span-4 md:col-start-9">
        <form action={paga} className="md:sticky md:top-40">
          <input
            type="hidden"
            name="voci"
            value={JSON.stringify(voci.map(({ slug, formato, quantita }) => ({ slug, formato, quantita })))}
          />

          <fieldset>
            <legend className="label">Spedizione</legend>
            <div className="mt-3 border-t border-line">
              {tariffe.map((t) => (
                <label
                  key={t.zona}
                  htmlFor={`${id}-${t.zona}`}
                  data-scelto={t.zona === zona}
                  className="group flex cursor-pointer items-center justify-between gap-6 border-b border-line py-3 text-ink-soft transition-colors hover:text-ink data-[scelto=true]:text-ink"
                >
                  <span className="flex items-center gap-3">
                    <input
                      id={`${id}-${t.zona}`}
                      type="radio"
                      name="zona"
                      value={t.zona}
                      checked={t.zona === zona}
                      onChange={() => setZona(t.zona)}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-ink-faint transition-colors group-data-[scelto=true]:border-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
                    >
                      <span className="block h-1.5 w-1.5 rounded-full bg-accent opacity-0 transition-opacity group-data-[scelto=true]:opacity-100" />
                    </span>
                    <span className="text-sm">{t.etichetta}</span>
                  </span>
                  <span className="figures text-sm">{prezzo(t.prezzo)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <dl className="mt-8 border-t border-line">
            <Conto etichetta="Subtotale" valore={prezzo(subtotale)} />
            <Conto
              etichetta="Spedizione"
              valore={spedizione === null ? "—" : prezzo(spedizione)}
            />
            <div className="flex items-baseline justify-between gap-6 border-b border-line py-3.5">
              <dt className="label text-ink">Totale</dt>
              <dd className="figures text-lg font-medium">
                {spedizione === null ? prezzo(subtotale) : prezzo(subtotale + spedizione)}
              </dd>
            </div>
          </dl>

          {esito.error && (
            <p role="alert" className="mt-6 text-sm leading-relaxed text-accent">
              {esito.error}
            </p>
          )}

          <button
            type="submit"
            aria-disabled={pagando || undefined}
            className={`mt-8 w-full justify-center ${AZIONE} aria-disabled:cursor-wait aria-disabled:opacity-60`}
          >
            {pagando ? "Un momento…" : "Vai al pagamento"}
            {!pagando && <ArrowRight size={16} className="shrink-0" />}
          </button>

          <p className="mt-3 text-xs leading-relaxed text-ink-faint">
            Paghi su Stripe, con carta o con i metodi che propone. L&apos;indirizzo di
            spedizione lo scrivi lì.
          </p>

          {/*
            Solo con le chiavi di prova: chi sta provando il negozio deve sapere
            che non si addebita niente e con quale carta finta si paga.
          */}
          {inProva && (
            <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-ink-faint">
              Modalità di prova: non si addebita niente. Usa la carta{" "}
              <span className="figures text-ink-soft">4242 4242 4242 4242</span>, una data futura
              e un CVC qualsiasi.
            </p>
          )}
        </form>
      </aside>
    </div>
  );
}

function Conto({ etichetta, valore }: { etichetta: string; valore: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-3">
      <dt className="label">{etichetta}</dt>
      <dd className="figures text-sm">{valore}</dd>
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
