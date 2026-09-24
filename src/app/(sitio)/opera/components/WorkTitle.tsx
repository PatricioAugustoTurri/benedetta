import Reveal from "@/components/Reveal";
import type { Work } from "@/lib/works";

/**
 * Il nome dell'opera e il suo testo, in cima a tutto.
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
 *
 * **Il testo sta sotto il nome, non sotto le tavole**, su richiesta della
 * cliente. Si legge come l'occhiello di una scheda di catalogo: una o due
 * righe che dicono cos'è il pezzo —per chi, a che cosa è servito— prima di
 * guardarlo. I testi caricati sono brevi, fra una riga e tre, e reggono
 * questo posto; un saggio non lo reggerebbe, e il giorno che arrivasse
 * andrebbe ripensato.
 *
 * Il ritmo è stretto e poi largo: il testo sta vicino al nome perché ne è la
 * continuazione, e la tavola si stacca da tutti e due con il doppio d'aria,
 * perché è un'altra cosa —l'opera, non la sua didascalia—. Quell'aria la
 * mette `.opera`, che sa se la tavola sta sotto o accanto.
 */
export default function WorkTitle({ work }: { work: Work }) {
  return (
    <header className="opera__nome">
      <Reveal>
        <h1
          className="display-h1 max-w-[30ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance"
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

      {/*
        Niente testo, niente paragrafo: un'opera caricata senza descrizione
        —stato che l'admin ammette e segnala— passa dal nome alla tavola
        con l'aria di sempre, senza un buco dove il testo sarebbe stato.
      */}
      {work.description && (
        <Reveal delay={90}>
          <p className="prose-measure mt-4 text-lg leading-relaxed text-pretty text-ink-soft md:mt-5">
            {work.description}
          </p>
        </Reveal>
      )}
    </header>
  );
}
