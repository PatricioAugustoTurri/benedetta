import Image from "next/image";
import Link from "next/link";
import VideoOpera from "@/components/VideoOpera";
import { prezzo, prezzoMinimo, prodottoHref } from "@/data/shop";
import { site } from "@/data/site";
import type { Prodotto } from "@/lib/prodotti";
import { esVideo } from "@/lib/video";

/**
 * Le stampe, in griglia.
 *
 * È la cella dell'archivio —stesso ritaglio 4:5, stesso zoom lento al
 * passaggio— con una cosa che l'archivio ha tolto di proposito: la parola.
 * Là la griglia è una parete di opere e il nome sta nella pagina; qui il nome
 * e la cifra sono parte di quello che si sceglie, e farli cercare in un'altra
 * pagina sarebbe nascondere il prezzo.
 *
 * Per questo anche l'aria cambia: il passo dell'archivio è di pochi pixel
 * perché le opere si leggano insieme, qui ogni cella porta due righe sotto e
 * ha bisogno di un margine che le tenga con la propria immagine.
 *
 * Ogni stampa dice «da 10 €», il prezzo più basso: il formato si sceglie
 * nella pagina.
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
    <ul className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-4 md:gap-x-6 md:gap-y-12 lg:grid-cols-3">
      {prodotti.map((p, i) => {
        const portada = p.image[0];
        const da = prezzoMinimo(p.formati);
        return (
          <li key={p.id}>
            <Link href={prodottoHref(p)} className="group block focus-visible:outline-none">
              <span className="block overflow-hidden bg-paper-deep group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[3px] group-focus-visible:outline-accent">
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
                    <Image
                      src={portada.url}
                      alt={`${p.title} — ${site.signature}`}
                      width={portada.width}
                      height={portada.height}
                      sizes="(max-width: 1024px) 50vw, 33vw"
                      priority={i < eager}
                      loading={i < eager ? undefined : "lazy"}
                      className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                    />
                  ))}
              </span>

              {/*
                Nome e prezzo sulla stessa riga quando c'è posto, e il prezzo a
                destra in cifre tabulari: è come si legge un listino. Sul
                telefono, con due colonne strette, il prezzo scende sotto il
                nome invece di spezzarlo.
              */}
              <span className="mt-3 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <span className="text-[0.9375rem] leading-snug text-ink transition-colors group-hover:text-accent">
                  {p.title}
                </span>
                {da !== null && (
                  <span className="figures shrink-0 text-sm text-ink-soft">
                    {p.formati.length > 1 ? "da " : ""}
                    {prezzo(da)}
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
