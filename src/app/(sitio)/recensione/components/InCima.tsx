"use client";

import { useEffect } from "react";

/**
 * Riporta la pagina in cima quando compare. Sta nel grazie che segue
 * l'invio: l'azione rifà la pagina e il modulo, lungo, lascia il posto al
 * grazie, corto. Sul telefono chi aveva appena toccato «Pubblica» si
 * ritrovava davanti il piè di pagina, senza vedere che era andata.
 *
 * Aprendo un QR già usato la pagina è già in cima, e non succede niente.
 */
export default function InCima() {
  useEffect(() => {
    if (window.scrollY === 0) return;
    const ridotto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: ridotto ? "auto" : "smooth" });
  }, []);
  return null;
}
