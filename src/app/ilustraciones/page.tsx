import type { Metadata } from "next";
import Gallery from "@/components/Gallery";
import Reveal from "@/components/Reveal";
import Stars, { formatAverage } from "@/components/Stars";
import { categories, illustrations } from "@/data/illustrations";
import { getPublicReviews, summarize } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Ilustraciones",
  description: "Obra completa: trabajo editorial, infantil, botánico y personal.",
};

export default async function IlustracionesPage() {
  const reviews = await getPublicReviews();
  const total = summarize(Object.values(reviews).flat());

  return (
    <section className="shell pt-16 pb-8 md:pt-24">
      <Reveal>
        <p className="eyebrow">Obra</p>
        <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-tight tracking-[-0.02em]">
          Ilustraciones
        </h1>
        <p className="mt-6 max-w-xl text-ink-soft">
          Encargos y trabajo personal, de 2023 a hoy. Tocá cualquier imagen para verla completa.
        </p>
        {total.count > 0 && (
          <p className="mt-5 flex items-center gap-3 text-sm text-ink-soft">
            <Stars value={total.average} />
            <span className="tabular-nums">
              {formatAverage(total.average)} de 5 · {total.count}{" "}
              {total.count === 1 ? "reseña" : "reseñas"} de compradores
            </span>
          </p>
        )}
      </Reveal>

      <div className="mt-14">
        <Gallery items={illustrations} filterable categories={categories} reviews={reviews} />
      </div>
    </section>
  );
}
