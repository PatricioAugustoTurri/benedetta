"use client";

import { useEffect } from "react";

/**
 * Apre la domanda a cui punta l'indirizzo: chi arriva da
 * `/domande-frequenti#cornice` —dalla scheda di una stampa, da un link
 * mandato per WhatsApp— trova la risposta già aperta, non una riga chiusa da
 * cercare. Chrome apre da solo un `<details>` raggiunto da un'ancora; Safari
 * e Firefox no, e qui lo si fa per tutti.
 *
 * Senza JavaScript la pagina funziona lo stesso: si arriva alla domanda, e si
 * apre con un tocco.
 */
export default function ApriDomanda() {
  useEffect(() => {
    const apri = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (el instanceof HTMLDetailsElement && !el.open) {
        el.open = true;
        el.scrollIntoView({ block: "start" });
      }
    };
    apri();
    window.addEventListener("hashchange", apri);
    return () => window.removeEventListener("hashchange", apri);
  }, []);
  return null;
}
