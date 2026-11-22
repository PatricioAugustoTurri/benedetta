"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Stars, { formatAverage } from "@/components/Stars";
import type { Illustration } from "@/data/illustrations";
import type { PublicReview } from "@/lib/review-types";

type Props = {
  items: Illustration[];
  index: number;
  reviews?: Record<string, PublicReview[]>;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

/**
 * Visor a pantalla completa. Navegación con flechas, cierre con Escape,
 * y el foco vuelve a donde estaba al cerrar.
 */
export default function Lightbox({ items, index, reviews = {}, onClose, onNavigate }: Props) {
  const item = items[index];
  const itemReviews = item ? reviews[item.slug] ?? [] : [];
  const [panelRequested, setPanelOpen] = useState(false);
  // Mientras el panel está abierto no se puede cambiar de obra, pero por las dudas
  // nunca se muestra vacío.
  const panelOpen = panelRequested && itemReviews.length > 0;
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  const go = useCallback(
    (delta: number) => {
      onNavigate((index + delta + items.length) % items.length);
    },
    [index, items.length, onNavigate],
  );

  useEffect(() => {
    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      restoreFocusTo.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Con el panel de reseñas abierto, Escape cierra sólo el panel.
      if (e.key === "Escape") {
        if (panelOpen) setPanelOpen(false);
        else onClose();
      } else if (panelOpen) return;
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose, panelOpen]);

  useEffect(() => {
    if (panelOpen) panelRef.current?.focus();
  }, [panelOpen]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} — ${index + 1} de ${items.length}`}
      className="fixed inset-0 z-50 flex flex-col bg-paper"
    >
      <div className="flex items-center justify-between px-5 py-4 md:px-8">
        <p className="text-xs tabular-nums text-ink-faint">
          {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="link-underline text-sm text-ink-soft hover:text-ink"
        >
          Cerrar
        </button>
      </div>

      {/* La imagen manda: ocupa todo el alto disponible sin recortarse. */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-5 md:px-20">
        <Image
          key={item.slug}
          src={item.src}
          alt={item.alt}
          width={item.width}
          height={item.height}
          sizes="(max-width: 768px) 90vw, 70vw"
          priority
          className="max-h-full w-auto object-contain"
        />

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Ilustración anterior"
          className="group absolute left-0 top-0 hidden h-full w-16 items-center justify-center md:flex"
        >
          <span className="text-2xl text-ink-faint transition-colors group-hover:text-ink" aria-hidden="true">
            ←
          </span>
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Ilustración siguiente"
          className="group absolute right-0 top-0 hidden h-full w-16 items-center justify-center md:flex"
        >
          <span className="text-2xl text-ink-faint transition-colors group-hover:text-ink" aria-hidden="true">
            →
          </span>
        </button>
      </div>

      <div className="flex items-end justify-between gap-6 px-5 py-6 md:px-8">
        <div>
          <h2 className="font-display text-xl tracking-tight md:text-2xl">{item.title}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {[item.client, item.medium, item.year].filter(Boolean).join(" · ")}
          </p>
          {itemReviews.length > 0 && (
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              aria-expanded={panelOpen}
              aria-controls="panel-resenas"
              className="group mt-2 flex items-center gap-2 text-sm"
            >
              <Stars value={average(itemReviews)} />
              <span className="link-underline text-ink-soft group-hover:text-ink">
                {formatAverage(average(itemReviews))} · {itemReviews.length}{" "}
                {itemReviews.length === 1 ? "reseña" : "reseñas"}
              </span>
            </button>
          )}
        </div>

        {/* En móvil los botones van acá, donde llega el pulgar. */}
        <div className="flex gap-6 md:hidden">
          <button type="button" onClick={() => go(-1)} aria-label="Anterior" className="text-xl">
            ←
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Siguiente" className="text-xl">
            →
          </button>
        </div>
      </div>

      {panelOpen && (
        <>
          <button
            type="button"
            aria-label="Cerrar reseñas"
            tabIndex={-1}
            onClick={() => setPanelOpen(false)}
            className="absolute inset-0 z-10 cursor-default bg-ink/10"
          />
          <div
            id="panel-resenas"
            ref={panelRef}
            tabIndex={-1}
            role="region"
            aria-label={`Reseñas de ${item.title}`}
            className="absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l border-line bg-paper outline-none sm:max-w-md"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <p className="eyebrow">Reseñas de compradores</p>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="link-underline text-sm text-ink-soft hover:text-ink"
              >
                Volver
              </button>
            </div>
            <div className="px-6 pt-6">
              <p className="font-display text-lg tracking-tight">{item.title}</p>
              <p className="mt-2 flex items-center gap-3">
                <Stars value={average(itemReviews)} className="text-lg" />
                <span className="text-sm tabular-nums text-ink-soft">
                  {formatAverage(average(itemReviews))} de 5
                </span>
              </p>
            </div>
            <ul className="mt-6 flex-1 divide-y divide-line overflow-y-auto border-t border-line px-6">
              {itemReviews.map((r) => (
                <ReviewItem key={r.id} review={r} />
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function average(list: PublicReview[]) {
  return list.reduce((s, r) => s + r.rating, 0) / list.length;
}

export function ReviewItem({ review }: { review: PublicReview }) {
  return (
    <li className="py-5">
      <div className="flex items-center justify-between gap-4">
        <Stars value={review.rating} className="text-sm" />
        <time dateTime={review.createdAt} className="text-xs text-ink-faint">
          {new Date(review.createdAt).toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
        </time>
      </div>
      <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{review.comment}</p>
      <p className="mt-2 text-sm">{review.name}</p>
    </li>
  );
}
