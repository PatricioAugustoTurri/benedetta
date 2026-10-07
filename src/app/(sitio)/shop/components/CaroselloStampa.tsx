"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import VideoOpera from "@/components/VideoOpera";
import { esVideo, immagineFerma } from "@/lib/video";
import type { WorkImage } from "@/lib/works";
import { ApriTavola } from "../../opera/components/Visore";

/**
 * Le immagini di una stampa che ha un mockup: la tavola diventa un carosello,
 * prima l'illustrazione e poi la stessa appesa in una stanza (cliente,
 * 2026-10-07). È la stessa coppia che la griglia mostra al passaggio del
 * mouse, qui messa in fila perché si possa guardare con calma.
 *
 * **Il binario è uno scorrimento nativo con aggancio**, non un carosello
 * finto con trasformazioni: sul telefono il dito lo trascina come qualsiasi
 * pagina, con l'inerzia del sistema; col trackpad lo stesso. Le miniature
 * sotto dicono subito che le immagini sono più di una —un puntino non lo dice
 * a nessuno— e portano a quella che si tocca.
 *
 * **Una cornice sola per tutte.** Il riquadro lo dà l'illustrazione, con la
 * sua proporzione e lo stesso tetto di 78vh della tavola di un'opera, e le
 * altre ci entrano dentro: così scorrere non cambia l'altezza e niente sotto
 * salta. Il mockup arriva già tagliato alle dimensioni della stampa
 * (`mockupComeStampa`), quindi combacia esatto; il `object-cover` resta come
 * rete. L'opera invece non si ritaglia mai, al massimo le resta un po' di
 * carta intorno.
 *
 * Ogni immagine resta un `ApriTavola`: un clic la apre nel visore, che
 * conosce anche il mockup e ci passa con le frecce, intero.
 */
export default function CaroselloStampa({
  titolo,
  immagini,
  mockup,
}: {
  titolo: string;
  immagini: WorkImage[];
  /** L'URL del mockup fra le `immagini`: l'unica che si può ritagliare. */
  mockup: string;
}) {
  const prima = immagini[0];
  const r = prima ? prima.width / prima.height : 4 / 5;
  // Larga quanto la colonna, ma mai più alta di 78vh: la larghezza che
  // quell'altezza dà alla proporzione dell'illustrazione.
  const cornice = { aspectRatio: r, width: `min(100%, calc(78vh * ${r}))` } as CSSProperties;

  const binario = useRef<HTMLDivElement>(null);
  const [attiva, setAttiva] = useState(0);

  // Quale immagine è in vista lo dice lo scorrimento, qualunque cosa l'abbia
  // mosso: il dito, il trackpad, una miniatura o il tab sul pulsante dentro.
  useEffect(() => {
    const el = binario.current;
    if (!el) return;
    const alloScorrere = () => setAttiva(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", alloScorrere, { passive: true });
    return () => el.removeEventListener("scroll", alloScorrere);
  }, []);

  function vai(i: number) {
    const el = binario.current;
    if (!el) return;
    const calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: calmo ? "auto" : "smooth" });
  }

  return (
    <section
      aria-roledescription="carosello"
      aria-label={`${titolo} — immagini`}
      className="opera__tavola flex min-w-0 flex-col items-center md:items-end"
    >
      <div
        ref={binario}
        tabIndex={-1}
        style={cornice}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain bg-paper-deep [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {immagini.map((img, i) => (
          <div
            key={img.url}
            role="group"
            aria-roledescription="immagine"
            aria-label={`${i + 1} di ${immagini.length}`}
            className="h-full w-full shrink-0 snap-start snap-always"
          >
            <ApriTavola indice={i} alt={img.alt} className="h-full w-full">
              {esVideo(img) ? (
                <VideoOpera
                  src={img.url}
                  width={img.width}
                  height={img.height}
                  alt={img.alt}
                  className="block h-full w-full object-contain"
                />
              ) : (
                <Image
                  src={img.url}
                  alt={img.alt}
                  width={img.width}
                  height={img.height}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 50rem"
                  preload={i === 0}
                  loading={i === 0 ? undefined : "lazy"}
                  draggable={false}
                  className={`block h-full w-full ${img.url === mockup ? "object-cover" : "object-contain"}`}
                />
              )}
            </ApriTavola>
          </div>
        ))}
      </div>

      {/*
        Le miniature: lo stesso ritaglio 4:5 della griglia, in piccolo.
        Quella in vista è piena e porta un filetto d'inchiostro sotto; le
        altre stanno un passo indietro, come le righe non scelte di un
        elenco. Da tablet in su si allineano a destra, sotto il bordo della
        tavola.
      */}
      <div style={{ width: cornice.width }} className="mt-4 flex gap-2 md:justify-end">
        {immagini.map((img, i) => (
          <button
            key={img.url}
            type="button"
            onClick={() => vai(i)}
            aria-label={`Mostra l'immagine ${i + 1} di ${immagini.length}${img.alt ? `: ${img.alt}` : ""}`}
            aria-current={i === attiva ? "true" : undefined}
            data-attiva={i === attiva}
            className="group relative block w-12 pb-2 opacity-55 transition-opacity duration-300 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent data-[attiva=true]:opacity-100"
          >
            <Image
              src={immagineFerma(img)}
              alt=""
              width={img.width}
              height={img.height}
              sizes="48px"
              className="block aspect-[4/5] w-full bg-paper-deep object-cover"
            />
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-ink transition-transform duration-[400ms] ease-[var(--ease-out-soft)] group-data-[attiva=true]:scale-x-100"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
