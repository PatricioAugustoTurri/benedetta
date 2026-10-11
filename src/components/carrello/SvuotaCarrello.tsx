"use client";

import { useEffect } from "react";
import { ricordaCodice, ricordaDati, svuota } from "./store";

/**
 * Svuota il carrello quando il pagamento è confermato, e dimentica il codice
 * e l'indirizzo: sono serviti per quest'ordine. Non disegna niente.
 */
export default function SvuotaCarrello() {
  useEffect(() => {
    svuota();
    ricordaCodice(null);
    ricordaDati(null);
  }, []);
  return null;
}
