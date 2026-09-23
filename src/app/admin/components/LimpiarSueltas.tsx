"use client";

import { useState, useTransition } from "react";
import { limpiarSueltas, type Limpieza } from "../actions";

/** Il risultato, detto in una riga. */
function Resultado({ r }: { r: Limpieza }) {
  if (r.error) return <span className="text-accent">{r.error}</span>;

  const cifra = (n: number) => <span className="figures text-ink-soft">{n}</span>;

  return (
    <>
      {r.borradas > 0 && (
        <>
          {r.borradas === 1 ? "Cancellata " : "Cancellate "}{cifra(r.borradas)}
          {r.borradas === 1 ? " immagine" : " immagini"} ·{" "}
          {cifra(Number((r.bytes / 1024 / 1024).toFixed(1)))} MB liberati.
        </>
      )}

      {r.borradas === 0 && r.recientes === 0 && "Non ce n'era nessuna."}

      {/*
        Le recenti si nominano a parte e sempre. Dire «non ce n'era nessuna»
        quando ce ne sono tre in attesa del margine farebbe dare per pulito
        l'account a chi legge, e non tornerebbe a guardare.
      */}
      {r.recientes > 0 && (
        <>
          {r.borradas > 0 ? " Ne restano " : "Ce ne sono "}
          {cifra(r.recientes)} di meno di un&apos;ora fa, non toccate. Riprova più tardi.
        </>
      )}
    </>
  );
}

/**
 * Togliere da Cloudinary le immagini che nessuna opera usa.
 *
 * Va in fondo all'archivio, in inchiostro pallido e senza ornamenti: è
 * manutenzione, si usa ogni tanto, e non deve fare concorrenza al caricamento
 * di un'opera.
 *
 * Non si esegue da sola all'apertura dell'admin, anche se potrebbe. Chiedere a
 * Cloudinary cosa c'è conservato è una chiamata di rete, e metterla a ogni
 * caricamento della schermata rallenterebbe il lavoro di tutti i giorni per
 * risolvere qualcosa che succede ogni tanto.
 */
export default function LimpiarSueltas() {
  const [resultado, setResultado] = useState<Limpieza | null>(null);
  const [corriendo, empezar] = useTransition();

  return (
    <div className="mt-16 border-t border-line pt-5">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <button
          type="button"
          disabled={corriendo}
          onClick={() => empezar(async () => setResultado(await limpiarSueltas()))}
          className="link-underline text-xs text-ink-faint transition-colors hover:text-ink disabled:opacity-50"
        >
          {corriendo ? "Ricerca in corso…" : "Pulisci le immagini sciolte"}
        </button>

        {/*
          Il risultato va sulla stessa riga e con lo stesso corpo: è una
          risposta, non un annuncio. `aria-live` lo fa arrivare a chi non sta
          guardando questo angolo dello schermo.
        */}
        <span aria-live="polite" className="text-xs text-ink-faint">
          {resultado && <Resultado r={resultado} />}
        </span>
      </div>

      <p className="mt-2 max-w-[52ch] text-xs leading-relaxed text-ink-faint">
        Le immagini si caricano appena le scegli, quindi se una volta chiudi il modulo senza
        salvare, restano a occupare l&apos;account senza appartenere a nessuna opera. Questo
        le toglie. Non tocca quelle di meno di un&apos;ora, nel caso tu stia caricando
        qualcosa in un&apos;altra scheda.
      </p>
    </div>
  );
}
