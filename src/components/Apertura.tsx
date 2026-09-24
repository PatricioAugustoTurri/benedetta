"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * L'apertura della home: un'illustrazione a piena pagina che si posa, resta
 * un momento e si alza come un telo sopra l'archivio.
 *
 * Tre fasi, scritte in `data-fase` e disegnate in globals.css:
 *   attesa  → arriva dal server: solo il fondo prugna dell'opera, l'immagine
 *             ancora invisibile. Niente parte finché l'immagine non è pronta,
 *             così non si vede mai un'opera che si carica a strisce.
 *   scena   → l'immagine compare e si assesta.
 *   uscita  → il telo sale e scopre la pagina; a fine corsa il nodo si toglie.
 *
 * Qualsiasi gesto —clic, tasto, rotella, tocco— porta subito all'uscita:
 * un'apertura che non si può saltare è un'anticamera, e questo sito non ne ha.
 */

// Il colore di fondo dell'illustrazione, misurato sul file. Il telo ha lo
// stesso colore, così prima che l'immagine arrivi c'è già il suo spazio.
const FONDO = "#533938";

// Quanto resta l'opera prima di alzarsi, contato da quando compare.
const SOSTA_MS = 1700;
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
  const img = useRef<HTMLImageElement>(null);

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

  useEffect(() => {
    if (fase !== "scena") return;
    const t = window.setTimeout(esci, SOSTA_MS);
    return () => window.clearTimeout(t);
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
    <div className="apertura" data-fase={fase} aria-hidden="true">
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
