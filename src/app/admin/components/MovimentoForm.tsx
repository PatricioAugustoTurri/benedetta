"use client";

import { useActionState, useId, useRef, useState } from "react";
import type { EstadoFormulario } from "../actions";
import { aggiungiMovimentoAzione } from "../conti/actions";
import { CONTROL, LABEL } from "./campo";

/**
 * Il modulo per scrivere una vendita fuori dal sito —contanti o bonifico— o
 * una spesa. Dopo il salvataggio si svuota, ma tiene giorno, tipo e canale:
 * chi torna dal mercato ne scrive parecchie di fila, tutte dello stesso giorno.
 */
export default function MovimentoForm({ oggi }: { oggi: string }) {
  const base = useId();
  const importo = useRef<HTMLInputElement>(null);
  // Tutti controllati, perché React svuota i campi liberi dopo ogni invio,
  // anche quando torna un errore: giorno, tipo e canale restano sempre, e
  // importo e nota si svuotano solo quando la riga è scritta.
  const [tipo, setTipo] = useState<"vendita" | "spesa">("vendita");
  const [canale, setCanale] = useState<"contanti" | "bonifico">("contanti");
  const [giorno, setGiorno] = useState(oggi);
  const [cifra, setCifra] = useState("");
  const [nota, setNota] = useState("");
  const [esito, azione, inCorso] = useActionState<EstadoFormulario, FormData>(async (p, fd) => {
    const r = await aggiungiMovimentoAzione(p, fd);
    if (r.ok) {
      setCifra("");
      setNota("");
      importo.current?.focus();
    }
    return r;
  }, {});

  const scelta =
    "flex cursor-pointer items-center justify-center border border-line px-3 py-2 text-xs text-ink-soft transition-colors hover:text-ink has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2";

  return (
    <form action={azione} className="space-y-6">
      <fieldset>
        <legend className={LABEL}>Cosa</legend>
        <div className="mt-2 flex">
          <label className={scelta}>
            <input
              type="radio"
              name="tipo"
              value="vendita"
              checked={tipo === "vendita"}
              onChange={() => setTipo("vendita")}
              className="sr-only"
            />
            Vendita
          </label>
          <label className={`${scelta} -ml-px`}>
            <input
              type="radio"
              name="tipo"
              value="spesa"
              checked={tipo === "spesa"}
              onChange={() => setTipo("spesa")}
              className="sr-only"
            />
            Spesa
          </label>
        </div>
      </fieldset>

      {tipo === "vendita" && (
        <fieldset>
          <legend className={LABEL}>Come è entrata</legend>
          <div className="mt-2 flex">
            <label className={scelta}>
              <input
                type="radio"
                name="canale"
                value="contanti"
                checked={canale === "contanti"}
                onChange={() => setCanale("contanti")}
                className="sr-only"
              />
              Contanti
            </label>
            <label className={`${scelta} -ml-px`}>
              <input
                type="radio"
                name="canale"
                value="bonifico"
                checked={canale === "bonifico"}
                onChange={() => setCanale("bonifico")}
                className="sr-only"
              />
              Bonifico
            </label>
          </div>
          <p className="mt-2 text-xs text-ink-faint">Le vendite del sito si contano da sole, dagli ordini.</p>
        </fieldset>
      )}

      <div className="grid gap-6 sm:grid-cols-[10rem_8rem_1fr]">
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
        <div className="group/campo">
          <label htmlFor={`${base}-i`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
            Importo €
          </label>
          <input
            ref={importo}
            id={`${base}-i`}
            name="importo"
            value={cifra}
            onChange={(e) => setCifra(e.target.value)}
            inputMode="decimal"
            autoComplete="off"
            required
            placeholder="15,00"
            className={`${CONTROL} figures mt-1 py-1.5 text-sm`}
          />
        </div>
        <div className="group/campo">
          <label htmlFor={`${base}-n`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
            Nota
          </label>
          <input
            id={`${base}-n`}
            name="nota"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            maxLength={200}
            autoComplete="off"
            placeholder={tipo === "vendita" ? "Mercatino di Natale, 3 stampe A4" : "Carta, buste, spedizioni"}
            className={`${CONTROL} mt-1 py-1.5 text-sm`}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={inCorso}
          className="border border-ink bg-ink px-4 py-2 text-xs text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {inCorso ? "Un momento…" : tipo === "vendita" ? "Scrivi la vendita" : "Scrivi la spesa"}
        </button>
        {esito.error && (
          <p role="alert" className="text-xs text-accent">
            {esito.error}
          </p>
        )}
        {esito.ok && !inCorso && (
          <p role="status" className="text-xs text-ink-soft">
            Scritta.
          </p>
        )}
      </div>
    </form>
  );
}
