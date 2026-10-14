"use client";

import { useActionState, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { spedisciOrdine, type EsitoSpedizione } from "../ordini/actions";
import { CONTROL, LABEL } from "./campo";

/**
 * Il passo che chiude un ordine: con chi è partito e il numero per seguirlo.
 * Il corriere è obbligatorio; il numero no —una busta per posta ordinaria
 * non ce l'ha—, e la mail al cliente parte solo se la spunta resta accesa.
 *
 * Il corriere arriva già scritto con l'ultimo usato: di solito è sempre lo
 * stesso, e scriverlo ogni volta è il genere di cosa che dopo il terzo ordine
 * non si fa più.
 *
 * Prima di partire, il modulo rilegge a lei quello che sta per succedere
 * —con chi, che numero, a chi arriva la mail— e aspetta un secondo sì: una
 * mail al cliente con il corriere sbagliato non si richiama.
 */
export default function SpedisciOrdine({
  id,
  corriere: ultimo,
  email,
}: {
  id: number;
  corriere: string | null;
  email: string;
}) {
  const [esito, azione, inCorso] = useActionState<EsitoSpedizione, FormData>(spedisciOrdine, {});
  const [corriere, setCorriere] = useState(ultimo ?? "");
  const [tracking, setTracking] = useState("");
  const [avvisa, setAvvisa] = useState(true);
  const [confermando, setConfermando] = useState(false);
  const [manca, setManca] = useState(false);
  const base = useId();
  const campoCorriere = useRef<HTMLInputElement>(null);
  const conferma = useRef<HTMLButtonElement>(null);
  const segna = useRef<HTMLButtonElement>(null);

  // Una risposta del server, anche un errore, riporta al modulo.
  const [esitoVisto, setEsitoVisto] = useState(esito);
  if (esito !== esitoVisto) {
    setEsitoVisto(esito);
    setConfermando(false);
  }

  useEffect(() => {
    if (confermando) conferma.current?.focus();
  }, [confermando]);

  // Anche Invio da un campo passa dalla conferma: il primo invio la apre, il
  // secondo —il suo pulsante— spedisce davvero.
  function chiediConferma(e: FormEvent<HTMLFormElement>) {
    if (confermando) return;
    e.preventDefault();
    if (corriere.trim().length === 0) {
      setManca(true);
      campoCorriere.current?.focus();
      return;
    }
    setConfermando(true);
  }

  function correggi() {
    setConfermando(false);
    requestAnimationFrame(() => segna.current?.focus());
  }

  const numero = tracking.trim();

  return (
    <form action={azione} onSubmit={chiediConferma} noValidate className="mt-5 border-t border-line pt-4">
      <input type="hidden" name="id" value={id} />
      <fieldset
        disabled={inCorso}
        className={`grid gap-x-6 gap-y-4 transition-opacity sm:grid-cols-[1fr_1.4fr] ${confermando ? "opacity-60" : ""}`}
      >
        <div className="group/campo">
          <label htmlFor={`${base}-c`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
            Corriere
          </label>
          <input
            ref={campoCorriere}
            id={`${base}-c`}
            name="corriere"
            value={corriere}
            onChange={(e) => {
              setCorriere(e.target.value);
              if (manca) setManca(false);
            }}
            readOnly={confermando}
            required
            aria-invalid={manca}
            aria-describedby={manca ? `${base}-m` : undefined}
            placeholder="Poste Italiane, BRT…"
            maxLength={80}
            autoComplete="off"
            className={`${CONTROL} mt-1 py-1.5 text-sm`}
          />
          {manca && (
            <p id={`${base}-m`} role="alert" className="mt-1.5 text-xs text-accent">
              Scrivi con che corriere è partito.
            </p>
          )}
        </div>
        <div className="group/campo">
          <label htmlFor={`${base}-t`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
            Numero o link di tracciamento
          </label>
          <input
            id={`${base}-t`}
            name="tracking"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            readOnly={confermando}
            placeholder="Facoltativo"
            maxLength={300}
            autoComplete="off"
            className={`${CONTROL} mt-1 py-1.5 text-sm`}
          />
        </div>
      </fieldset>

      {confermando ? (
        <div className="mt-5" aria-live="polite">
          {avvisa && <input type="hidden" name="avvisa" value="on" />}
          <p className="text-sm text-ink">
            L&rsquo;ordine <span className="figures">#{id}</span> parte con {corriere.trim()}
            {numero ? (
              <>
                , numero <span className="figures break-words">{numero}</span>.
              </>
            ) : (
              ", senza numero di tracciamento."
            )}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            {avvisa ? (
              <>
                Arriva una mail a <span className="break-all text-ink">{email}</span> con questi dati, e non si
                può richiamare.
              </>
            ) : (
              "Il cliente non riceve nessuna mail."
            )}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              ref={conferma}
              type="submit"
              disabled={inCorso}
              className="border border-ink bg-ink px-4 py-2 text-xs text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {inCorso ? "Un momento…" : avvisa ? "Conferma e avvisa" : "Conferma la spedizione"}
            </button>
            <button
              type="button"
              onClick={correggi}
              disabled={inCorso}
              className="link-underline text-xs text-ink-soft transition-colors hover:text-ink disabled:opacity-50"
            >
              Correggi
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            ref={segna}
            type="submit"
            className="border border-ink bg-ink px-4 py-2 text-xs text-paper transition-opacity hover:opacity-85"
          >
            Segna come spedito
          </button>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
            <input
              type="checkbox"
              name="avvisa"
              checked={avvisa}
              onChange={(e) => setAvvisa(e.target.checked)}
              className="h-3.5 w-3.5 cursor-pointer accent-[var(--color-accent)]"
            />
            Avvisa il cliente per mail
          </label>
        </div>
      )}

      {esito.error && <p role="alert" className="mt-3 text-xs text-accent">{esito.error}</p>}
      {esito.fatto && <p role="status" className="mt-3 text-xs text-ink-soft">{esito.fatto}</p>}
    </form>
  );
}
