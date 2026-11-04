"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { dipingi } from "./pennello";

/**
 * L'apertura della home: un'illustrazione a piena pagina che si dipinge a
 * pennellate sul suo fondo, resta un momento e si alza come un telo sopra
 * l'archivio.
 *
 * Tre fasi, scritte in `data-fase` e disegnate in globals.css:
 *   attesa  → arriva dal server: solo il fondo prugna dell'opera, l'immagine
 *             ancora invisibile. Niente parte finché l'immagine non è pronta,
 *             così non si vede mai un'opera che si carica a strisce.
 *   scena   → il pennello la stende sul fondo prugna (vedi `pennello.ts`),
 *             cominciando dalla stella e dal viso; quando ha finito, il
 *             colore «si chiude»: l'immagine vera sale sopra le pennellate e
 *             copre le righe rimaste scoperte.
 *   uscita  → il telo sale e scopre la pagina; a fine corsa il nodo si toglie.
 *
 * Qualsiasi gesto —clic, tasto, rotella, tocco— porta subito all'uscita:
 * un'apertura che non si può saltare è un'anticamera, e questo sito non ne ha.
 */

// Il colore di fondo dell'illustrazione, misurato sul file. Il telo ha lo
// stesso colore, così prima che l'immagine arrivi c'è già il suo spazio.
const FONDO = "#533938";

// Quanto dura la pittura, dalla prima all'ultima pennellata.
const PITTURA_MS = 1600;
// Quanto resta l'opera finita prima di alzarsi.
const SOSTA_MS = 1100;
// Con il movimento ridotto non si dipinge: compare e resta.
const SOSTA_RIDOTTA_MS = 1700;
// Se l'immagine non è pronta in questo tempo, il telo si alza lo stesso.
const ATTESA_MAX_MS = 2500;

/*
  Vale per il caricamento della pagina, non per la sessione: tornando alla
  home da un'altra pagina del sito l'apertura non si ripete. Lo scrive solo un
  effetto, cioè solo il browser, così sul server resta sempre `false` e
  l'idratazione trova lo stesso HTML.
*/
let giaVista = false;

type Fase = "attesa" | "scena" | "uscita" | "finita";

export default function Apertura() {
  const [fase, setFase] = useState<Fase>(() => (giaVista ? "finita" : "attesa"));
  // «no» con il movimento ridotto: allora l'immagine compare e basta.
  const [pennello, setPennello] = useState<"si" | "no">("si");
  const [dipinta, setDipinta] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);

  const esci = useCallback(() => {
    setFase((f) => (f === "attesa" || f === "scena" ? "uscita" : f));
  }, []);

  // Parte quando l'immagine è decodificata, non solo scaricata.
  const pronta = useCallback(() => {
    const via = () => setFase((f) => (f === "attesa" ? "scena" : f));
    const el = img.current;
    if (el?.decode) el.decode().then(via, via);
    else via();
  }, []);

  useEffect(() => {
    if (fase === "finita") return;
    giaVista = true;
    if (img.current?.complete) pronta();
    const t = window.setTimeout(
      () => setFase((f) => (f === "attesa" ? "uscita" : f)),
      ATTESA_MAX_MS,
    );
    return () => window.clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // In scena: si dipinge, e a pittura finita si conta la sosta.
  useEffect(() => {
    if (fase !== "scena") return;
    const ridotto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = img.current;
    const canvas = tela.current;
    if (ridotto || !el || !canvas) {
      setPennello("no");
      const t = window.setTimeout(esci, SOSTA_RIDOTTA_MS);
      return () => window.clearTimeout(t);
    }

    // La stessa inquadratura dell'immagine in CSS: in verticale si sposta a
    // sinistra per tenere dentro la mano con la stella.
    const verticale = window.matchMedia("(max-aspect-ratio: 1/1)").matches;
    let sosta = 0;
    const ferma = dipingi(canvas, el, {
      durata: PITTURA_MS,
      posX: verticale ? 0.3 : 0.5,
      posY: 0.3,
      fine: () => {
        setDipinta(true);
        sosta = window.setTimeout(esci, SOSTA_MS);
      },
    });
    return () => {
      ferma();
      window.clearTimeout(sosta);
    };
  }, [fase, esci]);

  // Mentre l'opera è in scena la pagina sotto non scorre; qualsiasi gesto
  // invece fa alzare il telo.
  useEffect(() => {
    if (fase !== "attesa" && fase !== "scena") return;
    const root = document.documentElement;
    const prima = root.style.overflow;
    root.style.overflow = "hidden";
    const eventi = ["pointerdown", "keydown", "wheel", "touchmove"] as const;
    eventi.forEach((e) => window.addEventListener(e, esci, { passive: true }));
    return () => {
      root.style.overflow = prima;
      eventi.forEach((e) => window.removeEventListener(e, esci));
    };
  }, [fase, esci]);

  if (fase === "finita") return null;

  return (
    <div
      className="apertura"
      data-fase={fase}
      data-pennello={pennello}
      data-dipinta={dipinta ? "si" : undefined}
      aria-hidden="true"
    >
      {/* Senza JavaScript non c'è niente che la faccia partire: si toglie. */}
      <noscript>
        <style>{".apertura{display:none}"}</style>
      </noscript>
      <div
        className="apertura__telo"
        style={{ backgroundColor: FONDO }}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) setFase("finita");
        }}
      >
        <div className="apertura__opera">
          <canvas ref={tela} className="apertura__tela" />
          <Image
            ref={img}
            src="/instagram/3.jpg"
            alt=""
            fill
            sizes="100vw"
            preload
            onLoad={pronta}
            className="apertura__immagine"
          />
        </div>
      </div>
      <div className="apertura__filo" />
    </div>
  );
}
