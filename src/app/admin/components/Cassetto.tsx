"use client";

import { useId, useState, useTransition } from "react";
import type { Prodotto } from "@/lib/prodotti";
import { miniatura } from "@/lib/miniatura";
import { immagineFerma } from "@/lib/video";
import { fissaGiacenzaAzione } from "../magazzino/actions";

/**
 * Il cassetto di una categoria: una riga per stampa, e un numero per ogni
 * formato. Si scrive quante ce ne sono e si salva uscendo dal campo o con
 * Invio; vuoto, quel formato non si conta.
 *
 * Non è il magazzino dello Shop (`Magazzino.tsx`), che scala le copie a ogni
 * ordine e a zero mostra «Esaurito»: questo è solo per lei, e il sito non lo
 * vede.
 */
export default function Cassetto({
  prodotti,
  giacenze,
}: {
  prodotti: Prodotto[];
  giacenze: Record<number, Record<string, number>>;
}) {
  return (
    <ul className="border-t border-line">
      {prodotti.map((p) => (
        <Riga key={p.id} prodotto={p} copie={giacenze[p.id] ?? {}} />
      ))}
    </ul>
  );
}

const comeTesto = (copie: Record<string, number>) =>
  Object.fromEntries(Object.entries(copie).map(([f, n]) => [f, String(n)]));

function Riga({ prodotto: p, copie }: { prodotto: Prodotto; copie: Record<string, number> }) {
  const id = useId();
  const [scritti, setScritti] = useState<Record<string, string>>(() => comeTesto(copie));
  const [salvati, setSalvati] = useState<Record<string, string>>(() => comeTesto(copie));
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, avvia] = useTransition();

  // Se la pagina si rinfresca con numeri nuovi —un'altra scheda— la riga li
  // segue, tranne il campo che lei sta scrivendo.
  const [scrivendo, setScrivendo] = useState<string | null>(null);
  // Si confronta il contenuto e non l'oggetto: una stampa senza righe arriva
  // con un `{}` nuovo a ogni rinfresco.
  const impronta = JSON.stringify(copie);
  const [dallaTabella, setDallaTabella] = useState(impronta);
  if (impronta !== dallaTabella) {
    setDallaTabella(impronta);
    const nuovi = comeTesto(copie);
    setSalvati(nuovi);
    setScritti((prima) => (scrivendo ? { ...nuovi, [scrivendo]: prima[scrivendo] ?? "" } : nuovi));
  }

  const salva = (formato: string) => {
    setScrivendo(null);
    const pulito = (scritti[formato] ?? "").trim();
    const prima = salvati[formato] ?? "";
    if (pulito === prima) return;
    avvia(async () => {
      const r = await fissaGiacenzaAzione(p.id, formato, pulito);
      if ("error" in r) {
        setErrore(r.error);
        setScritti((s) => ({ ...s, [formato]: prima }));
        return;
      }
      setErrore(null);
      const testo = r.copie === null ? "" : String(r.copie);
      setSalvati((s) => ({ ...s, [formato]: testo }));
      setScritti((s) => ({ ...s, [formato]: testo }));
    });
  };

  const totale = p.formati.reduce((t, f) => t + (Number(salvati[f.formato]) || 0), 0);
  const contati = p.formati.some((f) => (salvati[f.formato] ?? "") !== "");
  const portada = p.image[0];

  return (
    <li className="border-b border-line py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
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
          <span className="min-w-0">
            <span className="block text-[0.9375rem] leading-snug text-ink">{p.title}</span>
            <span aria-live="polite" className="figures mt-0.5 block text-xs text-ink-faint">
              {!contati ? "Non contate" : totale === 1 ? "1 copia" : `${totale} copie`}
              {!p.pubblicato && " · bozza"}
            </span>
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pl-14 md:pl-0" role="group" aria-label={`Copie di ${p.title}`}>
          {p.formati.map((f, i) => (
            <label key={f.formato} htmlFor={`${id}-${i}`} className="flex w-[4.75rem] flex-col gap-1">
              <span className="truncate text-[0.6875rem] text-ink-faint" title={f.formato}>
                {f.formato}
              </span>
              <input
                id={`${id}-${i}`}
                value={scritti[f.formato] ?? ""}
                onFocus={() => setScrivendo(f.formato)}
                onChange={(e) =>
                  setScritti((s) => ({ ...s, [f.formato]: e.target.value.replace(/[^\d]/g, "").slice(0, 5) }))
                }
                onBlur={() => salva(f.formato)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") {
                    setScritti((s) => ({ ...s, [f.formato]: salvati[f.formato] ?? "" }));
                    e.currentTarget.blur();
                  }
                }}
                inputMode="numeric"
                autoComplete="off"
                placeholder="—"
                aria-describedby={errore ? `${id}-e` : undefined}
                className="figures h-9 w-full border border-line bg-transparent text-center text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
              />
            </label>
          ))}
        </div>
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
