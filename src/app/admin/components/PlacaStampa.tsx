import Image from "next/image";
import { prezzo, prezzoMinimo } from "@/data/shop";
import type { Prodotto } from "@/lib/prodotti";
import { immagineFerma } from "@/lib/video";

/**
 * Il disegno di una stampa nella griglia dell'admin: la copertina com'è nello
 * Shop —4:5, stesso ritaglio— e due righe sotto.
 *
 * È il fratello di `PlacaObra` e per la stessa ragione esiste da solo: si
 * disegna nella cella e nella copia che segue il dito, e quelle due devono
 * essere la stessa stampa.
 *
 * **La bozza si vede sbiadita.** Nello Shop non esce, e la griglia serve a
 * vedere la parete come la vedrà chi compra: una bozza a piena intensità
 * farebbe giudicare un accostamento che nel sito non c'è. Resta al suo posto,
 * però, perché il posto è suo e lo prende il giorno che si pubblica.
 *
 * Sotto, il listino in breve invece che per esteso: in una cella larga un
 * terzo, «A5 10 € · 20×20 cm 15 € · A4 20 € · A3 30 €» si taglia a metà di un
 * prezzo. Quanti formati e da quanto parte basta per riconoscerla; il resto è
 * nella sua scheda, a un clic.
 */
export default function PlacaStampa({ stampa: p, enMano = false }: { stampa: Prodotto; enMano?: boolean }) {
  const portada = p.image[0];
  const da = prezzoMinimo(p.formati);
  const n = p.formati.length;

  return (
    <>
      <span className="relative block overflow-hidden bg-paper-deep">
        {portada ? (
          <Image
            src={immagineFerma(portada)}
            alt={portada.alt}
            width={portada.width}
            height={portada.height}
            sizes="(max-width: 1024px) 50vw, 25vw"
            className={`aspect-[4/5] w-full object-cover transition-[transform,opacity] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              p.pubblicato ? "" : "opacity-45"
            } ${enMano ? "" : "group-hover/stampa:scale-[1.03]"}`}
          />
        ) : (
          <span className="flex aspect-[4/5] w-full items-center justify-center text-xs text-accent">
            Senza immagine
          </span>
        )}

        {/* Il filetto di `PlacaObra`, con le stesse regole: inset, e dietro a hover:hover. */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 border transition-colors duration-300 ${
            enMano
              ? "border-accent"
              : "border-accent/0 [@media(hover:hover)]:group-hover/stampa:border-accent/60 [@media(hover:hover)]:group-focus-within/stampa:border-accent/60"
          }`}
        />
      </span>

      <span className="mt-2.5 flex items-baseline justify-between gap-3">
        <span
          className={`display-title min-w-0 font-display text-sm leading-snug transition-colors ${
            enMano ? "text-accent" : "text-ink [@media(hover:hover)]:group-hover/stampa:text-accent"
          }`}
        >
          {p.title}
        </span>
        {/*
          Solo la bozza porta uno stato: è quella che chiede di essere
          guardata. Il pubblicato non chiede niente, e lo dice già l'immagine
          a piena intensità.
        */}
        {!p.pubblicato && (
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-ink-faint">
            <span aria-hidden="true" className="block h-1 w-1 rounded-full bg-accent" />
            Bozza
          </span>
        )}
      </span>

      <span className="figures mt-0.5 block text-xs text-ink-faint">
        {da === null ? "Senza formati" : `${n} ${n === 1 ? "formato" : "formati"} · ${n > 1 ? "da " : ""}${prezzo(da)}`}
      </span>
    </>
  );
}
