"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Pencil, Trash } from "@/components/Icon";
import { borrarObra } from "../actions";
import PlacaObra from "./PlacaObra";
import { contarPezzi } from "@/lib/video";
import type { Work } from "@/lib/works";

/**
 * Un'opera nella griglia dell'admin.
 *
 * È la cella del sito con due cose sopra: i controlli, che compaiono al
 * passaggio del puntatore, e la conferma di cancellazione, che occupa la riga
 * della scheda invece di aprire una finestra.
 *
 * **Perché non c'è una finestra modale per cancellare.** Una finestra sopra lo
 * schermo per una domanda di due parole copre proprio quello che bisogna
 * guardare prima di rispondere, cioè l'opera. Qui la domanda esce sotto la sua
 * stessa immagine: si vede cosa si sta per cancellare mentre si decide.
 *
 * È client per due stati che non possono vivere sul server: se il puntatore è
 * sopra e se la cancellazione è stata chiesta.
 *
 * `manija` è il pulsante di trascinamento, e arriva da fuori invece di essere
 * disegnato qui perché spostare un pezzo è l'unica cosa di questa cella che
 * non si risolve al suo interno: bisogna sapere dove sono le altre. La cella
 * decide dove va il controllo —primo del gruppo, con la matita e il cestino— e
 * `ArchivoOrdenable` decide cosa fa.
 */
export default function ObraEditable({ obra, manija }: { obra: Work; manija?: ReactNode }) {
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div className="group/obra relative">
      {/*
        L'immagine porta all'editor. Tutto il pezzo è il bersaglio del click,
        come nel sito tutto il pezzo porta all'opera: il gesto è lo stesso,
        quello che cambia è dove arriva.
      */}
      <Link
        href={`/admin/${obra.id}`}
        className="block focus-visible:outline-none"
        aria-label={`Modifica ${obra.title}`}
      >
        <PlacaObra obra={obra} />
      </Link>

      {/*
        I controlli, in due posti diversi a seconda che ci sia un puntatore o
        no.

        **Con il puntatore** si appoggiano sull'immagine, in alto a destra, e
        non si vedono finché non entra il mouse o non arriva la tastiera: la
        griglia resta pulita e i controlli compaiono sul pezzo che si sta
        guardando. Restano raggiungibili con il tab anche se non si vedono,
        perché `opacity-0` non toglie niente dall'ordine di fuoco.

        **Senza puntatore** scendono sulla riga della scheda, accanto al titolo
        e all'anno. Lì l'hover non avviene mai, quindi devono essere sempre
        presenti; e se stessero sempre sopra l'immagine, ogni opera
        dell'archivio resterebbe con due placchette a coprirla, che è il
        contrario di vedere l'archivio come viene pubblicato. In basso sono in
        vista e non coprono niente.

        Il `@media (hover: hover)` chiede del dispositivo e non della
        larghezza: un tablet è largo e si tocca lo stesso.

        La maniglia entra per prima nel gruppo perché è l'unica delle tre che
        si tiene invece di toccarsi: la mano va a lei, non a lei dopo essere
        passata per le altre due.
      */}
      <div className="mt-2 flex justify-end gap-1 [@media(hover:hover)]:absolute [@media(hover:hover)]:right-2 [@media(hover:hover)]:top-2 [@media(hover:hover)]:mt-0 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:transition-opacity [@media(hover:hover)]:duration-300 [@media(hover:hover)]:group-hover/obra:opacity-100 [@media(hover:hover)]:group-focus-within/obra:opacity-100">
        {manija}

        {/*
          La matita è la stessa destinazione della cella intera, quindi per la
          tastiera e il lettore di schermo è di troppo: senza questo, passare
          la griglia con il tab annuncia «Modifica Giardino notturno» due volte
          di fila e la seconda non porta da nessuna parte nuova. Resta come
          segnale visivo —dice che il pezzo si modifica— ed esce dal percorso
          con `tabIndex={-1}`, che è quello che rende accettabile
          l'`aria-hidden` accanto.
        */}
        <Link
          href={`/admin/${obra.id}`}
          title="Modifica"
          aria-hidden="true"
          tabIndex={-1}
          className="flex h-8 w-8 items-center justify-center bg-paper/95 text-ink-soft transition-colors hover:text-ink"
        >
          <Pencil size={16} />
        </Link>

        <button
          type="button"
          onClick={() => setConfirmando(true)}
          title="Cancella"
          className="flex h-8 w-8 items-center justify-center bg-paper/95 text-ink-soft transition-colors hover:text-accent focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        >
          <span className="sr-only">Cancella {obra.title}</span>
          <Trash size={16} />
        </button>
      </div>

      {/*
        La conferma copre la scheda, non l'opera. Carta piena su filetto
        terracotta: è l'unico momento dell'admin in cui il colore prende un
        bordo intero, e ne prende uno perché quello che segue non si può
        disfare.
      */}
      {confirmando && (
        <div className="absolute inset-x-0 bottom-0 border-t border-accent bg-paper p-3">
          <p className="text-xs text-ink">
            Si cancella «{obra.title}» con {contarPezzi(obra.image)}. Non si può
            disfare.
          </p>

          <div className="mt-2.5 flex items-center gap-4 text-xs">
            <form action={borrarObra}>
              <input type="hidden" name="id" value={obra.id} />
              <button
                type="submit"
                className="link-underline text-accent transition-opacity hover:opacity-70"
              >
                Cancella
              </button>
            </form>

            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="link-underline text-ink-soft transition-colors hover:text-ink"
            >
              Lasciala
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
