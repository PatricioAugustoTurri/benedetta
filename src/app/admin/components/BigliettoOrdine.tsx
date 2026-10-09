"use client";

import { useActionState, useId, useState } from "react";
import { giornoLungo } from "@/lib/oggi";
import type { Codice } from "@/lib/codici";
import { correggiBigliettoAzione, creaBigliettoAzione, type EsitoBiglietto } from "../ordini/actions";
import { CONTROL, LABEL } from "./campo";

/**
 * Il biglietto del pacco: il codice personale che lei scrive a mano e mette
 * dentro con la stampa.
 *
 * Sta nell'ordine e non in una pagina a sé perché è lì che lei si trova
 * mentre impacchetta: legge l'indirizzo, scrive il biglietto, segna come
 * spedito. Il codice è grande e spaziato, da copiare a occhio su carta.
 *
 * «Modifica» lo apre sul posto —codice, percentuale, scadenza— per fare un
 * biglietto suo («GIULIA15») o un regalo più generoso. Dopo la spedizione si
 * può ancora correggere, ma lo dice: il codice è già scritto nel pacco e
 * nella mail.
 */
export default function BigliettoOrdine({
  ordine,
  biglietto: b,
  spedito,
  oggi,
}: {
  ordine: number;
  biglietto: Codice | null;
  spedito: boolean;
  /** Oggi in Italia, dal server: «scaduto» non deve dipendere dall'orologio di chi guarda. */
  oggi: string;
}) {
  const [esito, azione, inCorso] = useActionState<EsitoBiglietto, FormData>(correggiBigliettoAzione, {});
  const [aperto, setAperto] = useState(false);
  /*
    Un salvataggio riuscito richiude il modulo e mostra il biglietto
    corretto; uno rifiutato lo lascia aperto, con l'errore sotto. Si guarda
    il cambio di `esito.fatto` durante il disegno, non in un effetto, così
    non c'è un fotogramma col modulo ancora aperto.
  */
  const [fattoVisto, setFattoVisto] = useState(esito.fatto);
  if (esito.fatto !== fattoVisto) {
    setFattoVisto(esito.fatto);
    if (esito.fatto) setAperto(false);
  }
  const [scritto, setScritto] = useState(b?.codice ?? "");
  const base = useId();

  if (!b) {
    return (
      <form action={creaBigliettoAzione} className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-line pt-4 text-xs">
        <input type="hidden" name="ordine" value={ordine} />
        <span className="label">Biglietto</span>
        <span className="text-ink-faint">Questo ordine non ha ancora un codice per il biglietto.</span>
        <button type="submit" className="area-tocco link-underline text-ink transition-colors hover:text-accent">
          Crealo
        </button>
      </form>
    );
  }

  const usato = b.usatoOrdineId !== null;
  const scaduto = !usato && b.scade !== null && b.scade < oggi;
  const spento = !b.attivo;
  const fuoriUso = usato || scaduto || spento;
  const rinominato = scritto.replace(/\s+/g, "").toUpperCase() !== b.codice;

  const condizioni = [
    `−${b.percentuale}%`,
    b.monouso && "una volta sola",
    b.scade
      ? scaduto
        ? `scaduto il ${giornoLungo(b.scade)}`
        : `fino al ${giornoLungo(b.scade)}`
      : spedito
        ? "senza scadenza"
        : "scade 90 giorni dopo la spedizione",
  ].filter(Boolean);

  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="flex items-baseline justify-between gap-6">
        <h3 className="label">Biglietto</h3>
        {!aperto && !usato && (
          <button
            type="button"
            onClick={() => {
              setScritto(b.codice);
              setAperto(true);
            }}
            className="area-tocco link-underline text-xs text-ink-soft transition-colors hover:text-ink"
          >
            Modifica
          </button>
        )}
      </div>

      {!aperto ? (
        <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <p
            className={`figures text-xl font-medium tracking-[0.08em] ${fuoriUso ? "text-ink-faint line-through decoration-1" : "text-ink"}`}
          >
            {b.codice}
          </p>
          <p className="figures text-xs text-ink-faint">
            {condizioni.join(" · ")}
            {usato && (
              <>
                {" · "}
                <span className="text-accent">usato nell&apos;ordine #{b.usatoOrdineId}</span>
              </>
            )}
            {spento && !usato && " · spento"}
          </p>
        </div>
      ) : (
        <form action={azione} className="mt-3">
          <input type="hidden" name="ordine" value={ordine} />
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-[1.3fr_0.6fr_1fr]">
            <div className="group/campo">
              <label htmlFor={`${base}-c`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
                Codice
              </label>
              <input
                id={`${base}-c`}
                name="codice"
                value={scritto}
                onChange={(e) => setScritto(e.target.value)}
                maxLength={30}
                required
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                autoFocus
                className={`${CONTROL} figures mt-1 py-1.5 tracking-[0.06em] uppercase`}
              />
            </div>
            <div className="group/campo">
              <label htmlFor={`${base}-p`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
                Sconto
              </label>
              <div className="mt-1 flex items-baseline gap-1 border-b border-line transition-colors focus-within:border-ink">
                <span className="text-ink-faint">−</span>
                <input
                  id={`${base}-p`}
                  name="percentuale"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={90}
                  required
                  defaultValue={b.percentuale}
                  className="figures w-full border-0 bg-transparent py-1.5 text-base text-ink outline-none"
                />
                <span className="text-ink-faint">%</span>
              </div>
            </div>
            <div className="group/campo">
              <label htmlFor={`${base}-s`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
                Scade il
              </label>
              <input
                id={`${base}-s`}
                name="scade"
                type="date"
                defaultValue={b.scade ?? ""}
                aria-describedby={`${base}-sh`}
                className={`${CONTROL} figures mt-1 py-1.5`}
              />
              <p id={`${base}-sh`} className="mt-1.5 text-xs leading-relaxed text-ink-faint">
                {spedito ? "Vuota: non scade." : "Vuota: 90 giorni dalla spedizione."}
              </p>
            </div>
          </div>

          {spedito && rinominato && (
            <p className="mt-3 text-xs leading-relaxed text-accent">
              «{b.codice}» è già nel pacco e nella mail: cambiandolo, quello smette di valere.
            </p>
          )}
          {esito.error && (
            <p role="alert" className="mt-3 text-xs leading-relaxed text-accent">
              {esito.error}
            </p>
          )}

          <div className="mt-4 flex items-center gap-x-6">
            <button
              type="submit"
              disabled={inCorso}
              className="border border-ink bg-ink px-4 py-2 text-xs text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {inCorso ? "Salvataggio…" : "Salva il biglietto"}
            </button>
            <button
              type="button"
              onClick={() => setAperto(false)}
              className="area-tocco link-underline text-xs text-ink-soft transition-colors hover:text-ink"
            >
              Annulla
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
