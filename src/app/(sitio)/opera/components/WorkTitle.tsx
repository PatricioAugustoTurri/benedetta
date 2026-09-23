import Reveal from "@/components/Reveal";
import type { Work } from "@/lib/works";

/**
 * Il nome dell'opera, in cima a tutto.
 *
 * Stava sotto le tavole, in testa alla descrizione, ed è salito su richiesta
 * della cliente. L'ordine che ne risulta —nome, opera, testo— è quello di una
 * scheda di catalogo: si sa cosa si sta per guardare prima di guardarlo, e
 * quello che si legge dopo è contesto di qualcosa che si è già visto.
 *
 * Conta anche da dove si arriva. La griglia dell'archivio non disegna una
 * sola parola, quindi il visitatore tocca un'immagine senza sapere come si
 * chiama; se il nome comparisse solo dopo le tavole, ci sarebbe una schermata
 * intera in cui non c'è modo di sapere dove si è atterrati.
 *
 * Allineato a sinistra come il resto della pagina, anche se la tavola sotto è
 * centrata: la sinistra è l'asse del sito e la tavola è l'eccezione, centrata
 * perché la sua larghezza dipende dalla proporzione di ogni opera.
 *
 * Più aria sopra che sotto, che è la regola di ogni titolo qui dentro: il
 * bianco che lo separa dal ritorno all'archivio lo presenta, e quello che lo
 * separa dalla tavola lo lega all'opera che nomina.
 */
export default function WorkTitle({ work }: { work: Work }) {
  return (
    <Reveal>
      <h1
        className="display-h1 mt-8 max-w-[30ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance md:mt-12"
        /*
          Il limite di misura non è per i titoli che ci sono —nessuno ci
          arriva— ma per quello che entrerà un giorno: senza, un nome lungo si
          stirerebbe su un'unica riga da 1300px, che a questo corpo non si
          legge, si percorre. `text-balance` distribuisce le righe quando ci
          sono.
        */
      >
        {work.title}
      </h1>
    </Reveal>
  );
}
