import Image from "next/image";
import Link from "next/link";
import { site } from "@/data/site";
import type { Work } from "@/lib/works";

/**
 * L'opera: griglia simmetrica di tre colonne.
 *
 * Piatta, senza raggruppamenti. È arrivata a essere divisa in fasce per anno
 * —con l'anno su una costola fissa e il resto dell'archivio che si attenuava
 * quando ci si appoggiava su un pezzo— ed è stata tolta su richiesta della
 * cliente. L'anno non è sparito: è tornato nella scheda di ogni opera,
 * accanto al titolo, che è dove stava prima.
 *
 * **Solo opera, a ogni larghezza.** Non c'è titolo, né anno, né tecnica: la
 * griglia non disegna una parola. È arrivata ad avere tutte e tre le cose e se
 * ne sono andate una alla volta, su richiesta della cliente, fino a restare
 * questo. Quello che ogni opera è si legge aprendola; qui la si guarda.
 *
 * **Le celle sono verticali a ogni larghezza**, in 4:5. C'è stata una cucitura
 * a 640px —mosaico verticale sotto, quadrato sopra— ed è stata tolta su
 * richiesta della cliente: la stessa opera si vedeva con due inquadrature
 * diverse a seconda dello schermo da cui la si guardava.
 *
 * Il ritaglio è reale ed è stato scelto sapendolo. L'opera di questo archivio
 * è quadrata, quindi il quadrato non ritagliava niente e il 4:5 si mangia un
 * quinto della larghezza di ogni pezzo, adesso su tutti gli schermi e non solo
 * sul telefono. Per questo resta 4:5 e non 3:4, che ne mangerebbe un quarto: è
 * il gradino più morbido che si legga ancora come verticale. Chi la vuole
 * vedere intera la apre, che è dove la tavola esce senza ritaglio.
 *
 * Riceve le opere invece di cercarle: così la home decide una volta sola cosa
 * chiedere al database, e questo componente resta puro disegno.
 *
 * Movimento: ogni pezzo entra dalla sua colonna —quella di sinistra da
 * sinistra, quella di mezzo dal basso, quella di destra da destra— e si posa
 * scalando da 0.965 a 1. La direzione la dà la posizione nella griglia, non il
 * caso, e la risolve `globals.css` con gli stessi punti di rottura che
 * costruiscono la griglia: qui non si può sapere in che colonna cade un pezzo
 * senza sapere la larghezza dello schermo, e questo componente gira sul
 * server.
 */
export default function Works({ works }: { works: Work[] }) {
  /*
    L'archivio vuoto deve dire qualcosa. Senza questo, una tabella senza righe
    disegna una lista vuota e la home resta con una fascia di carta bianca fra
    l'header e il footer: non si legge come «non c'è ancora opera», si legge
    come una pagina rotta.

    Lo dice nella voce del sito, perché questo lo vede il visitatore —non è la
    schermata di lavoro— e non invita a fare niente: l'archivio sta per
    aprirsi, non c'è niente da chiedere a chi è arrivato.
  */
  if (works.length === 0) {
    return (
      <div className="shell flex min-h-[46vh] flex-col justify-center pt-8 pb-8 md:pt-14">
        <p className="prose-measure text-lg leading-relaxed text-ink-soft">
          L&apos;archivio è in preparazione.
        </p>
        <p className="prose-measure mt-3 text-sm text-ink-faint">
          Le prime opere arrivano presto. Nel frattempo, scrivimi:{" "}
          <a
            href={`mailto:${site.email}`}
            className="link-underline text-ink-soft transition-colors hover:text-ink"
          >
            {site.email}
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="shell pt-8 pb-8 md:pt-14">
      {/*
        Due colonne già dal telefono, tre da 1024px. Mai una: un archivio a
        colonna singola sul telefono obbliga a un gesto per opera per vedere la
        successiva, e quello che fa leggere questo come un archivio —e non come
        un'opera dietro l'altra— è vederne parecchie insieme.

        L'aria fra le opere non separa più: unisce. Con la scheda al suo posto,
        ogni cella era un record e il bianco intorno era quello che la rendeva
        un pezzo diverso da quello accanto; tolta la scheda, quello stesso
        bianco lascia le opere a galleggiare sciolte sulla carta. Le due
        decisioni sono una sola: non si può togliere il testo e conservare
        l'aria che lo accompagnava.

        Per questo il passo è lo stesso a ogni larghezza, misurato in
        proporzione e non in pixel: circa il 2% della larghezza della cella su
        qualsiasi schermo —4px sui 169px del telefono, 8px sui 373px del
        desktop—. È il minimo che impedisce a due opere di fondo chiaro di
        fondersi in un'unica macchia, e con quello la griglia si legge come una
        parete di opere.
      */}
      <ul className="grid grid-cols-2 gap-1 sm:gap-1.5 md:gap-2 lg:grid-cols-3">
        {works.map((item, i) => {
          const portada = item.image[0];
          if (!portada) return null;

          const eager = i < 3;

          return (
            <li key={item.slug} className="rivista-piece">
              {/*
                Il nome accessibile lo mette il link e non l'`alt`
                dell'immagine. È l'unica cosa che nomina l'opera in questa
                pagina: la griglia non disegna una sola parola, quindi senza
                questo si annuncerebbe come una sfilza di descrizioni di
                illustrazioni senza un solo nome. La descrizione del pezzo
                resta per la sua pagina, che è dove l'immagine è il contenuto e
                non un accesso.
              */}
              <Link
                href={`/opera/${item.slug}`}
                aria-label={`${item.title}, ${item.year}`}
                className="group block focus-visible:outline-none"
              >
                {/* Il fuoco si disegna sull'immagine, che è quello che il visitatore guarda. */}
                <span className="block overflow-hidden bg-paper-deep group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[3px] group-focus-visible:outline-accent">
                  <Image
                    src={portada.url}
                    alt=""
                    width={portada.width}
                    height={portada.height}
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    priority={eager}
                    loading={eager ? undefined : "lazy"}
                    className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />
                </span>

              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
