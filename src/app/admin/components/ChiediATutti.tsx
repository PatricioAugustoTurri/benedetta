"use client";

import { useState, useTransition } from "react";
import { chiediATuttiAzione, type EsitoATutti } from "../ordini/actions";

/**
 * «Chiedi la recensione a tutti»: la mail «Com'è andata?» a chi ha già
 * ricevuto un ordine e non ha ancora lasciato la recensione. Come gli altri
 * gesti che escono dal sito, chiede un secondo sì: sono mail vere a
 * persone vere, e una volta partite non si ritirano.
 */
export default function ChiediATutti({ persone }: { persone: number }) {
  const [conferma, setConferma] = useState(false);
  const [esito, setEsito] = useState<EsitoATutti | null>(null);
  const [inCorso, avvia] = useTransition();

  if (esito) {
    return (
      <p className={`text-[0.8125rem] ${esito.error || esito.fallite ? "text-accent" : "text-ink"}`} role="status">
        {esito.error ??
          `${esito.inviate === 1 ? "Partita 1 mail" : `Partite ${esito.inviate} mail`}.${
            esito.fallite ? ` ${esito.fallite} non sono partite: ripremi più tardi per riprovare solo quelle.` : ""
          }`}
      </p>
    );
  }

  if (persone === 0) return null;

  const chi = persone === 1 ? "1 persona" : `${persone} persone`;
  return conferma ? (
    <div className="space-y-2 text-[0.8125rem]">
      <p className="text-ink">
        Parte «Com’è andata?» a {chi} che {persone === 1 ? "ha" : "hanno"} già ricevuto un ordine e non{" "}
        {persone === 1 ? "ha" : "hanno"} lasciato la recensione. Una mail a testa.
      </p>
      <div className="flex gap-4">
        <button
          type="button"
          disabled={inCorso}
          onClick={() => avvia(async () => setEsito(await chiediATuttiAzione()))}
          className="link-underline text-ink transition-colors hover:text-accent disabled:opacity-60"
        >
          {inCorso ? "Invio in corso…" : `Sì, scrivi a ${chi}`}
        </button>
        {!inCorso && (
          <button type="button" onClick={() => setConferma(false)} className="link-underline text-ink-faint hover:text-ink">
            Annulla
          </button>
        )}
      </div>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setConferma(true)}
      className="link-underline text-[0.8125rem] text-ink transition-colors hover:text-accent"
    >
      Chiedi la recensione a tutti ({chi})
    </button>
  );
}
