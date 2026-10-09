"use client";

import { useEffect } from "react";
import { ricordaCodice, svuota } from "./store";

/**
 * Svuota il carrello quando il pagamento è confermato, e dimentica il codice:
 * è servito per quest'ordine. Non disegna niente.
 */
export default function SvuotaCarrello() {
  useEffect(() => {
    svuota();
    ricordaCodice(null);
  }, []);
  return null;
}
