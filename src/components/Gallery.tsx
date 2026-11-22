"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import Lightbox from "@/components/Lightbox";
import Stars from "@/components/Stars";
import type { Category, Illustration } from "@/data/illustrations";
import type { PublicReview } from "@/lib/review-types";

type Props = {
  items: Illustration[];
  /** Muestra los botones para filtrar por categoría. */
  filterable?: boolean;
  categories?: Category[];
  /** Reseñas de compradores, por slug de obra. */
  reviews?: Record<string, PublicReview[]>;
};

export default function Gallery({ items, filterable = false, categories = [], reviews = {} }: Props) {
  const [active, setActive] = useState<Category | "Todo">("Todo");
  const [open, setOpen] = useState<number | null>(null);

  const shown = useMemo(
    () => (active === "Todo" ? items : items.filter((i) => i.category === active)),
    [items, active],
  );

  return (
    <>
      {filterable && categories.length > 0 && (
        <div className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line pb-5">
          {(["Todo", ...categories] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setActive(c);
              }}
              data-active={active === c}
              aria-pressed={active === c}
              className="link-underline text-sm text-ink-faint transition-colors hover:text-ink data-[active=true]:text-ink"
            >
              {c}
            </button>
          ))}
          <span className="ml-auto text-xs tabular-nums text-ink-faint">
            {shown.length} {shown.length === 1 ? "obra" : "obras"}
          </span>
        </div>
      )}

      {/*
        Masonry con columnas CSS: respeta la proporción de cada obra
        sin recortes y sin dejar huecos entre piezas de distinto alto.
      */}
      <ul className="columns-1 gap-6 sm:columns-2 md:gap-8 xl:columns-3">
        {shown.map((item, i) => (
          <li key={item.slug} className="mb-6 break-inside-avoid md:mb-8">
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group block w-full text-left"
              aria-label={`Ampliar ${item.title}`}
            >
              <span className="relative block overflow-hidden bg-paper-deep">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  loading={i < 3 ? "eager" : "lazy"}
                  className="w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                />
              </span>

              <span className="mt-3 flex items-baseline justify-between gap-4">
                <span className="font-display text-base tracking-tight">{item.title}</span>
                <span className="text-xs tabular-nums text-ink-faint">{item.year}</span>
              </span>
              <span className="mt-0.5 block text-xs text-ink-soft">
                {item.client ?? item.category} · {item.medium}
              </span>
              <RatingLine reviews={reviews[item.slug]} />
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <Lightbox
          items={shown}
          reviews={reviews}
          index={open}
          onClose={() => setOpen(null)}
          onNavigate={setOpen}
        />
      )}
    </>
  );
}

function RatingLine({ reviews }: { reviews?: PublicReview[] }) {
  if (!reviews?.length) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return (
    <span className="mt-1.5 flex items-center gap-2 text-[0.8125rem]">
      <Stars value={avg} />
      <span className="text-xs tabular-nums text-ink-faint">
        {reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"}
      </span>
    </span>
  );
}
