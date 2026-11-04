"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "@/components/Icon";

/** Quante righe della griglia restano a vista quando è chiusa. */
const RIGHE_A_VISTA = 2;

/**
 * Una griglia dell'admin che si apre a richiesta.
 *
 * Le stampe sono più di venti, e la griglia intera spingeva Sconti e Codici
 * tre schermate più in basso: per cambiare un codice bisognava scorrere
 * tutte le copertine (cliente, 2026-11-01). Chiusa, mostra le prime due righe
 * —la casella «nuova» e le ultime entrate, che sono quelle che si toccano—
 * e sotto il conto di quelle che mancano.
 *
 * Il taglio si misura sulla griglia vera e non si conta in celle: le colonne
 * cambiano con lo schermo e le righe hanno altezze diverse, perché un titolo
 * può andare su due righe. Se le righe sono poche, non si chiude niente.
 *
 * Il trascinamento non sa niente di tutto questo. Le celle nascoste restano
 * nella pagina, solo tagliate, quindi la griglia ha sempre la lista intera e
 * salva un ordine completo. Afferrare una maniglia —col dito o con la
 * tastiera— o arrivare col tab a una cella nascosta apre la griglia senza
 * animazione: aprire aggiunge spazio solo sotto, e niente di quello che è già
 * a vista si sposta sotto la mano.
 */
export default function GrigliaPlegable({
  totale,
  nome,
  children,
}: {
  /** Quanti pezzi ci sono, per il bottone: «Mostra tutte le 22 stampe». */
  totale: number;
  /** Il nome al plurale, con il suo articolo: «tutte le … stampe», «tutti i … prodotti». */
  nome: { tutti: string; pezzi: string };
  children: ReactNode;
}) {
  const id = useId();
  const contenitore = useRef<HTMLDivElement>(null);
  const [aperta, setAperta] = useState(false);
  /** Dove si taglia, in px dall'alto del contenitore. Null: troppo poche righe, non si chiude. */
  const [taglio, setTaglio] = useState<number | null>(null);
  /** L'altezza intera, per animare l'apertura fino a lì e non fino a un numero a caso. */
  const [intera, setIntera] = useState(0);
  const [senzaAnimazione, setSenzaAnimazione] = useState(false);

  const misura = useCallback(() => {
    const el = contenitore.current;
    const ul = el?.querySelector("ul");
    if (!el || !ul) return;
    const celle = Array.from(ul.children) as HTMLElement[];
    const cima = el.getBoundingClientRect().top;

    // Le righe, lette da dove stanno davvero le celle.
    const righe: HTMLElement[][] = [];
    for (const c of celle) {
      const top = Math.round(c.getBoundingClientRect().top);
      const ultima = righe[righe.length - 1];
      if (ultima && Math.abs(Math.round(ultima[0].getBoundingClientRect().top) - top) < 4) ultima.push(c);
      else righe.push([c]);
    }

    setIntera(el.scrollHeight);
    // Chiudere per nascondere una riga sola non fa risparmiare niente.
    if (righe.length <= RIGHE_A_VISTA + 1) {
      setTaglio(null);
      return;
    }
    const fondo = Math.max(...righe[RIGHE_A_VISTA - 1].map((c) => c.getBoundingClientRect().bottom));
    setTaglio(Math.ceil(fondo - cima));
  }, []);

  useLayoutEffect(() => {
    misura();
    const el = contenitore.current;
    if (!el) return;
    const ro = new ResizeObserver(misura);
    ro.observe(el);
    const ul = el.querySelector("ul");
    if (ul) ro.observe(ul);
    return () => ro.disconnect();
  }, [misura]);

  // L'apertura senza animazione vale per quel gesto solo.
  useEffect(() => {
    if (!senzaAnimazione) return;
    const r = requestAnimationFrame(() => setSenzaAnimazione(false));
    return () => cancelAnimationFrame(r);
  }, [senzaAnimazione]);

  const chiusa = taglio !== null && !aperta;

  const apriSubito = () => {
    if (!chiusa) return;
    setSenzaAnimazione(true);
    setAperta(true);
  };

  const chiudi = () => {
    setAperta(false);
    // Chiudendo da in fondo, la griglia si accorcia sotto i piedi e lascia lo
    // schermo su Sconti: si torna dove comincia, che è dove si era.
    const el = contenitore.current;
    if (el && el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  };

  if (taglio === null) {
    return <div ref={contenitore}>{children}</div>;
  }

  return (
    <>
      <div
        ref={contenitore}
        id={id}
        // La maniglia si afferra con il puntatore o con la barra: tutte e due
        // passano di qui prima che la griglia misuri le sue celle.
        onPointerDownCapture={(e) => {
          if ((e.target as HTMLElement).closest("[data-maniglia]")) apriSubito();
        }}
        onKeyDownCapture={(e) => {
          if ((e.key === " " || e.key === "Enter") && (e.target as HTMLElement).closest("[data-maniglia]")) {
            apriSubito();
          }
        }}
        onFocusCapture={(e) => {
          if (!chiusa) return;
          const el = contenitore.current;
          if (!el) return;
          const sopra = (e.target as HTMLElement).getBoundingClientRect().top - el.getBoundingClientRect().top;
          if (sopra >= taglio - 8) apriSubito();
        }}
        style={{ maxHeight: chiusa ? taglio : intera || undefined }}
        className={`relative overflow-hidden ${
          senzaAnimazione ? "" : "transition-[max-height] duration-[560ms] ease-[var(--ease-out-soft)]"
        }`}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && aperta) misura();
        }}
      >
        {children}

        {/*
          Il bordo del taglio sfuma nella carta: dice che la griglia continua
          sotto, senza un filetto in più fra le celle e il bottone.
        */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-paper/0 to-paper transition-opacity duration-300 ${
            chiusa ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      <button
        type="button"
        aria-expanded={!chiusa}
        aria-controls={id}
        onClick={() => (chiusa ? setAperta(true) : chiudi())}
        className="area-tocco group mt-5 inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <span className="link-underline">
          {chiusa ? `Mostra ${nome.tutti} ${totale} ${nome.pezzi}` : "Mostra meno"}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-[380ms] ease-[var(--ease-out-soft)] ${
            chiusa ? "" : "rotate-180"
          }`}
        />
      </button>
    </>
  );
}
