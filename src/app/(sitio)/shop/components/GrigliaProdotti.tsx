import type { CSSProperties } from "react";
import Image from "@/components/Immagine";
import Link from "next/link";
import ImmagineCopertina from "@/components/ImmagineCopertina";
import VideoOpera from "@/components/VideoOpera";
import { prezzo, prezzoMinimo, prodottoHref } from "@/data/shop";
import { site } from "@/data/site";
import { esaurito, type Prodotto } from "@/lib/prodotti";
import { esVideo } from "@/lib/video";

/**
 * Le stampe, in griglia: solo le immagini.
 *
 * È la cella dell'archivio —stesso ritaglio 4:5, stesso zoom lento al
 * passaggio, stesso passo di pochi pixel— e come l'archivio non disegna una
 * parola. Prima ogni stampa portava sotto il nome e «da 10 €»; la cliente li ha
 * tolti (2026-10-07): nella griglia si sceglie con gli occhi, e nome, formati e
 * prezzo stanno nella pagina della stampa, a un clic.
 *
 * Tolto il testo se ne va anche l'aria che lo accompagnava: le righe larghe
 * esistevano per tenere ogni didascalia con la sua immagine. Senza, il passo
 * torna quello dell'archivio e le stampe si leggono insieme, come una parete.
 *
 * Il nome e il prezzo restano per chi non vede la griglia: li dice il link,
 * come nell'archivio, perché una fila di immagini senza nome non si può
 * scegliere a orecchio.
 *
 * Una stampa con mockup lo tiene sopra la copertina, invisibile, e lo mostra
 * quando il mouse ci si ferma un secondo: la regia è in globals.css
 * (`.stampa-mockup`). È decorativo per chi usa un lettore di schermo —il nome
 * della stampa lo dice già il link—, quindi alt vuoto.
 *
 * **L'unica parola che la griglia si concede è «Esaurito».** Non è una
 * didascalia ma uno stato: chi sceglie con gli occhi deve sapere, prima di
 * aprirla, che quella copertina non si può comprare. Sta in un angolo, su un
 * ritaglio di carta, e la copertina resta intera.
 *
 * **Mentre la copertina carica, la cella è il suo scheletro**: lo stesso
 * ritaglio 4:5 in carta più scura, con una luce che la attraversa e passa
 * da una cella all'altra in diagonale (`--i`). Chi apre una categoria vede
 * subito quante stampe ci sono e dove andranno. La regia è in globals.css
 * (`.copertina-attesa`).
 */
export default function GrigliaProdotti({
  prodotti,
  eager = 0,
}: {
  prodotti: Prodotto[];
  /** Quante copertine caricare subito: quelle che stanno nella prima schermata. */
  eager?: number;
}) {
  return (
    <ul className="grid grid-cols-2 gap-1 sm:gap-1.5 md:gap-2 lg:grid-cols-3">
      {prodotti.map((p, i) => {
        const portada = p.image[0];
        const da = prezzoMinimo(p.formati);
        const finito = esaurito(p);
        return (
          <li key={p.id}>
            <Link
              href={prodottoHref(p)}
              aria-label={
                (da === null
                  ? p.title
                  : `${p.title}, ${p.formati.length > 1 ? "da " : ""}${prezzo(da)}`) + (finito ? ", esaurito" : "")
              }
              className="stampa-cella group block focus-visible:outline-none"
            >
              <span
                style={{ "--i": i % 6 } as CSSProperties}
                className="copertina-attesa relative block overflow-hidden bg-paper-deep group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[3px] group-focus-visible:outline-accent"
              >
                {portada &&
                  (esVideo(portada) ? (
                    <VideoOpera
                      src={portada.url}
                      width={portada.width}
                      height={portada.height}
                      alt=""
                      className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                    />
                  ) : (
                    <ImmagineCopertina
                      src={portada.url}
                      alt={`${p.title} — ${site.signature}`}
                      width={portada.width}
                      height={portada.height}
                      sizes="(max-width: 1024px) 50vw, 33vw"
                      priority={i < eager}
                      loading={i < eager ? undefined : "lazy"}
                      className="aspect-[4/5] w-full object-cover group-hover:scale-[1.03]"
                    />
                  ))}
                {p.mockup && (
                  <Image
                    src={p.mockup.url}
                    alt=""
                    width={p.mockup.width}
                    height={p.mockup.height}
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                    className="stampa-mockup absolute inset-0 h-full w-full object-cover"
                  />
                )}
                {finito && (
                  <span
                    aria-hidden="true"
                    className="label absolute bottom-2 left-2 bg-paper px-2 py-1 text-ink-soft sm:bottom-3 sm:left-3"
                  >
                    Esaurito
                  </span>
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
