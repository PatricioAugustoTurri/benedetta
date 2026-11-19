"use client";

import { useActionState, useId, useRef, useState } from "react";
import { aggiungiSpesaAzione, type EsitoSpesa } from "../conti/actions";
import { CONTROL, LABEL } from "./campo";

/**
 * Una spesa in una riga: in cosa, quanto, il giorno, e Invio. Sta in cima
 * alla lista delle spese perché è lì che lei guarda quando la scrive.
 */
export default function SpesaForm({ giornoIniziale }: { giornoIniziale: string }) {
  const base = useId();
  const primo = useRef<HTMLInputElement>(null);
  // Controllati: React svuota i campi liberi dopo ogni invio, anche quando
  // torna un errore, e una spesa scritta male non va riscritta da capo.
  const [descrizione, setDescrizione] = useState("");
  const [importo, setImporto] = useState("");
  const [giorno, setGiorno] = useState(giornoIniziale);
  const [esito, azione, inCorso] = useActionState<EsitoSpesa, FormData>(async (p, fd) => {
    const r = await aggiungiSpesaAzione(p, fd);
    if (r.ok) {
      setDescrizione("");
      setImporto("");
      primo.current?.focus();
    }
    return r;
  }, {});

  return (
    <form action={azione}>
      <div className="grid items-end gap-4 sm:grid-cols-[1fr_7rem_9.5rem_auto]">
        <div className="group/campo">
          <label htmlFor={`${base}-d`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
            In cosa
          </label>
          <input
            ref={primo}
            id={`${base}-d`}
            name="descrizione"
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            required
            maxLength={200}
            autoComplete="off"
            placeholder="Carta Fabriano, buste, spedizioni"
            className={`${CONTROL} mt-1 py-1.5 text-sm`}
          />
        </div>
        <div className="group/campo">
          <label htmlFor={`${base}-i`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
            Quanto €
          </label>
          <input
            id={`${base}-i`}
            name="importo"
            value={importo}
            onChange={(e) => setImporto(e.target.value)}
            inputMode="decimal"
            required
            autoComplete="off"
            placeholder="25,00"
            className={`${CONTROL} figures mt-1 py-1.5 text-sm`}
          />
        </div>
        <div className="group/campo">
          <label htmlFor={`${base}-g`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
            Giorno
          </label>
          <input
            id={`${base}-g`}
            type="date"
            name="giorno"
            value={giorno}
            onChange={(e) => setGiorno(e.target.value)}
            required
            className={`${CONTROL} mt-1 py-1.5 text-sm`}
          />
        </div>
        <button
          type="submit"
          disabled={inCorso}
          className="border border-ink bg-ink px-4 py-2 text-xs text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {inCorso ? "Un momento…" : "Scrivi la spesa"}
        </button>
      </div>
      {esito.error && (
        <p role="alert" className="mt-3 text-xs text-accent">
          {esito.error}
        </p>
      )}
    </form>
  );
}
