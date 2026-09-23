import Link from "next/link";
import { Plus } from "@/components/Icon";

/**
 * La casella di inserimento: la prima cella della griglia.
 *
 * Ha la misura e la proporzione di un'opera, con filetto tratteggiato al posto
 * dell'immagine. È l'azione primaria della schermata e sta dove l'occhio
 * comincia a leggere la griglia, senza bisogno di un pulsante flottante né di
 * una barra di azioni: il posto vuoto dove andrà l'opera *è* il controllo per
 * caricarla.
 *
 * Il tratteggio non è decorazione. Un filetto pieno la farebbe leggere come un
 * pezzo in più, ancora da caricare; tratteggiato dice che non c'è niente e che
 * ci si può mettere qualcosa.
 */
export default function NuevaObra() {
  return (
    <Link
      href="/admin/nueva"
      className="group block focus-visible:outline-none"
    >
      {/*
        Sul telefono la griglia è a colonna singola, quindi la casella non ha
        con chi allinearsi e una cella verticale si mangia più dello schermo
        intero prima che compaia la prima opera. Lì va orizzontale; da 640px,
        dove la griglia si costruisce davvero, prende la proporzione di un
        pezzo, che è 4:5 come nel sito.
      */}
      <span className="flex aspect-[2/1] w-full flex-col items-center justify-center gap-3 border border-dashed border-line bg-paper-deep/40 sm:aspect-[4/5] transition-colors duration-300 group-hover:border-accent/50 group-hover:bg-paper-deep/70 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[3px] group-focus-visible:outline-accent">
        <Plus
          size={24}
          className="text-ink-faint transition-colors duration-300 group-hover:text-accent"
        />
        <span className="label text-ink-faint transition-colors duration-300 group-hover:text-ink-soft">
          Nuova opera
        </span>
      </span>

      {/*
        Le due righe vuote riservano quello che in un'opera caricata occupano
        il titolo e la tecnica, perché le celle di una stessa riga finiscano
        alla stessa altezza. Esistono solo da 640px: in una colonna non c'è
        riga da pareggiare e qui sotto sarebbero quaranta pixel di niente fra
        la casella e la prima opera.
      */}
      <span aria-hidden="true" className="mt-3 hidden text-base leading-normal sm:block">
        &nbsp;
      </span>
      <span aria-hidden="true" className="mt-0.5 hidden text-xs leading-normal sm:block">
        &nbsp;
      </span>
    </Link>
  );
}
