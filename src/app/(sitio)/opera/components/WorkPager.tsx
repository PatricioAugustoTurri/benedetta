import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@/components/Icon";
import { neighbours, type Work } from "@/lib/works";

/**
 * Continuare a guardare senza tornare all'archivio.
 *
 * Riceve lo slug e cerca le vicine per conto suo: chi viene prima e chi dopo
 * è affare di questo blocco, e la pagina non ci guadagna niente a saperlo.
 * L'ordine è quello che lei ha dato all'archivio in /admin, lo stesso della
 * griglia: se qui fosse un altro, la paginazione contraddirebbe la pagina da
 * cui si è usciti.
 *
 * Le due colonne si disegnano sempre, anche se una è vuota —la prima opera non
 * ha una precedente e l'ultima non ha una successiva—: così "Successiva" non
 * scivola al centro quando si arriva agli estremi dell'archivio.
 *
 * **Ogni vicina si mostra.** Un nome da solo non dice dove si va: il
 * visitatore è qui per l'opera, non per come si chiama, e "Carnevale andino"
 * non anticipa niente a chi non l'ha vista. Con il pezzo in vista, tirare
 * dritto è una decisione e non una scommessa.
 */
export default async function WorkPager({ slug }: { slug: string }) {
  const { prev, next } = await neighbours(slug);

  return (
    <nav className="mt-14 border-t border-line pt-6 md:mt-20" aria-label="Altre opere">
      {/*
        Il filetto attraversa tutta la misura, perché chiude la pagina; la
        coppia vive in una fascia più stretta e centrata sotto.

        Non è un capriccio di larghezza. Distribuite in mezzo alle 82rem del
        contenitore, le due vicine restavano inchiodate contro i bordi opposti
        con ottocento pixel di carta vuota in mezzo: smettevano di leggersi
        come due opzioni fra cui si sceglie e diventavano due cose sparse che
        per caso condividono la riga. Ristretta, la coppia si vede in un solo
        colpo d'occhio, che è quello che serve per decidere quale seguire.
      */}
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-8">
        <Vecina obra={prev} sentido="anterior" />
        <Vecina obra={next} sentido="siguiente" />
      </div>
    </nav>
  );
}

/**
 * Una delle due colonne. Si disegna anche se non c'è un'opera: è il vuoto che
 * tiene l'altra dalla sua parte della pagina.
 *
 * Le due sono la stessa funzione e non due blocchi quasi uguali, perché erano
 * quasi uguali ed è così che due colonne si staccano: qualcuno corregge la
 * misura di una tavola e lascia l'altra com'era.
 */
function Vecina({ obra, sentido }: { obra: Work | null; sentido: "anterior" | "siguiente" }) {
  if (!obra) return <div />;

  const siguiente = sentido === "siguiente";
  const portada = obra.image[0];

  return (
    <div className={siguiente ? "text-right" : undefined}>
      {/*
        Colonna in flex e ad altezza piena perché le due tavole condividano la
        linea di base in basso. Senza questo, la colonna il cui titolo occupa
        tre righe —sul telefono, dove ognuna misura mezzo schermo— spinge la
        sua tavola più in basso di quella accanto e la coppia resta sbilenca.
        Con `mt-auto` la differenza la assorbe l'aria fra il titolo e la
        tavola, che è dove non si nota.

        `items-end` dal lato della successiva, e non `text-right` e basta: un
        figlio di un contenitore flex non lo allinea il `text-align` del
        genitore, così l'etichetta «Successiva» si stirava per tutta la
        larghezza della colonna e restava a metà strada dal suo stesso titolo.
      */}
      <Link
        href={`/opera/${obra.slug}`}
        className={`group flex h-full flex-col ${siguiente ? "items-end" : "items-start"}`}
      >
        <span className="label inline-flex items-center gap-1.5">
          {!siguiente && <ArrowLeft size={14} className="shrink-0" />}
          {siguiente ? "Successiva" : "Precedente"}
          {siguiente && <ArrowRight size={14} className="shrink-0" />}
        </span>

        <span className="display-section mt-1.5 block font-display text-lg transition-colors group-hover:text-accent">
          {obra.title}
        </span>

        {/*
          La tavola è la cella dell'archivio, non una miniatura nuova: stessa
          proporzione 4:5, stesso fondo di carta profonda, stessa scala di 1.03
          in 900ms quando ci si appoggia. Se l'archivio cambia inquadratura,
          questo cambia con lui —sono lo stesso oggetto, e vederli diversi
          impedirebbe di riconoscere nella vicina il pezzo che poi si
          incontrerà. Che sia lo stesso oggetto è il punto: chi scende fin qui
          riconosce il pezzo come uno dell'archivio e sa cosa succederà se lo
          tocca.

          Ritagliata per lo stesso motivo della griglia: quello che si
          confronta fra un'opera e la vicina è l'opera, non la forma della
          cornice. La tavola in alto, che è l'opera di questa pagina, continua
          a uscire intera e senza ritaglio: lì si viene a guardare, qui a
          scegliere.
        */}
        {portada && (
          <span className="mt-auto block pt-4">
            <span className="block w-28 overflow-hidden bg-paper-deep md:w-36">
              <Image
                src={portada.url}
                alt=""
                width={portada.width}
                height={portada.height}
                sizes="(max-width: 768px) 112px, 144px"
                loading="lazy"
                className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              />
            </span>
          </span>
        )}
      </Link>
    </div>
  );
}
