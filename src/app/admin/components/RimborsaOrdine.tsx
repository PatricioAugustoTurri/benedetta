"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { rimborsaOrdine, type EsitoRimborso } from "../ordini/actions";

/**
 * Il rimborso di un ordine, quando chi ha comprato chiede indietro i soldi.
 *
 * Sta lontano da «Segna come spedito», in fondo a destra e a bassa voce: è
 * il gesto raro, e non si può disfare. Il primo clic non rimborsa niente;
 * apre un riquadro che dice quanto, a chi e con che mezzo, e solo il suo
 * pulsante muove i soldi.
 *
 * Senza SumUp collegato —o se SumUp rifiuta— il riquadro offre l'altra
 * strada: rimborsare dall'app di SumUp e segnarlo qui.
 */
export default function RimborsaOrdine({
  id,
  importo,
  email,
  sumupAttivo,
}: {
  id: number;
  /** Il totale già scritto in euro: si rimborsa tutto. */
  importo: string;
  email: string;
  sumupAttivo: boolean;
}) {
  const [esito, azione, inCorso] = useActionState<EsitoRimborso, FormData>(rimborsaOrdine, {});
  const [aperto, setAperto] = useState(false);
  const conferma = useRef<HTMLButtonElement>(null);
  const apri = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (aperto) conferma.current?.focus();
  }, [aperto]);

  function chiudi() {
    setAperto(false);
    requestAnimationFrame(() => apri.current?.focus());
  }

  if (!aperto) {
    return (
      <div className="mt-3 flex justify-end">
        <button
          ref={apri}
          type="button"
          onClick={() => setAperto(true)}
          className="link-underline text-xs text-ink-faint transition-colors hover:text-accent"
        >
          Rimborsa l&rsquo;ordine
        </button>
      </div>
    );
  }

  return (
    <form action={azione} className="mt-5 border-t border-accent pt-4" aria-live="polite">
      <input type="hidden" name="id" value={id} />
      <p className="text-sm text-ink">
        Rimborsare <span className="figures">{importo}</span> a <span className="break-all">{email}</span>?
      </p>
      <p className="prose-measure mt-1 text-xs leading-relaxed text-ink-soft">
        {sumupAttivo
          ? "SumUp restituisce l’intero importo, spedizione compresa, sulla carta con cui ha pagato. Non si può disfare."
          : "SumUp non è collegato: da qui non parte nessun rimborso. Fallo dall’app di SumUp, poi segnalo qui."}{" "}
        L&rsquo;ordine passa fra i rimborsati.
      </p>

      {esito.error && (
        <p role="alert" className="mt-3 text-xs text-accent">
          {esito.error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          ref={conferma}
          type="submit"
          name="modo"
          value={sumupAttivo ? "sumup" : "segna"}
          disabled={inCorso}
          className="border border-ink bg-ink px-4 py-2 text-xs text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {inCorso ? (
            "Un momento…"
          ) : !sumupAttivo ? (
            "L’ho rimborsato dall’app: segnalo"
          ) : esito.soloSegna ? (
            "Riprova con SumUp"
          ) : (
            <>
              Sì, rimborsa <span className="figures">{importo}</span>
            </>
          )}
        </button>
        {sumupAttivo && esito.soloSegna && (
          <button
            type="submit"
            name="modo"
            value="segna"
            disabled={inCorso}
            className="link-underline text-xs text-ink transition-colors hover:text-accent disabled:opacity-50"
          >
            L&rsquo;ho rimborsato dall&rsquo;app: segnalo
          </button>
        )}
        <button
          type="button"
          onClick={chiudi}
          disabled={inCorso}
          className="link-underline text-xs text-ink-soft transition-colors hover:text-ink disabled:opacity-50"
        >
          Annulla
        </button>
      </div>
    </form>
  );
}
