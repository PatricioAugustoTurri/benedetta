"use client";

import { useEffect, useRef } from "react";
import { fotogramma, videoLeggero } from "@/lib/video";

/**
 * Un video dell'opera, dove un'immagine avrebbe messo un `<Image>`.
 *
 * **Si comporta come una tavola che si muove, non come un lettore.** Senza
 * audio, in loop, senza controlli: nella griglia e nella pagina dell'opera
 * sta al posto di un'illustrazione, e un lettore con la sua barra lo
 * trasformerebbe in un'altra cosa. I controlli arrivano solo nel visore
 * (`controlli`), che è dove si va apposta a guardarlo e dove si può alzare
 * l'audio, se ce l'ha.
 *
 * **Parte solo quando si vede.** Un archivio con sei video che girano tutti
 * insieme fuori schermo consuma batteria e banda per niente; qui ognuno parte
 * quando entra nello schermo e si ferma quando esce.
 *
 * **Chi ha chiesto meno movimento vede il fotogramma fermo.** È il piano che
 * il sito già rispetta ovunque: il video resta sul suo fotogramma di
 * copertina e non parte da solo. Nel visore ha i controlli, quindi farlo
 * partire resta una scelta sua.
 *
 * Il fotogramma è sempre lì come `poster`: è quello che si vede mentre il
 * file carica, e quello che resta se non parte.
 */
export default function VideoOpera({
  src,
  width,
  height,
  alt,
  controlli = false,
  className = "",
}: {
  src: string;
  width: number;
  height: number;
  alt: string;
  controlli?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Il browser può rifiutare la riproduzione automatica —risparmio
    // energetico, impostazioni—: in quel caso resta il fotogramma, che è
    // esattamente quello che si vedrebbe con un'immagine.
    const avvia = () => void video.play().catch(() => {});

    if (typeof IntersectionObserver === "undefined") {
      avvia();
      return;
    }

    const osservatore = new IntersectionObserver(
      ([voce]) => {
        if (voce.isIntersecting) avvia();
        else video.pause();
      },
      { threshold: 0.25 },
    );
    osservatore.observe(video);
    return () => osservatore.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={videoLeggero(src)}
      // Anche il fotogramma esce compresso e alla stessa misura del video.
      poster={fotogramma(videoLeggero(src))}
      width={width}
      height={height}
      muted
      loop
      playsInline
      preload="metadata"
      controls={controlli}
      // Senza testo alternativo il video è decorazione —come la copertina
      // nella griglia, che nomina già il link—, e si nasconde ai lettori di
      // schermo invece di annunciarsi come «video» senza nome.
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={className}
    />
  );
}
