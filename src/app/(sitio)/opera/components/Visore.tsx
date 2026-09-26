"use client";

import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowLeft, ArrowRight, Close, Expand } from "@/components/Icon";
import VideoOpera from "@/components/VideoOpera";
import { esVideo } from "@/lib/video";
import type { Work } from "@/lib/works";

/**
 * Il visore delle tavole: ogni immagine di un'opera si apre a tutto schermo.
 *
 * **Su carta, non su nero.** Il nero è il riflesso di ogni galleria, ma questo
 * sistema ha un solo fondo e una ragione per tenerlo: un fondo che cambia
 * colore cambia come si legge l'illustrazione. L'opera ingrandita sta sullo
 * stesso foglio su cui la si è vista, solo più vicina.
 *
 * È un `<dialog>` nativo aperto con `showModal()`: il fuoco resta dentro, il
 * resto della pagina diventa inerte, Esc chiude, e chiudendo il fuoco torna
 * all'immagine da cui si era partiti. Si scorre con le frecce —a schermo e da
 * tastiera—, sul telefono anche col dito, e un tocco sulla carta intorno
 * all'opera chiude.
 */

type Immagine = Work["image"][number];

const Apri = createContext<(indice: number, da: HTMLElement) => void>(() => {});

export default function Visore({
  titolo,
  immagini,
  children,
}: {
  titolo: string;
  immagini: Immagine[];
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const origine = useRef<HTMLElement | null>(null);
  const tocco = useRef<number | null>(null);
  const [indice, setIndice] = useState<number | null>(null);

  const apri = useCallback((i: number, da: HTMLElement) => {
    origine.current = da;
    setIndice(i);
    dialog.current?.showModal();
    document.documentElement.style.overflow = "hidden";
  }, []);

  const chiudi = useCallback(() => dialog.current?.close(), []);

  const vai = useCallback(
    (passo: number) =>
      setIndice((i) => (i === null ? i : Math.min(Math.max(i + passo, 0), immagini.length - 1))),
    [immagini.length],
  );

  // `close` arriva sia dal pulsante sia da Esc: un solo punto che rimette la
  // pagina com'era.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const alChiudere = () => {
      setIndice(null);
      document.documentElement.style.overflow = "";
      origine.current?.focus({ preventScroll: true });
    };
    el.addEventListener("close", alChiudere);
    return () => el.removeEventListener("close", alChiudere);
  }, []);

  const img = indice === null ? null : immagini[indice];
  const tante = immagini.length > 1;

  return (
    <Apri.Provider value={apri}>
      {children}

      <dialog
        ref={dialog}
        className="visore"
        aria-label={`${titolo} — immagini`}
        onKeyDown={(e) => {
          // Con il fuoco sul video le frecce spostano il punto di
          // riproduzione: sono sue, e cambiare tavola nello stesso momento
          // gliele ruberebbe.
          if (e.target instanceof HTMLVideoElement) return;
          if (e.key === "ArrowLeft") vai(-1);
          if (e.key === "ArrowRight") vai(1);
        }}
      >
        {img && indice !== null && (
          <div className="visore__telaio">
            <header className="visore__testa">
              <p className="truncate text-sm text-ink">{titolo}</p>
              <button
                type="button"
                onClick={chiudi}
                className="visore__tasto -mr-2.5"
                aria-label="Chiudi"
              >
                <Close size={22} />
              </button>
            </header>

            {/*
              La scena: tutto lo spazio che resta, con l'opera intera dentro.
              Un clic sulla carta —non sull'opera— chiude; lo scorrimento col
              dito si misura qui, solo per i tocchi, così il mouse non sposta
              niente per sbaglio.
            */}
            <div
              className="visore__scena"
              onClick={(e) => {
                if (e.target === e.currentTarget) chiudi();
              }}
              onPointerDown={(e) => {
                // Sul video il dito può star trascinando la sua barra: quello
                // non è un gesto per cambiare tavola.
                const suVideo = e.target instanceof HTMLVideoElement;
                tocco.current = e.pointerType === "mouse" || suVideo ? null : e.clientX;
              }}
              onPointerUp={(e) => {
                if (tocco.current === null) return;
                const dx = e.clientX - tocco.current;
                tocco.current = null;
                if (Math.abs(dx) > 48) vai(dx < 0 ? 1 : -1);
              }}
            >
              {esVideo(img) ? (
                <VideoOpera
                  key={img.url}
                  src={img.url}
                  width={img.width}
                  height={img.height}
                  alt={img.alt}
                  controlli
                  className="visore__opera"
                />
              ) : (
                <Image
                  key={img.url}
                  src={img.url}
                  alt={img.alt}
                  width={img.width}
                  height={img.height}
                  sizes="100vw"
                  className="visore__opera"
                  draggable={false}
                />
              )}
            </div>

            <footer className="visore__piede">
              {tante && (
                <>
                  <button
                    type="button"
                    onClick={() => vai(-1)}
                    disabled={indice === 0}
                    className="visore__tasto"
                    aria-label="Immagine precedente"
                  >
                    <ArrowLeft size={22} />
                  </button>
                  <p className="figures label min-w-[4.5rem] text-center" aria-live="polite">
                    <span className="sr-only">Immagine </span>
                    {indice + 1}
                    <span aria-hidden="true"> / </span>
                    <span className="sr-only"> di </span>
                    {immagini.length}
                  </p>
                  <button
                    type="button"
                    onClick={() => vai(1)}
                    disabled={indice === immagini.length - 1}
                    className="visore__tasto"
                    aria-label="Immagine successiva"
                  >
                    <ArrowRight size={22} />
                  </button>
                </>
              )}
            </footer>
          </div>
        )}
      </dialog>
    </Apri.Provider>
  );
}

/**
 * L'immagine sulla pagina, fatta pulsante: tutta la tavola apre il visore, e
 * il segno nell'angolo in basso a destra dice che si può. È un controllo solo
 * —il segno sta dentro il pulsante e non si annuncia da solo—, così la
 * tastiera trova una fermata per immagine, non due.
 */
export function ApriTavola({
  indice,
  alt,
  className = "",
  children,
}: {
  indice: number;
  alt: string;
  className?: string;
  children: ReactNode;
}) {
  const apri = useContext(Apri);

  return (
    <button
      type="button"
      onClick={(e) => apri(indice, e.currentTarget)}
      aria-haspopup="dialog"
      aria-label={alt ? `Ingrandisci: ${alt}` : `Ingrandisci l'immagine ${indice + 1}`}
      className={`tavola-apri group relative block max-w-full cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent ${className}`}
    >
      {children}
      <span aria-hidden="true" className="tavola-apri__segno">
        <Expand size={16} />
      </span>
    </button>
  );
}
