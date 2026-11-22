"use client";

import { useActionState } from "react";
import { attivaRecensioniAzione, type EsitoAttivazione } from "../ordini/actions";

/**
 * Quando il database non ha ancora la tabella delle recensioni: lo dice,
 * mostra perché non si è creata da sola all'avvio e permette di riprovare,
 * dal telefono, senza terminale.
 */
export default function AttivaRecensioni({ errore }: { errore: string | null }) {
  const [esito, azione, inCorso] = useActionState<EsitoAttivazione, FormData>(attivaRecensioniAzione, {});
  const motivo = esito.error ?? errore;

  return (
    <div className="nota max-w-2xl space-y-3 text-sm">
      <p>
        Le recensioni non sono ancora attive: il database non ha la loro tabella. Il sito prova a
        crearla quando parte; se non ci riesce, puoi riprovare da qui.
      </p>
      {motivo && (
        <p className="text-xs text-ink-soft">
          Il database ha risposto: <span className="break-words font-mono">{motivo}</span>
        </p>
      )}
      <form action={azione}>
        <button
          type="submit"
          disabled={inCorso}
          className="link-underline text-ink transition-colors hover:text-accent disabled:opacity-60"
        >
          {inCorso ? "Attivazione…" : "Attiva le recensioni"}
        </button>
      </form>
    </div>
  );
}
