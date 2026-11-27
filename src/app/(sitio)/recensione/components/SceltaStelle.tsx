"use client";

import { useState } from "react";
import { Stella } from "@/components/Stelle";

const PAROLE = ["", "Non mi è piaciuto", "Così così", "Bello", "Molto bello", "Bellissimo"];

/**
 * Le cinque stelle da scegliere: cinque radio nascosti dietro le stelle, così
 * con la tastiera si sceglie con le frecce e il lettore di schermo legge «3
 * stelle». Passandoci sopra si accendono fino al puntatore, e accanto esce la
 * parola che dice cosa vuol dire quel numero.
 *
 * La usano il modulo delle recensioni dei prodotti e quello delle
 * testimonianze dei servizi: lo stesso gesto, nello stesso modo.
 */
export default function SceltaStelle({
  name,
  legenda,
  voto,
  onVoto,
  descritta,
}: {
  name: string;
  /** Per chi non vede: «Quante stelle a Moka». */
  legenda: string;
  voto: number;
  onVoto: (n: number) => void;
  /** L'id del messaggio d'errore, se c'è. */
  descritta?: string;
}) {
  const [sopra, setSopra] = useState(0);
  const acceso = sopra || voto;

  return (
    <fieldset aria-describedby={descritta}>
      <legend className="sr-only">{legenda}</legend>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex text-[1.75rem]" onMouseLeave={() => setSopra(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer px-0.5" onMouseEnter={() => setSopra(n)}>
              <input
                type="radio"
                name={name}
                value={n}
                checked={voto === n}
                onChange={() => onVoto(n)}
                className="peer sr-only"
              />
              <span className="sr-only">{n === 1 ? "1 stella" : `${n} stelle`}</span>
              <span className="block rounded-sm transition-transform duration-200 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink hover:scale-110">
                <Stella pieno={acceso >= n ? 1 : 0} />
              </span>
            </label>
          ))}
        </div>
        <span className="text-sm text-ink-soft" aria-hidden="true">
          {PAROLE[acceso]}
        </span>
      </div>
    </fieldset>
  );
}
