"use client";

import Image from "next/image";
import { studioFilm } from "@/data/studio";

type Props = {
  /** La caja: proporción, ancho y tope de alto los pone quien lo usa. */
  className?: string;
  priority?: boolean;
};

/**
 * El marco del video del About.
 *
 * Dos estados y ninguno roto:
 *
 * - **Sin archivo** (hoy): dibuja el cuadro de portada como imagen. No un
 *   `<video>` vacío con controles que no controlan nada, ni un rectángulo
 *   negro: mientras no haya película, lo honesto es la foto.
 * - **Con archivo**: `<video>` sin sonido, en loop, que arranca solo. Sin
 *   controles, porque no hay nada que controlar en un loop mudo de unos
 *   segundos: es una imagen que se mueve, no una pieza que se mira.
 *
 * Bajo `prefers-reduced-motion` deja de arrancar solo y le aparecen los
 * controles. Menos movimiento no es prohibir el video: es no imponerlo. Va
 * en un `ref` y no en estado para que no haya un primer pintado con el video
 * ya corriendo que después haya que frenar.
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
