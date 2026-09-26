import Image from "next/image";
import { contarPezzi, immagineFerma } from "@/lib/video";
import { Work } from "@/lib/works";

/**
 * Il disegno di un'opera nella griglia dell'admin: la placca e la sua scheda.
 *
 * Esiste come pezzo a sé perché adesso si disegna in due posti —la cella della
 * griglia e la copia che segue il dito mentre si trascina— e quei due devono
 * essere la stessa opera, non due versioni simili. Un duplicato comincia a
 * divergere alla prima correzione che qualcuno fa su uno solo dei due.
 *
 * La proporzione è quella del sito, 4:5, e deve seguirla quando cambia: questa
 * schermata esiste per giudicare come si vedrà il pezzo pubblicato, e mostrarlo
 * con un'altra inquadratura la lascia a servire per il contrario di ciò che
 * giustifica la sua forma.
 *
 * Sono tutti `<span>` e non `<div>`: nella cella questo vive dentro un `<a>`,
 * che non ammette contenuto di blocco. Nella copia flottante è indifferente, e
 * la regola la detta il caso che invece obbliga.
 *
 * `enMano` è il pezzo sollevato. Porta il filetto terracotta e il titolo in
 * terracotta, non come decorazione ma perché in questo sistema il colore segna
 * lo stato, e un'opera in aria è uno stato: è quella che si sta spostando.
 * Fuori dalla mano quello stesso filetto lo mette l'hover, e per questo qui si
 * spegne.
 */
export default function PlacaObra({ obra, enMano = false }: { obra: Work; enMano?: boolean }) {
  const portada = obra.image[0];

  return (
    <>
      <span className="relative block overflow-hidden bg-paper-deep">
        {portada ? (
          <Image
            src={immagineFerma(portada)}
            alt={portada.alt}
            width={portada.width}
            height={portada.height}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              enMano ? "" : "group-hover/obra:scale-[1.03]"
            }`}
          />
        ) : (
          /*
            Non dovrebbe succedere —il modulo esige un'immagine— ma se una riga
            è entrata da psql senza nessuna, la griglia lo dice invece di
            disegnare un rettangolo grigio senza spiegazione.
          */
          <span className="flex aspect-[4/5] w-full items-center justify-center text-xs text-accent">
            Senza immagine
          </span>
        )}

        {/*
          Il filetto che segna il pezzo puntato. Va all'interno del bordo con
          `inset` e non come `border`, per non spostare l'immagine di un pixel
          quando compare: il salto rivelerebbe che è uno strato aggiunto.

          Dietro a `@media (hover: hover)` come i controlli, e per lo stesso
          motivo: su uno schermo touch il `:hover` resta attaccato dopo il
          tocco, quindi senza questo un pezzo a riposo restava con il filetto e
          il titolo in terracotta. Il sistema riserva quel colore allo stato;
          attaccato, diventa decorazione.

          In mano il filetto è acceso e non dipende da niente: lì lo stato è
          vero su qualsiasi dispositivo, perché il pezzo è afferrato.
        */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 border transition-colors duration-300 ${
            enMano
              ? "border-accent"
              : "border-accent/0 [@media(hover:hover)]:group-hover/obra:border-accent/60 [@media(hover:hover)]:group-focus-within/obra:border-accent/60"
          }`}
        />
      </span>

      <span className="mt-3 flex items-baseline justify-between gap-4">
        <span
          className={`display-title font-display text-base transition-colors ${
            enMano ? "text-accent" : "[@media(hover:hover)]:group-hover/obra:text-accent"
          }`}
        >
          {obra.title}
        </span>
        <span className="label figures shrink-0">{obra.year}</span>
      </span>

      <span className="mt-0.5 block text-xs text-ink-soft">
        {obra.tecnica}
        <span aria-hidden="true"> · </span>
        <span className="figures">{contarPezzi(obra.image)}</span>

        {/*
          Quello che manca, detto nella griglia. Il testo è l'unico campo che
          può restare vuoto senza che l'opera smetta di salvarsi, quindi è
          l'unico che si può avere a metà senza accorgersene: la pagina
          dell'opera esce senza una riga e niente lo avvisa.

          In terracotta perché il sistema usa quel colore per lo stato, e
          questo è uno stato: non è un errore —l'opera è caricata bene— è
          un'opera a cui manca ancora qualcosa.
        */}
        {!obra.description && (
          <>
            <span aria-hidden="true"> · </span>
            <span className="text-accent">senza testo</span>
          </>
        )}
      </span>
    </>
  );
}
