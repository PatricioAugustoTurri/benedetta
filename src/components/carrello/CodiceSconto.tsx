"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { verificaCodice } from "@/app/(sitio)/carrello/actions";
import { ChevronDown } from "@/components/Icon";
import type { CodiceApplicato } from "./store";

/**
 * Il campo del codice sconto: quello del biglietto nel pacco.
 *
 * **Chiuso, è una riga sola.** Chi non ha un codice non deve vedere una
 * casella vuota che gli dice che altri pagano meno: la riga «Hai un codice
 * sconto?» si srotola (0fr → 1fr, come le categorie dello Shop nel menu) solo
 * per chi lo cerca. Chi ha il biglietto in mano la trova sopra i conti, dove
 * si guarda prima di pagare.
 *
 * Aperto è il campo del sistema, lo stesso del modulo di Contatti: etichetta
 * in maiuscoletto, un filetto solo, nessun riquadro. «Applica» è una parola in
 * fondo alla riga e non un pulsante: il pulsante del modulo è uno, ed è il
 * pagamento.
 *
 * Il campo sta dentro il modulo del pagamento ma non ha `name`: Invio lo
 * applica invece di partire per Stripe, e a Stripe va solo il codice già
 * controllato, nel campo nascosto del carrello.
 */
export default function CodiceSconto({
  onApplica,
  focusAllInizio = false,
}: {
  onApplica: (c: CodiceApplicato) => void;
  /** Dopo «Togli»: il fuoco torna qui invece di perdersi col pulsante che sparisce. */
  focusAllInizio?: boolean;
}) {
  const [aperto, setAperto] = useState(false);
  const [valore, setValore] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, avvia] = useTransition();
  const campo = useRef<HTMLInputElement>(null);
  const riga = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (focusAllInizio) riga.current?.focus();
  }, [focusAllInizio]);

  const applica = () => {
    if (inCorso) return;
    if (valore.trim().length === 0) {
      setErrore("Scrivi il codice.");
      campo.current?.focus();
      return;
    }
    avvia(async () => {
      const esito = await verificaCodice(valore).catch(() => ({
        ok: false as const,
        error: "Non riesco a controllare il codice adesso. Riprova tra un momento.",
      }));
      if (esito.ok) {
        setErrore(null);
        setValore("");
        setAperto(false);
        onApplica({ codice: esito.codice, percentuale: esito.percentuale });
      } else {
        setErrore(esito.error);
        campo.current?.focus();
      }
    });
  };

  return (
    <div className="mt-6">
      <button
        ref={riga}
        type="button"
        aria-expanded={aperto}
        aria-controls={`${id}-pannello`}
        data-open={aperto}
        onClick={() => {
          setAperto((a) => !a);
          // Si apre per scrivere: il cursore va già nel campo. Dopo il primo
          // disegno, perché un campo `inert` non prende il fuoco.
          if (!aperto) requestAnimationFrame(() => campo.current?.focus());
        }}
        className="group area-tocco flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink data-[open=true]:text-ink"
      >
        <span className="link-underline">Hai un codice sconto?</span>
        <ChevronDown
          size={14}
          className="shrink-0 transition-transform duration-[420ms] ease-[var(--ease-out-soft)] group-data-[open=true]:rotate-180"
        />
      </button>

      <div
        id={`${id}-pannello`}
        data-open={aperto}
        inert={!aperto}
        className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-[420ms] ease-[var(--ease-out-soft)] data-[open=true]:grid-rows-[1fr]"
      >
        <div className="min-h-0 overflow-hidden">
          <div data-error={Boolean(errore)} className="group/campo pt-5 pb-1">
            <label
              htmlFor={`${id}-campo`}
              className="label block text-ink-faint transition-colors group-has-[:focus]/campo:text-ink group-data-[error=true]/campo:text-accent"
            >
              Codice sconto
            </label>
            {/*
              Il filetto è del contenitore e non del campo, perché «Applica»
              ci sta sopra: è la riga su cui si scrive, con la parola in fondo.
            */}
            {/* L'errore vince sul fuoco: un campo sbagliato lo dice anche mentre ci si scrive. */}
            <div
              className={`mt-2 flex items-baseline gap-4 border-b transition-colors ${
                errore ? "border-accent" : "border-line focus-within:border-ink"
              }`}
            >
              <input
                ref={campo}
                id={`${id}-campo`}
                value={valore}
                onChange={(e) => {
                  setValore(e.target.value);
                  if (errore) setErrore(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applica();
                  }
                }}
                autoComplete="off"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="done"
                maxLength={40}
                aria-invalid={errore ? true : undefined}
                aria-describedby={errore ? `${id}-errore` : undefined}
                className="figures min-w-0 flex-1 border-0 bg-transparent py-2.5 text-base tracking-[0.06em] text-ink uppercase outline-none focus-visible:outline-none"
              />
              <button
                type="button"
                onClick={applica}
                aria-disabled={inCorso || undefined}
                className="area-tocco shrink-0 text-sm text-ink transition-colors hover:text-accent aria-disabled:cursor-wait aria-disabled:text-ink-faint"
              >
                <span className="link-underline">{inCorso ? "Controllo…" : "Applica"}</span>
              </button>
            </div>
            {errore && (
              <p id={`${id}-errore`} role="alert" className="mt-2 text-xs leading-relaxed text-accent">
                {errore}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
