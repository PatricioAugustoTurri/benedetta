"use client";

import { startTransition, useActionState, useId, useState } from "react";
import { CONTROL, LABEL } from "@/components/campo";
import { inviaTestimonianza, type EsitoRecensione } from "../actions";
import SceltaStelle from "./SceltaStelle";

/**
 * Il modulo di chi ha commissionato un ritratto o un'illustrazione: le
 * stelle, com'è andata, il nome con cui firmare e, se vuole, per cosa era.
 *
 * È il fratello del modulo delle recensioni, con una voce sola e le parole
 * di un lavoro su commissione invece che di un oggetto comprato: qui non si
 * racconta com'è arrivato il pacco, ma com'è stato farlo insieme.
 *
 * Si invia da `onSubmit` e non con `action`, per la stessa ragione del
 * fratello: con `action` React svuota il modulo anche quando torna un
 * errore, e chi ha scritto tre righe e ha dimenticato il nome non deve
 * riscriverle.
 */
export default function ModuloTestimonianza({
  chiave,
  servizio,
  max,
}: {
  chiave: string;
  /** «Ritratti Illustrati», per dire a chi non vede a cosa vanno le stelle. */
  servizio: string;
  max: { testo: number; autore: number; dettaglio: number };
}) {
  const [esito, azione, inCorso] = useActionState<EsitoRecensione, FormData>(inviaTestimonianza, {});
  const [voto, setVoto] = useState(0);
  const [testo, setTesto] = useState("");
  const base = useId();
  const campi = esito.campi ?? {};


  // Di solito non si vede: l'azione rifà la pagina, che col QR ormai usato
  // mostra il grazie con quello che ha scritto.
  if (esito.fatto) {
    return (
      <div role="status" className="border-t border-line pt-10">
        <p className="display-statement font-display text-[clamp(1.75rem,3.6vw,2.75rem)] leading-[1.15]">
          Grazie! Le tue parole sono già sul sito.
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-12"
      onSubmit={(e) => {
        e.preventDefault();
        const dati = new FormData(e.currentTarget);
        startTransition(() => azione(dati));
      }}
    >
      <input type="hidden" name="chiave" value={chiave} />

      <div>
        <SceltaStelle
          name="voto"
          legenda={`Quante stelle a ${servizio}`}
          voto={voto}
          onVoto={setVoto}
          descritta={campi.voto ? `${base}-voto` : undefined}
        />
        {campi.voto && (
          <p id={`${base}-voto`} className="mt-2 text-xs text-accent">
            {campi.voto}
          </p>
        )}
      </div>

      <div className="group/campo">
        <label htmlFor={`${base}-testo`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
          Com’è andata
        </label>
        <textarea
          id={`${base}-testo`}
          name="testo"
          rows={4}
          maxLength={max.testo}
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          placeholder="L’idea da cui siamo partiti, il risultato, la faccia di chi l’ha ricevuto…"
          aria-invalid={Boolean(campi.testo)}
          aria-describedby={`${base}-testo-nota`}
          className={`${CONTROL} mt-2 field-sizing-content resize-y leading-relaxed`}
        />
        <div className="mt-2 flex justify-between gap-4 text-xs">
          <span id={`${base}-testo-nota`} className="text-accent">
            {campi.testo}
          </span>
          <span className="figures text-ink-faint">
            {testo.length}/{max.testo}
          </span>
        </div>
      </div>

      <div className="grid gap-10 sm:grid-cols-2 sm:gap-8">
        <div className="group/campo">
          <label htmlFor={`${base}-autore`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
            Firma
          </label>
          <input
            id={`${base}-autore`}
            name="autore"
            maxLength={max.autore}
            autoComplete="given-name"
            aria-invalid={Boolean(campi.autore)}
            aria-describedby={`${base}-autore-nota`}
            className={`${CONTROL} mt-2`}
          />
          <p id={`${base}-autore-nota`} className={`mt-2 text-xs ${campi.autore ? "text-accent" : "text-ink-faint"}`}>
            {campi.autore ?? "Esce così sotto le tue parole. Basta il nome."}
          </p>
        </div>

        <div className="group/campo">
          <label htmlFor={`${base}-dettaglio`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
            Per cosa era
          </label>
          <input
            id={`${base}-dettaglio`}
            name="dettaglio"
            maxLength={max.dettaglio}
            autoComplete="off"
            placeholder="Es. regalo per i nonni, 2026"
            aria-describedby={`${base}-dettaglio-nota`}
            className={`${CONTROL} mt-2`}
          />
          <p id={`${base}-dettaglio-nota`} className="mt-2 text-xs text-ink-faint">
            Se vuoi. Esce accanto al nome.
          </p>
        </div>
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
          {inCorso ? "Invio…" : "Pubblica"}
        </button>
      </div>
    </form>
  );
}
