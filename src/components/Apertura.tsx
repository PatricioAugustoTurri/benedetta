"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
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
// Se l'immagine non è pronta in questo tempo, il telo si alza lo stesso. Con
// i file già pronti (sotto) arriva in decimi di secondo; il margine è per
// una rete lenta.
const ATTESA_MAX_MS = 4000;
// Quando il CSS toglie il telo da solo, se il JavaScript non è ancora
// arrivato: `apertura-riserva` in globals.css, che parte a 6 s.
const RISERVA_MS = 6000;

/*
  L'illustrazione in file statici, già codificati da
  scripts/apertura-immagini.mjs, e non attraverso `next/image`: il suo
  ottimizzatore in produzione codifica l'AVIF alla prima richiesta di ogni
  misura, e ci metteva da 6 a 13 secondi. L'apertura si alzava prima, e
  l'opera non si vedeva quasi mai (2026-11-09).
*/
const MISURE = [640, 960, 1280, 1600, 2048];
const srcset = (formato: "avif" | "webp") =>
  MISURE.map((w) => `/apertura/apertura-${w}.${formato} ${w}w`).join(", ");
// È un quadrato in `cover`: in orizzontale lo misura la larghezza dello
// schermo, in verticale l'altezza. Con «100vw» un telefono la chiedeva da
// 640 e la stirava a tutta altezza. In verticale si dichiara il 60%
// dell'altezza: un telefono a 3× prende la 1600 (78 KB) e non la 2048
// (134 KB). Per i tre secondi che resta a tutto schermo la differenza non
// si vede, e sul telefono la banda è quella che divide con l'archivio sotto.
const SIZES = "(max-aspect-ratio: 1/1) 60vh, 100vw";

// I tasti che da soli non sono un gesto: chi ricarica con ⌘R li ha ancora
// premuti mentre la pagina parte.
const MODIFICATORI = new Set(["Meta", "Control", "Alt", "Shift", "CapsLock"]);

/*
  Vale per il caricamento della pagina, non per la sessione: tornando alla
  home da un'altra pagina del sito l'apertura non si ripete. Lo scrive solo un
  effetto, cioè solo il browser, così sul server resta sempre `false` e
  l'idratazione trova lo stesso HTML.
*/
let giaVista = false;

type Fase = "attesa" | "scena" | "uscita" | "finita";

export default function Apertura() {
  // Nel <head>, prima ancora del JavaScript: il browser comincia a scaricarla
  // con l'HTML. Solo l'AVIF —chi non lo legge salta il preload e prende il
  // WebP dal <picture>—, così nessuno scarica due formati.
  preload(`/apertura/apertura-${MISURE[MISURE.length - 1]}.avif`, {
    as: "image",
    type: "image/avif",
    imageSrcSet: srcset("avif"),
    imageSizes: SIZES,
    fetchPriority: "high",
  });

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
    // Con una rete molto lenta il JavaScript arriva dopo che il CSS ha già
    // tolto il telo da solo (`apertura-riserva`, a 6 s): chi guarda è già
    // sull'archivio, e l'opera non deve ricomparirgli sopra.
    if (performance.now() > RISERVA_MS) {
      const via = window.setTimeout(() => setFase("finita"), 0);
      return () => window.clearTimeout(via);
    }
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
    const gesto = (e: Event) => {
      if (e instanceof KeyboardEvent && (e.repeat || MODIFICATORI.has(e.key))) return;
      esci();
    };
    const eventi = ["pointerdown", "keydown", "wheel", "touchmove"] as const;
    eventi.forEach((e) => window.addEventListener(e, gesto, { passive: true }));
    return () => {
      root.style.overflow = prima;
      eventi.forEach((e) => window.removeEventListener(e, gesto));
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
          <picture>
            <source type="image/avif" srcSet={srcset("avif")} sizes={SIZES} />
            <img
              ref={img}
              src="/apertura/apertura-1280.webp"
              srcSet={srcset("webp")}
              sizes={SIZES}
              alt=""
              decoding="async"
              fetchPriority="high"
              onLoad={pronta}
              className="apertura__immagine"
            />
          </picture>
        </div>
      </div>
      <div className="apertura__filo" />
    </div>
  );
}
