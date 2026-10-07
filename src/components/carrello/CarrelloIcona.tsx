"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Borsa } from "@/components/Icon";
import { contaStampe, EVENTO_AGGIUNTO, useCarrello, type DettaglioAggiunto } from "./store";

/** Come si dice il carrello a chi non lo vede. */
export function nomeCarrello(n: number): string {
  if (n === 0) return "Carrello, vuoto";
  return `Carrello, ${n} ${n === 1 ? "stampa" : "stampe"}`;
}

/**
 * Il carrello nella barra, a destra dell'insegna.
 *
 * Il numero sta dentro la borsa, stampato sul corpo, e non in un pallino
 * appeso al bordo: in questo sistema non c'è niente di arrotondato da
 * appoggiare sopra un'icona, e un bollino rosso è il gesto di un'app che
 * reclama attenzione. Qui il numero è un'etichetta sulla borsa, in
 * inchiostro, alla stessa misura delle cifre della scheda.
 *
 * Vuota, la borsa resta vuota: niente zero. Uno zero è un numero da leggere
 * che non dice niente.
 *
 * **Il movimento è uno solo, ed è il momento in cui si aggiunge.** La borsa
 * scende di un paio di pixel e torna, come quando ci si lascia cadere dentro
 * qualcosa, e il numero nuovo sale dal fondo. Non si muove quando il carrello
 * si carica, né quando cambia in un'altra scheda: lì non è successo niente
 * davanti a chi guarda. Il numero conta le stampe diverse e non le copie,
 * quindi una copia in più di una stampa già dentro fa scendere la borsa ma
 * non muove il numero, che è rimasto lo stesso.
 */
export default function CarrelloIcona({ className = "" }: { className?: string }) {
  const n = contaStampe(useCarrello());
  const pathname = usePathname();
  const qui = pathname.startsWith("/carrello");
  // Quante volte si è aggiunto da quando la pagina è aperta. Fa da `key`:
  // cambiare chiave rimonta il disegno, e rimontarlo fa ripartire l'animazione.
  const [colpo, setColpo] = useState(0);
  const [nuova, setNuova] = useState(false);

  useEffect(() => {
    const suAggiunto = (e: Event) => {
      setNuova((e as CustomEvent<DettaglioAggiunto>).detail?.nuova ?? true);
      setColpo((c) => c + 1);
    };
    window.addEventListener(EVENTO_AGGIUNTO, suAggiunto);
    return () => window.removeEventListener(EVENTO_AGGIUNTO, suAggiunto);
  }, []);

  return (
    <Link
      href="/carrello"
      aria-label={nomeCarrello(n)}
      aria-current={qui ? "page" : undefined}
      data-active={qui}
      className={`flex h-10 w-10 items-center justify-center text-ink-soft transition-colors hover:text-ink data-[active=true]:text-ink ${className}`}
    >
      <span key={colpo} data-colpo={colpo > 0} data-nuova={nuova} className="carrello-borsa relative block">
        <Borsa size={26} />
        {n > 0 && (
          <span
            aria-hidden="true"
            className="carrello-numero figures absolute inset-x-0 bottom-[5px] text-center text-[0.625rem] font-medium leading-none"
          >
            {n > 99 ? "99+" : n}
          </span>
        )}
      </span>
    </Link>
  );
}
