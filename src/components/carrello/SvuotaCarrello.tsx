"use client";

import { useEffect } from "react";
import { svuota } from "./store";

/** Svuota il carrello quando il pagamento è confermato. Non disegna niente. */
export default function SvuotaCarrello() {
  useEffect(() => {
    svuota();
  }, []);
  return null;
}
