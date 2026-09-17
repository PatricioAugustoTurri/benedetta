"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import type { Illustration } from "@/data/illustrations";

type Props = {
  items: Illustration[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

/**
 * Visor a pantalla completa. Navegación con flechas, cierre con Escape,
 * y el foco vuelve a donde estaba al cerrar.
 */
export default function Lightbox({ items, index, onClose, onNavigate }: Props) {
  const item = items[index];
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
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

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
    </div>
  );
}
