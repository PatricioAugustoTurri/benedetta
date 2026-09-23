"use client";

import Image from "next/image";
import { studioFilm } from "@/data/studio";

type Props = {
  /** Il riquadro: proporzione, larghezza e altezza massima li mette chi lo usa. */
  className?: string;
  priority?: boolean;
};

/**
 * La cornice del video di About.
 *
 * Due stati e nessuno dei due rotto:
 *
 * - **Senza file** (oggi): disegna il fotogramma di copertina come immagine.
 *   Non un `<video>` vuoto con controlli che non controllano niente, né un
 *   rettangolo nero: finché non c'è un filmato, la cosa onesta è la foto.
 * - **Con file**: `<video>` senza audio, in loop, che parte da solo. Senza
 *   controlli, perché non c'è niente da controllare in un loop muto di pochi
 *   secondi: è un'immagine che si muove, non un pezzo che si guarda.
 *
 * Sotto `prefers-reduced-motion` smette di partire da solo e gli compaiono i
 * controlli. Meno movimento non è vietare il video: è non imporlo. Va in un
 * `ref` e non nello stato perché non ci sia un primo disegno con il video già
 * in corsa da dover poi fermare.
 */
export default function StudioFilm({ className = "", priority = false }: Props) {
  const frame = `block bg-paper-deep object-cover ${className}`;

  if (!studioFilm.src) {
    return (
      <Image
        src={studioFilm.poster}
        alt={studioFilm.alt}
        width={800}
        height={1000}
        priority={priority}
        sizes="100vw"
        className={frame}
      />
    );
  }

  return (
    <video
      ref={(el) => {
        if (!el) return;
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        el.autoplay = false;
        el.controls = true;
        el.pause();
      }}
      poster={studioFilm.poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={studioFilm.alt}
      className={frame}
    >
      <source src={studioFilm.src} />
    </video>
  );
}
