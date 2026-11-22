"use client";

import { useActionState, useState } from "react";
import { chiediRecensioneAzione, type EsitoRichiesta } from "../ordini/actions";

const giorno = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", timeZone: "Europe/Rome" }).format(new Date(iso));

/**
 * La riga della recensione in un ordine consegnato: quante ne ha lasciate,
 * il link da copiare —per WhatsApp o Instagram— e la mail che la chiede.
 *
 * La mail non parte da sola: la manda lei quando pensa che il pacco sia
 * arrivato. Dopo averla mandata il pulsante dice quando, e permette di
 * rimandarla: non si sa mai se la prima è finita nello spam.
 */
export default function RecensioneOrdine({
  id,
  link,
  chiesta,
  lasciate,
  prodotti,
  correoAttivo,
}: {
  id: number;
  link: string;
  /** ISO, quando lei l'ha chiesta per mail. */
  chiesta: string | null;
  lasciate: number;
  /** Quanti prodotti diversi ha l'ordine. */
  prodotti: number;
  correoAttivo: boolean;
}) {
  const [esito, azione, inCorso] = useActionState<EsitoRichiesta, FormData>(chiediRecensioneAzione, {});
  const [copiato, setCopiato] = useState(false);
  const tutte = lasciate >= prodotti && prodotti > 0;

  async function copia() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiato(true);
      window.setTimeout(() => setCopiato(false), 1800);
    } catch {
      window.prompt("Copia il link della recensione:", link);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-ink-faint">
      <span>
        Recensione:{" "}
        {lasciate === 0 ? (
          "non ancora"
        ) : (
          <span className="text-ink">{tutte ? "lasciata" : `${lasciate} su ${prodotti}`}</span>
        )}
      </span>
      {!tutte && (
        <>
          <button type="button" onClick={copia} className="link-underline transition-colors hover:text-ink">
            {copiato ? "Link copiato" : "Copia il link"}
          </button>
          {correoAttivo && (
            <form action={azione} className="flex items-baseline gap-2">
              <input type="hidden" name="id" value={id} />
              {chiesta && <span>· chiesta per mail il {giorno(chiesta)}</span>}
              <button
                type="submit"
                disabled={inCorso}
                className="link-underline text-ink transition-colors hover:text-accent disabled:opacity-60"
              >
                {inCorso ? "Invio…" : chiesta ? "Richiedila" : "Chiedila per mail"}
              </button>
            </form>
          )}
        </>
      )}
      {esito.error && <span className="w-full text-accent">{esito.error}</span>}
      {esito.fatto && <span className="w-full text-ink">{esito.fatto}</span>}
    </div>
  );
}
