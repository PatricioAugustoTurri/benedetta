"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { studioFilm } from "@/data/studio";
import { videoLeggero } from "@/lib/video";

type Props = {
  /** Il trattamento —taglio, velo, filtri— lo mette chi lo usa. */
  className?: string;
  priority?: boolean;
};

/**
 * Il video di About, e nient'altro: il file, il suo fotogramma e quando parte.
 *
 * Come si vede lo decide il frontespizio che lo usa come fondo —vedi
 * `StudioOpening` e `.frontespizio` in globals.css—: qui non c'è cornice,
 * velo né filtri, così il trattamento vive in un posto solo.
 *
 * Due stati e nessuno dei due rotto:
 *
 * - **Senza file**: disegna il fotogramma di copertina come immagine. Non un
 *   `<video>` vuoto né un rettangolo nero: finché non c'è un filmato, la cosa
 *   onesta è la foto.
 * - **Con file** (oggi): `<video>` senza audio, in loop, senza controlli.
 *
 * **Parte dallo script, non dall'attributo `autoplay`.** L'attributo sta
 * nell'HTML del server e il browser lo esegue prima che arrivi qualsiasi
 * script: chi ha chiesto meno movimento vedeva partire il video e poi
 * fermarsi. Così invece il primo disegno è sempre il fotogramma fermo, e il
 * movimento arriva solo se è permesso.
 *
 * Sotto `prefers-reduced-motion` non parte e resta sul fotogramma. Niente
 * controlli: è uno sfondo, e una barra di riproduzione sotto il velo di
 * carta sarebbe un controllo che non si legge.
 *
 * Si ferma quando esce dallo schermo e riprende quando torna: un loop che
 * gira sopra la bio mentre si legge consuma batteria per niente.
 */
export default function StudioFilm({ className = "", priority = false }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Se il browser rifiuta la riproduzione automatica —risparmio
    // energetico— resta il fotogramma, che è quello che si vedrebbe comunque.
    const avvia = () => void video.play().catch(() => {});

    if (typeof IntersectionObserver === "undefined") {
      avvia();
      return;
    }

    const osservatore = new IntersectionObserver(
      ([voce]) => (voce.isIntersecting ? avvia() : video.pause()),
      { threshold: 0.2 },
    );
    osservatore.observe(video);
    return () => osservatore.disconnect();
  }, []);

  if (!studioFilm.src) {
    return (
      <Image
        src={studioFilm.poster}
        alt={studioFilm.alt}
        fill
        priority={priority}
        sizes="100vw"
        className={className}
      />
    );
  }

  return (
    <video
      ref={ref}
      src={videoLeggero(studioFilm.src)}
      poster={studioFilm.poster}
      width={studioFilm.width}
      height={studioFilm.height}
      muted
      loop
      playsInline
      // Apre la pagina, quindi si scarica subito; un pezzo più in basso
      // chiederebbe solo i metadati.
      preload={priority ? "auto" : "metadata"}
      aria-label={studioFilm.alt}
      className={className}
    />
  );
}
