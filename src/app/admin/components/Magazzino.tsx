"use client";

import { useId, useState, useTransition } from "react";
import { Meno, Plus } from "@/components/Icon";
import type { Prodotto } from "@/lib/prodotti";
import { miniatura } from "@/lib/miniatura";
import { immagineFerma } from "@/lib/video";
import { cambiaScorteAzione, fissaScorteAzione, type EsitoScorte } from "../shop/actions";

/**
 * Il magazzino di una categoria: una riga per prodotto, con le copie che ci
 * sono e i due gesti che servono davvero.
 *
 * - **Il meno e il più** sono per la copia venduta al mercato o in negozio, e
 *   per il pacco che torna. Sono una somma, non un numero: se nello stesso
 *   istante un ordine ne scala una, nessuna delle due si perde.
 * - **Il numero si scrive** quando arriva un lotto nuovo o quando le conta:
 *   «ne ho 20». Lì sì vale quello che lei ha davanti, e si salva uscendo dal
 *   campo o con Invio.
 *
 * Vuoto vuol dire che non si contano —come le stampe—, ed è lo stato da cui
 * parte un prodotto nuovo: scrivere un numero è cominciare a contarle.
 *
 * Le righe sono quelle del registro degli ordini, filetti sottili e cifre
 * tabulari, perché è la stessa cosa: un conto. Lo zero è l'unica riga che
 * alza la voce, in terracotta, perché è quella che nel sito ha già cambiato
 * qualcosa.
 */
export default function Magazzino({ prodotti }: { prodotti: Prodotto[] }) {
  return (
    <ul className="border-t border-line">
      {prodotti.map((p) => (
        <Riga key={p.id} prodotto={p} />
      ))}
    </ul>
  );
}

function Riga({ prodotto: p }: { prodotto: Prodotto }) {
  const id = useId();
  const [scorte, setScorte] = useState(p.scorte);
  const [scritto, setScritto] = useState(p.scorte === null ? "" : String(p.scorte));
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, avvia] = useTransition();

  // Quando la pagina si rinfresca —un ordine, un'altra scheda— la riga segue
  // la tabella, a meno che lei non stia scrivendo. Si confronta durante il
  // disegno e non in un effetto: così non c'è un disegno con il numero vecchio.
  const [scrivendo, setScrivendo] = useState(false);
  const [dallaTabella, setDallaTabella] = useState(p.scorte);
  if (p.scorte !== dallaTabella && !scrivendo) {
    setDallaTabella(p.scorte);
    setScorte(p.scorte);
    setScritto(p.scorte === null ? "" : String(p.scorte));
  }

  const esito = (r: EsitoScorte, prima: number | null) => {
    if ("error" in r) {
      setErrore(r.error);
      setScorte(prima);
      setScritto(prima === null ? "" : String(prima));
      return;
    }
    setErrore(null);
    setScorte(r.scorte);
    setScritto(r.scorte === null ? "" : String(r.scorte));
  };

  const somma = (di: number) => {
    if (scorte === null) return;
    const prima = scorte;
    const dopo = Math.max(prima + di, 0);
    // Si vede subito: il server conferma, e se non può si torna indietro.
    setScorte(dopo);
    setScritto(String(dopo));
    avvia(async () => esito(await cambiaScorteAzione(p.id, di), prima));
  };

  const salva = () => {
    setScrivendo(false);
    const pulito = scritto.trim();
    if (pulito === (scorte === null ? "" : String(scorte))) return;
    const prima = scorte;
    avvia(async () => esito(await fissaScorteAzione(p.id, pulito), prima));
  };

  const contate = scorte !== null;
  const finito = contate && scorte <= 0;
  const portada = p.image[0];

  return (
    <li className="border-b border-line py-3">
      <div className="flex items-center gap-4">
        <span className="block w-10 shrink-0 bg-paper-deep">
          {portada ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={miniatura(immagineFerma(portada), 80, 100)}
              alt=""
              className={`aspect-[4/5] w-full object-cover ${p.pubblicato ? "" : "opacity-45"}`}
            />
          ) : (
            <span className="block aspect-[4/5] w-full" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <label htmlFor={`${id}-n`} className="block text-[0.9375rem] leading-snug text-ink">
            {p.title}
          </label>
          <span
            aria-live="polite"
            className={`mt-0.5 flex items-center gap-1.5 text-xs ${finito ? "text-accent" : "text-ink-faint"}`}
          >
            {finito && <span aria-hidden="true" className="block h-1 w-1 rounded-full bg-accent" />}
            {!contate
              ? "Non si contano"
              : finito
                ? "Esaurito nel sito"
                : scorte === 1
                  ? "L’ultima copia"
                  : `${scorte} copie`}
            {!p.pubblicato && " · bozza"}
          </span>
        </span>

        <span className="flex shrink-0 items-center" role="group" aria-label={`Copie di ${p.title}`}>
          <button
            type="button"
            onClick={() => somma(-1)}
            disabled={!contate || finito}
            title="Una venduta fuori dal sito"
            className="flex h-9 w-9 items-center justify-center border border-line text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:pointer-events-none disabled:opacity-30"
          >
            <span className="sr-only">Una copia in meno, venduta fuori dal sito</span>
            <Meno size={14} />
          </button>
          <input
            id={`${id}-n`}
            value={scritto}
            onFocus={() => setScrivendo(true)}
            onChange={(e) => setScritto(e.target.value.replace(/[^\d]/g, ""))}
            onBlur={salva}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setScritto(scorte === null ? "" : String(scorte));
                e.currentTarget.blur();
              }
            }}
            inputMode="numeric"
            autoComplete="off"
            placeholder="—"
            aria-describedby={errore ? `${id}-e` : undefined}
            aria-invalid={errore ? true : undefined}
            className="figures h-9 w-14 border-y border-line bg-transparent text-center text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none aria-[invalid=true]:border-accent"
          />
          <button
            type="button"
            onClick={() => somma(1)}
            disabled={!contate}
            title="Una copia in più"
            className="flex h-9 w-9 items-center justify-center border border-line text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:pointer-events-none disabled:opacity-30"
          >
            <span className="sr-only">Una copia in più</span>
            <Plus size={14} />
          </button>
        </span>
      </div>

      {errore && (
        <p id={`${id}-e`} role="alert" className="mt-2 pl-14 text-xs text-accent">
          {errore}
        </p>
      )}
      {inCorso && <span className="sr-only">Salvataggio…</span>}
    </li>
  );
}
