"use client";

import type { RefObject } from "react";
import { prezzo } from "@/data/shop";
import type { CodiceApplicato } from "./store";

/*
  Le righe dei conti, le stesse nel carrello e nella cassa: etichetta in
  maiuscoletto a sinistra, cifra in tabulari a destra, un filetto sotto.
*/

/**
 * Il codice nei conti: una riga fra Subtotale e Spedizione, perché toglie
 * dalle stampe e non dal resto. Il nome del codice in inchiostro accanto
 * all'etichetta, la cifra in terracotta —è una parola di stato, la sola nei
 * conti— e sotto, piccolo, su cosa vale e come toglierlo.
 *
 * Se tutte le stampe sono già in sconto di stagione il codice resta, ma lo
 * dice: «già in sconto» e niente cifra, invece di un «−0,00 €» che sembra un
 * errore.
 */
export function RigaCodice({
  ref,
  codice,
  sconto,
  fuori,
  righe,
  onTogli,
}: {
  ref: RefObject<HTMLDivElement | null>;
  codice: CodiceApplicato;
  sconto: number;
  fuori: number;
  righe: number;
  onTogli: () => void;
}) {
  const nota =
    fuori === 0
      ? `−${codice.percentuale}% sulle stampe`
      : fuori === righe
        ? "Le stampe nel carrello sono già in sconto: il codice non si somma"
        : `−${codice.percentuale}% sulle stampe non già in sconto`;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="codice-entra flex items-start justify-between gap-6 border-b border-line py-3 focus:outline-none"
    >
      <dt className="min-w-0">
        <span className="label">
          Codice <span className="figures text-ink">{codice.codice}</span>
        </span>
        <span className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-xs leading-relaxed text-ink-faint">
          <span>{nota}</span>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={onTogli}
            className="area-tocco text-ink-soft transition-colors hover:text-accent"
          >
            <span className="link-underline">Togli</span>
            <span className="sr-only"> il codice {codice.codice}</span>
          </button>
        </span>
      </dt>
      <dd className={`figures shrink-0 text-sm ${sconto > 0 ? "text-accent" : "text-ink-faint"}`}>
        {sconto > 0 ? `−${prezzo(sconto)}` : "—"}
      </dd>
    </div>
  );
}

export function Conto({ etichetta, valore }: { etichetta: string; valore: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-3">
      <dt className="label">{etichetta}</dt>
      <dd className="figures text-sm">{valore}</dd>
    </div>
  );
}
