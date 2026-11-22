"use client";

import Image from "@/components/Immagine";
import Link from "next/link";
import { useState, type SyntheticEvent } from "react";
import { site } from "@/data/site";

/**
 * Il logotipo dell'header: la sua firma, che si ripassa.
 *
 * Quando il mouse ci si appoggia, una penna d'inchiostro color terra (il
 * colore d'accento del sito) riscrive il nome sopra la scansione: prima
 * «Benedetta», da sinistra a destra, poi «Zibetti», sotto, e senza staccare
 * la penna una stella dopo la «i», come la stella che tiene in mano la
 * ragazza dell'apertura. Poi l'inchiostro si asciuga, la firma torna nera e
 * la stella se ne va. È la sua scrittura a muoversi, non l'interfaccia: il
 * logotipo non salta, non cresce, non cambia posto.
 *
 * Il ripasso è una copia della firma in colore d'accento, ritagliata con la
 * firma stessa come maschera (`.firma-ripasso` in globals.css). Una seconda
 * maschera, una sfumatura che scorre, scopre l'inchiostro come avanza una
 * penna. Le due righe sono due copie, ognuna tagliata sulla sua riga.
 *
 * **Una volta finito, finisce.** Il ripasso parte all'entrata del mouse e va
 * fino in fondo anche se il mouse esce: una firma interrotta a metà sembra un
 * errore. Finché non ha finito, ripassarci sopra non lo fa ripartire. Con la
 * tastiera parte con il fuoco visibile, come al passaggio del mouse.
 */
export default function FirmaLogo() {
  const [ripassa, setRipassa] = useState(false);

  const avvia = () => setRipassa(true);

  const fine = (e: SyntheticEvent<HTMLAnchorElement, AnimationEvent>) => {
    if (e.nativeEvent.animationName === "firma-asciuga") setRipassa(false);
  };

  return (
    <Link
      href="/"
      aria-label={`${site.signature} — archivio`}
      data-ripassa={ripassa || undefined}
      onMouseEnter={avvia}
      onFocus={(e) => {
        if (e.currentTarget.matches(":focus-visible")) avvia();
      }}
      onAnimationEnd={fine}
      className="firma relative block"
    >
      {/*
        Il logotipo è la sua scrittura, scansionata e ritagliata: non c'è
        un carattere che lo componga. Va con alt vuoto di proposito —il
        nome accessibile lo dà già l'aria-label del link, e ripeterlo
        sull'immagine lo farebbe annunciare due volte.
        width/height sono quelli del file, perché lo spazio sia riservato
        prima del caricamento e l'header non salti.
      */}
      <Image
        src="/benedetta-zibetti-wordmark.png"
        alt=""
        width={602}
        height={375}
        priority
        sizes="(min-width: 768px) 136px, 100px"
        className="h-auto w-[100px] md:w-[136px]"
      />
      <span aria-hidden="true" className="firma-ripasso firma-ripasso--sopra" />
      <span aria-hidden="true" className="firma-ripasso firma-ripasso--sotto" />
      {/*
        La stella con cui la penna chiude la firma: un tratto solo, a mano,
        cinque linee che si incrociano come la si disegna su un quaderno. I
        lati sono appena curvi e l'ultimo non chiude preciso sul primo:
        una stella col righello sarebbe un'icona, non un gesto.
        `pathLength="1"` permette al CSS di scoprire il tratto per frazioni.
      */}
      <svg aria-hidden="true" viewBox="0 0 24 24" className="firma-stella">
        <path
          pathLength={1}
          d="M5.4 21.2Q8.3 11.5 11.9 2.1Q15.5 11.4 18.4 20.9Q10.4 14.6 2.1 9.3Q12 8.6 22 9Q14.2 15.2 5.9 20.7"
        />
      </svg>
    </Link>
  );
}
