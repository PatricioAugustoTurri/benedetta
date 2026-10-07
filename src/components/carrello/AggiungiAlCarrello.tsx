"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { AZIONE } from "@/components/azione";
import { ArrowRight, Borsa } from "@/components/Icon";
import { prezzo, type Formato } from "@/data/shop";
import { aggiungi, type VoceCarrello } from "./store";

/**
 * Il formato e l'aggiunta al carrello, sulla scheda di una stampa.
 *
 * **I formati sono una lista con filetti, non un menu a tendina.** Sono tre,
 * hanno un prezzo ciascuno, e il prezzo è proprio quello che si confronta: in
 * una tendina si vedrebbe un formato alla volta. È la stessa lista di filetti
 * della scheda di un'opera (Anno, Tecnica), con il nome a sinistra e la cifra
 * a destra, e ogni riga si sceglie.
 *
 * Sotto c'è un `radio` vero, non un div che fa finta: le frecce lo
 * percorrono, il lettore di schermo dice «A4, 20 €, 3 di 4, selezionato», e
 * si manda con il modulo se un giorno servisse. Il segno di scelta è un
 * cerchio a filo con il centro in terracotta: terracotta come segno, mai come
 * campo.
 *
 * Dopo l'aggiunta il pulsante resta lì —si può aggiungerne un'altra, o un
 * altro formato— e sotto compare la conferma con la strada per il carrello.
 * La conferma si annuncia da sola (`role="status"`), perché sul telefono
 * l'icona del carrello è chiusa dentro il pannello e non la vede nessuno
 * cambiare.
 */
export default function AggiungiAlCarrello({
  slug,
  title,
  formati,
  immagine,
}: {
  slug: string;
  title: string;
  formati: Formato[];
  immagine?: VoceCarrello["immagine"];
}) {
  const id = useId();
  const [scelto, setScelto] = useState(formati[0]?.formato ?? "");
  const [aggiunto, setAggiunto] = useState<string | null>(null);
  const formato = formati.find((f) => f.formato === scelto);

  return (
    <div>
      <fieldset>
        <legend className="label">Formato</legend>
        <div className="mt-3 border-t border-line">
          {formati.map((f) => (
            <label
              key={f.formato}
              htmlFor={`${id}-${f.formato}`}
              data-scelto={f.formato === scelto}
              className="group flex cursor-pointer items-center justify-between gap-6 border-b border-line py-3 text-ink-soft transition-colors hover:text-ink data-[scelto=true]:text-ink"
            >
              <span className="flex items-center gap-3">
                <input
                  id={`${id}-${f.formato}`}
                  type="radio"
                  name={`${id}-formato`}
                  value={f.formato}
                  checked={f.formato === scelto}
                  onChange={() => {
                    setScelto(f.formato);
                    setAggiunto(null);
                  }}
                  className="peer sr-only"
                />
                {/*
                  Il segno di scelta, disegnato. L'anello di fuoco va su di
                  lui —`peer-focus-visible`— perché il radio vero è
                  invisibile e senza questo chi usa la tastiera non vedrebbe
                  dove si trova.
                */}
                <span
                  aria-hidden="true"
                  className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-ink-faint transition-colors group-data-[scelto=true]:border-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
                >
                  <span className="block h-1.5 w-1.5 rounded-full bg-accent opacity-0 transition-opacity group-data-[scelto=true]:opacity-100" />
                </span>
                <span className="text-sm">{f.formato}</span>
              </span>
              <span className="figures text-sm">{prezzo(f.prezzo)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        disabled={!formato}
        onClick={() => {
          if (!formato) return;
          aggiungi({ slug, title, formato: formato.formato, prezzo: formato.prezzo, immagine });
          setAggiunto(formato.formato);
        }}
        className={`mt-8 ${AZIONE} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <Borsa size={18} className="shrink-0" />
        Aggiungi al carrello
      </button>

      <p role="status" className="mt-3 min-h-[1.25rem] text-xs text-ink-faint">
        {aggiunto ? (
          <>
            Aggiunta al carrello, formato {aggiunto}.{" "}
            <Link
              href="/carrello"
              className="group inline-flex items-center gap-1 text-ink-soft transition-colors hover:text-ink"
            >
              <span className="link-underline">Vai al carrello</span>
              <ArrowRight size={14} className="shrink-0" />
            </Link>
          </>
        ) : (
          "Spedizione in Italia e nell’Unione Europea. Paghi con Stripe."
        )}
      </p>
    </div>
  );
}
