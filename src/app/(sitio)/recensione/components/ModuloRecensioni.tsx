"use client";

import Image from "@/components/Immagine";
import Link from "next/link";
import { startTransition, useActionState, useId, useState } from "react";
import { ArrowRight } from "@/components/Icon";
import { Stella } from "@/components/Stelle";
import { CONTROL, LABEL } from "@/components/campo";
import { inviaRecensioni, type EsitoRecensione } from "../actions";

export type ProdottoModulo = {
  id: number;
  title: string;
  href: string;
  immagine: { url: string; width: number; height: number; alt: string } | null;
};

const PAROLE = ["", "Non mi è piaciuto", "Così così", "Bello", "Molto bello", "Bellissimo"];

/**
 * Il modulo delle recensioni di un ordine: il nome con cui firmare, una
 * volta sola, e per ogni prodotto le stelle e due righe. Si può recensire
 * solo una parte dell'ordine: un prodotto lasciato vuoto si salta.
 *
 * Si invia da `onSubmit` e non con `action`: con `action` React svuota il
 * modulo dopo ogni invio, anche quando torna un errore, e chi ha dato le
 * stelle a tre prodotti e ha dimenticato il nome non deve ridarle.
 */
export default function ModuloRecensioni({
  chiave,
  nome,
  prodotti,
  max,
}: {
  chiave: string;
  nome: string | null;
  prodotti: ProdottoModulo[];
  max: { testo: number; autore: number };
}) {
  const [esito, azione, inCorso] = useActionState<EsitoRecensione, FormData>(inviaRecensioni, {});
  const [autore, setAutore] = useState(nome ?? "");
  const base = useId();
  const campi = esito.campi ?? {};

  if (esito.fatto) {
    return (
      <div role="status" className="border-t border-line pt-10">
        <p className="display-statement font-display text-[clamp(1.75rem,3.6vw,2.75rem)] leading-[1.15]">
          Grazie! Le tue parole sono già nello Shop.
        </p>
        <p className="prose-measure mt-5 text-lg leading-relaxed text-ink-soft">
          Mi aiuta tantissimo sapere com’è arrivato e dove l’hai messo.
        </p>
        <ul className="mt-8 space-y-2">
          {prodotti.map((p) => (
            <li key={p.id}>
              <Link href={p.href} className="group inline-flex items-center gap-1.5 text-ink transition-colors hover:text-accent">
                <span className="link-underline">{p.title}</span>
                <ArrowRight size={14} className="shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-14"
      onSubmit={(e) => {
        e.preventDefault();
        const dati = new FormData(e.currentTarget);
        startTransition(() => azione(dati));
      }}
    >
      <input type="hidden" name="chiave" value={chiave} />

      <ul className="space-y-14">
        {prodotti.map((p) => (
          <Voce key={p.id} prodotto={p} errore={campi[p.id]} max={max.testo} />
        ))}
      </ul>

      <div className="group/campo max-w-md">
        <label htmlFor={`${base}-autore`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
          Firma
        </label>
        <input
          id={`${base}-autore`}
          name="autore"
          value={autore}
          onChange={(e) => setAutore(e.target.value)}
          maxLength={max.autore}
          autoComplete="given-name"
          aria-invalid={Boolean(campi.autore)}
          aria-describedby={`${base}-autore-nota`}
          className={`${CONTROL} mt-2`}
        />
        <p id={`${base}-autore-nota`} className={`mt-2 text-xs ${campi.autore ? "text-accent" : "text-ink-faint"}`}>
          {campi.autore ?? "Esce così sotto la recensione. Basta il nome."}
        </p>
      </div>

      <div>
        {esito.errore && (
          <p role="alert" className="nota mb-6 max-w-md text-sm">
            {esito.errore}
          </p>
        )}
        <button
          type="submit"
          disabled={inCorso}
          className="cursor-pointer rounded-md bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ink disabled:cursor-wait disabled:opacity-60"
        >
          {inCorso ? "Invio…" : prodotti.length > 1 ? "Pubblica le recensioni" : "Pubblica la recensione"}
        </button>
      </div>
    </form>
  );
}

function Voce({ prodotto: p, errore, max }: { prodotto: ProdottoModulo; errore?: string; max: number }) {
  const [voto, setVoto] = useState(0);
  const [sopra, setSopra] = useState(0);
  const [testo, setTesto] = useState("");
  const base = useId();
  const acceso = sopra || voto;

  return (
    <li className="grid gap-6 sm:grid-cols-[7rem_1fr] sm:gap-8">
      <input type="hidden" name="prodotto" value={p.id} />
      <div className="w-24 sm:w-28">
        {p.immagine && (
          <Image
            src={p.immagine.url}
            alt=""
            width={p.immagine.width}
            height={p.immagine.height}
            sizes="112px"
            className="aspect-[4/5] w-full bg-paper-deep object-cover"
          />
        )}
      </div>

      <div className="min-w-0">
        <p className="display-title font-display">{p.title}</p>

        <fieldset className="mt-4" aria-describedby={errore ? `${base}-errore` : undefined}>
          <legend className="sr-only">Quante stelle a {p.title}</legend>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex text-[1.75rem]" onMouseLeave={() => setSopra(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="cursor-pointer px-0.5" onMouseEnter={() => setSopra(n)}>
                  <input
                    type="radio"
                    name={`voto-${p.id}`}
                    value={n}
                    checked={voto === n}
                    onChange={() => setVoto(n)}
                    className="peer sr-only"
                  />
                  <span className="sr-only">{n === 1 ? "1 stella" : `${n} stelle`}</span>
                  <span className="block rounded-sm transition-transform duration-200 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink hover:scale-110">
                    <Stella pieno={acceso >= n ? 1 : 0} />
                  </span>
                </label>
              ))}
            </div>
            <span className="text-sm text-ink-soft" aria-hidden="true">
              {PAROLE[acceso]}
            </span>
          </div>
        </fieldset>

        <div className="group/campo mt-5">
          <label htmlFor={`${base}-testo`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
            Com’è
          </label>
          <textarea
            id={`${base}-testo`}
            name={`testo-${p.id}`}
            rows={3}
            maxLength={max}
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            placeholder="Com’è arrivato, la carta, i colori, dove l’hai messo…"
            aria-invalid={Boolean(errore)}
            className={`${CONTROL} mt-2 field-sizing-content resize-y leading-relaxed`}
          />
          <div className="mt-2 flex justify-between gap-4 text-xs">
            <span id={`${base}-errore`} className="text-accent">
              {errore}
            </span>
            <span className="figures text-ink-faint">
              {testo.length}/{max}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}
