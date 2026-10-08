"use client";

import { useActionState, useId } from "react";
import { spedisciOrdine, type EsitoSpedizione } from "../ordini/actions";
import { CONTROL, LABEL } from "./campo";

/**
 * Il passo che chiude un ordine: con chi è partito e il numero per seguirlo.
 * Tutti e due facoltativi —una busta per posta ordinaria non ha numero—, e
 * la mail al cliente parte solo se la spunta resta accesa.
 *
 * Il corriere arriva già scritto con l'ultimo usato: di solito è sempre lo
 * stesso, e scriverlo ogni volta è il genere di cosa che dopo il terzo ordine
 * non si fa più.
 */
export default function SpedisciOrdine({ id, corriere }: { id: number; corriere: string | null }) {
  const [esito, azione, inCorso] = useActionState<EsitoSpedizione, FormData>(spedisciOrdine, {});
  const base = useId();

  return (
    <form action={azione} className="mt-5 border-t border-line pt-4">
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-[1fr_1.4fr]">
        <div className="group/campo">
          <label htmlFor={`${base}-c`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
            Corriere
          </label>
          <input
            id={`${base}-c`}
            name="corriere"
            defaultValue={corriere ?? ""}
            placeholder="Poste Italiane, BRT…"
            maxLength={80}
            autoComplete="off"
            className={`${CONTROL} mt-1 py-1.5 text-sm`}
          />
        </div>
        <div className="group/campo">
          <label htmlFor={`${base}-t`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
            Numero o link di tracciamento
          </label>
          <input
            id={`${base}-t`}
            name="tracking"
            placeholder="Facoltativo"
            maxLength={300}
            autoComplete="off"
            className={`${CONTROL} mt-1 py-1.5 text-sm`}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="submit"
          disabled={inCorso}
          className="border border-ink bg-ink px-4 py-2 text-xs text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {inCorso ? "Un momento…" : "Segna come spedito"}
        </button>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
          <input
            type="checkbox"
            name="avvisa"
            defaultChecked
            className="h-3.5 w-3.5 cursor-pointer accent-[var(--color-accent)]"
          />
          Avvisa il cliente per mail
        </label>
      </div>

      {esito.error && <p role="alert" className="mt-3 text-xs text-accent">{esito.error}</p>}
      {esito.fatto && <p role="status" className="mt-3 text-xs text-ink-soft">{esito.fatto}</p>}
    </form>
  );
}
