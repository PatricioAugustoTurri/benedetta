"use client";

import Image from "@/components/Immagine";
import Link from "next/link";
import { useState, type SyntheticEvent } from "react";
import { site } from "@/data/site";

/*
  La stella, in un quadrato di 40. Disegnata per il sito, non ricalcata:
  sette punte di lunghezza e apertura diverse, con i lati appena rientrati
  e un tremito di mano, come una stella fatta a pastello. I numeri vengono
  da un piccolo generatore con un seme fisso, quindi è sempre la stessa.

  - FORMA: il contorno.
  - PASTELLO: i segni chiari del pastello sopra il pieno, quasi tutti nella
    stessa direzione e qualcuno di traverso, tagliati sulla forma.
  - GESTO: la mano che la colora, andata e ritorno dall'alto in basso.
*/
const STELLA_FORMA =
  "M17.4 2.4Q19.2 10.3 21.5 14.6Q25.2 13.2 30.6 9.7Q27.3 14.6 25.6 18.6Q30 20.9 37.3 22.7Q30 22.9 24.9 23.5Q25.1 26.1 27 31Q23.6 28.3 21.4 27.1Q18.5 31 15.8 38.9Q16.3 31.1 15.7 25.1Q13 24.4 7.6 25.6Q12 22.1 13.4 19.9Q11.6 16.9 5.8 12.1Q12.3 14.5 16.7 14.8Q17.7 10.1 17.4 2.4Z";
const STELLA_PASTELLO =
  "M0.5 -1.7Q2.1 3.6 3.5 8.5M5.7 -0.9Q7.2 4.8 8.9 9.6M7.1 -2.8Q9.2 1 12.4 5.2M13.5 -1.3Q14.6 1.5 16.5 4M16.1 -0.8Q17.9 4.6 18.9 9.8M22.4 0.2Q23.2 2.5 24 5.4M25.9 2.2Q28.5 1.8 29.9 0.9M28.8 0.9Q29.8 3.8 30.9 7.4M34 -2.4Q35.1 2.5 36.8 6.2M33.9 -1.8Q36 1.6 38.6 4M3.6 2.6Q4.9 7 7.1 11M4.5 3.4Q6.6 6.5 8.9 10.2M7.9 3Q10 7.4 12.1 11.6M13.4 1.8Q14.5 5 15.9 9M17.3 0.9Q19 5.9 19.8 10.3M19.1 1.7Q22.1 6.2 24.5 10.5M25.6 6.3Q26.7 8.1 27 9.1M29.8 5.8Q30.7 7.9 30.7 8.7M29.9 7.8Q33.7 6.7 36 4.8M35 2.7Q37.9 6.6 41.2 11.7M3.9 5.6Q5.1 9.8 5.8 13M4.4 8.7Q5.9 12.4 8.5 15.9M11 5.6Q13 9.5 13.9 12.6M11.5 7.9Q13.5 12 16.7 15.5M16.3 11.7Q17.8 10.8 20.5 9.9M21.6 7.5Q22.6 13 24 17.3M26.4 10.1Q27.7 11.3 27.9 13.9M29.9 7.9Q30.3 11.7 32 16.9M31.9 8.4Q34.1 10.8 36.4 13.9M35 4.3Q36.5 9.7 38.2 14M3.3 11.1Q4.9 13.7 6.7 16.9M2.4 16.1Q6.4 14.4 10 13.8M7.5 12.5Q9.3 15.9 12.5 19.4M14.9 9.3Q17.1 13.9 18.4 17.5M16.2 13.2Q18.9 16.8 21 19.9M22.4 11.9Q24.3 15.2 26.2 18.6M25.1 14.2Q26.1 16 27.1 17.4M29.9 11.2Q31.9 13.7 32.6 17.3M32.6 13.1Q34 16.2 35.5 18.8M34.9 9.2Q36.1 13.8 38 19.1M1.4 16.9Q2.1 20.1 3.1 22.8M6.4 14.5Q7.2 16.6 7.9 20M8.4 15.2Q11.2 19.2 13.6 23.6M15.4 15.3Q15.3 16.8 16.5 19.5M17.8 15.9Q20.1 19.6 23 22.9M20.8 15.3Q22.2 20.2 22.9 24.2M26.9 17.8Q27.6 19.9 28.8 20.9M29.2 15.2Q31.7 19.5 34 24.5M30.1 21.8Q34.5 19.2 37.7 17.2M36.7 13.9Q39.8 17.3 41.8 21.9M2.2 23.5Q3.4 22.8 5.5 21.5M5.7 19.8Q8.5 23.5 10 27.8M6.9 19.2Q9.9 23.1 12.5 27.9M13.1 19Q14.8 23.3 16.1 26.5M16.8 23.3Q18.5 21.9 20.4 21M22.8 19.8Q24.3 21.8 25.4 25M25.3 22.8Q27.1 23 28.9 22M30 19.9Q32.1 24.3 32.9 27.7M32.1 20.1Q34.3 24.2 37.1 28.9M33.4 16.8Q36.4 21.6 39.1 25.7M-0.4 26.6Q2.7 25.5 5.2 24.8M3.2 27.7Q8 25.9 11.6 24.3M9.4 24.4Q10.8 26.8 12.4 29.1M13 26.3Q14 27.9 15 29.3M16.7 24.3Q17.5 27.6 18.9 31.2M22.7 23.2Q23.9 25.8 25 27.2M26.3 24.4Q28 28.1 29.1 30.7M29.4 26.5Q30.4 28.8 32 30.1M32.2 23.9Q34.3 28.3 36.8 31.9M36.1 24.3Q37 26.1 37.3 27.5M1.9 31.2Q4.3 29.9 6.1 29.3M8.6 31Q9 32.6 9.7 33.8M8.2 30.3Q10.1 30.1 12.3 29.1M10.7 33.4Q15.7 31 19.5 29.5M16.4 33.3Q18.5 32.3 21.8 30.1M19.9 28Q21.5 31 22.4 34.3M24.9 32.6Q27.3 31.4 29.5 31.3M29.5 26.8Q30.7 31.9 31.9 37.1M33.6 29.5Q34.6 31.2 35.8 33.7M34 31.9Q39.3 30.1 43.7 29.3M3.3 30.5Q5.1 34.1 6.1 36.7M5.8 30.7Q6.4 34.2 8.1 37.4M10.8 29.8Q12.3 34.4 13.4 39.3M14.8 35.1Q15.1 36.2 16.3 38M19.4 29.7Q20.3 33.4 21.5 38.5M22.9 32.2Q23.9 33.4 24.5 35.3M26.2 32.8Q27.4 34.2 28 36.2M29.5 32.4Q30.8 35.5 33.1 38.9M33.5 30.6Q35.1 34.5 37.1 37.5M32.7 35.4Q36.9 33.3 41 32.3M4.1 36.7Q5.7 39.9 6.5 42.4M6.9 37.2Q8.1 38.8 10.5 41.7M9.4 35.1Q11.6 38.3 12.8 41M11.8 35.5Q14.6 38.9 17.3 42.6M15.8 34.1Q18.2 37 20.1 40.4M20.6 33.7Q22.2 37.3 23.8 41.4M26.5 33.2Q27.2 37.5 29 41.1M27.2 40.6Q30.8 38.4 34 37.4M32.8 35.9Q35.7 39.3 37.5 41.9M35.2 34.5Q36.6 37.1 39.2 39.7";
