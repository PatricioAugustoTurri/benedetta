import type { Metadata } from "next";
import Gallery from "@/components/Gallery";
import Reveal from "@/components/Reveal";
import { categories, illustrations } from "@/data/illustrations";

export const metadata: Metadata = {
  title: "Ilustraciones",
  description: "Obra completa: trabajo editorial, infantil, botánico y personal.",
};

export default function IlustracionesPage() {
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
      </Reveal>

      <div className="mt-14">
        <Gallery items={illustrations} filterable categories={categories} />
      </div>
    </section>
  );
}
