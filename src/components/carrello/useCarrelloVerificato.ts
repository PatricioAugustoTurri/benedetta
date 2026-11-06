"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { verificaCarrello } from "@/app/(sitio)/carrello/actions";
import { applicaMinimo, mancaAlMinimo } from "@/data/shop";
import { sostituisci, useCarrello } from "./store";

const nessuno = () => () => {};

/**
 * Il carrello come lo leggono il carrello e la cassa: vivo, e riconfermato
 * contro la tabella una volta per visita.
 *
 * Quello che c'è nel browser è una fotografia di quando si è aggiunto: il
 * prezzo può essere cambiato, la stampa può non esserci più. Si rifà appena
 * si legge, e se qualcosa è cambiato lo si dice —sparire in silenzio è
 * peggio che sparire—.
 *
 * `montato` è falso sul server e al primo disegno: il carrello vive nel
 * browser, e finché non lo si è letto la pagina non dice «vuoto», che
 * sarebbe falso per mezzo secondo.
 *
 * `voci` sono già quelle che si pagano: sotto i 30 € del minimo d'ordine le
 * stampe in sconto di stagione tornano al prezzo pieno (`applicaMinimo`).
 * `mancano` dice quanto manca al minimo, e `stagione` se nel carrello c'è
 * una stampa che lo sconto di stagione lo avrebbe, per dirlo a chi compra.
 */
export function useCarrelloVerificato() {
  const voci = useCarrello();
  const montato = useSyncExternalStore(nessuno, () => true, () => false);
  const [avviso, setAvviso] = useState<string | null>(null);
  const verificato = useRef(false);

  useEffect(() => {
    if (!montato || verificato.current || voci.length === 0) return;
    verificato.current = true;
    verificaCarrello(voci)
      .then(({ voci: nuove, tolte, prezziCambiati }) => {
        sostituisci(nuove);
        const cose = [
          tolte > 0 &&
            (tolte === 1
              ? "Una stampa non è più disponibile ed è uscita dal carrello."
              : `${tolte} stampe non sono più disponibili e sono uscite dal carrello.`),
          prezziCambiati && "Alcuni prezzi sono cambiati da quando li hai aggiunti: qui vedi quelli di adesso.",
        ].filter(Boolean);
        if (cose.length > 0) setAvviso(cose.join(" "));
      })
      .catch(() => {
        // Senza rete il carrello resta com'era: il pagamento lo rifà comunque.
      });
  }, [montato, voci]);

  const mancano = mancaAlMinimo(voci);
  const stagione = mancano > 0 && voci.some((v) => v.scontata);
  return { voci: applicaMinimo(voci), mancano, stagione, montato, avviso, setAvviso };
}