const STELLA_GESTO = "M2 1L38 3.4L2 10.6L38 13L2 20.2L38 22.6L2 29.8L38 32.2L2 39.4L38 41.8";

/**
 * Il logotipo dell'header: la sua firma, che si ripassa.
 *
 * Quando il mouse ci si appoggia, una penna d'inchiostro giallo oro (lo
 * stesso della stella) riscrive il nome sopra la scansione: prima
 * «Benedetta», da sinistra a destra, poi «Zibetti», sotto, e senza staccare
 * la penna una stella dopo la «i», come la stella che tiene in mano la
 * ragazza dell'apertura. Poi l'inchiostro si asciuga, la firma torna nera e
 * la stella se ne va. È la sua scrittura a muoversi, non l'interfaccia: il
 * logotipo non salta, non cresce, non cambia posto.
 *
 * Il ripasso è una copia della firma in giallo oro, ritagliata con la
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
        La stella con cui la penna chiude la firma: sette punte storte e
        diverse, colorata a pastello. La colora un gesto di andata e ritorno
        (la maschera), come si riempie una forma su un quaderno. Gli id sono
        fissi perché la firma c'è una volta sola, nell'header.
      */}
      <svg aria-hidden="true" viewBox="0 0 40 40" className="firma-stella">
        <defs>
          <clipPath id="firma-stella-forma">
            <path d={STELLA_FORMA} />
          </clipPath>
          <mask id="firma-stella-gesto" maskUnits="userSpaceOnUse" x="-4" y="-4" width="48" height="50">
            <path d={STELLA_GESTO} pathLength={1} className="firma-stella-gesto" />
          </mask>
        </defs>
        <g mask="url(#firma-stella-gesto)">
          <path d={STELLA_FORMA} className="firma-stella-pieno" />
          <path d={STELLA_PASTELLO} clipPath="url(#firma-stella-forma)" className="firma-stella-pastello" />
        </g>
      </svg>
    </Link>
  );
}
