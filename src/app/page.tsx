import Link from "next/link";
import Gallery from "@/components/Gallery";
import Reveal from "@/components/Reveal";
import { featured } from "@/data/illustrations";
import { site } from "@/data/site";

export default function Home() {
  return (
    <>
      {/* Portada: poco texto, mucho aire. La obra aparece enseguida. */}
      <section className="shell pt-20 pb-16 md:pt-32 md:pb-24">
        <Reveal>
          <p className="eyebrow">
            {site.role} · {site.location}
          </p>
        </Reveal>

        <Reveal delay={90}>
          <h1 className="mt-6 max-w-4xl font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[1.02] tracking-[-0.02em]">
            Dibujo historias que se
            <span className="italic"> quedan</span> mirando.
          </h1>
        </Reveal>

        <Reveal delay={180}>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink-soft">
            Ilustración editorial, libro infantil y series botánicas. Trabajo en acuarela,
            gouache y lápiz, y termino en digital cuando el encargo lo pide.
          </p>
        </Reveal>

        <Reveal delay={260}>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
            <Link href="/ilustraciones" className="link-underline text-sm" data-active="true">
              Ver ilustraciones
            </Link>
            <a href={`mailto:${site.email}`} className="link-underline text-sm text-ink-soft hover:text-ink">
              Proponer un proyecto
            </a>
          </div>
        </Reveal>
      </section>

      <section className="shell" aria-labelledby="seleccion">
        <Reveal>
          <div className="mb-10 flex items-baseline justify-between border-b border-line pb-5">
            <h2 id="seleccion" className="eyebrow">
              Selección
            </h2>
            <Link href="/ilustraciones" className="link-underline text-sm text-ink-soft hover:text-ink">
              Todas las obras
            </Link>
          </div>
        </Reveal>

        <Gallery items={featured} />
      </section>

      {/* Cierre: una sola invitación clara. */}
      <section className="shell mt-28">
        <Reveal>
          <div className="border-t border-line pt-14">
            <p className="max-w-3xl font-display text-[clamp(1.75rem,3.6vw,2.75rem)] leading-[1.15] tracking-[-0.01em]">
              Tomo encargos de editoriales, revistas y estudios. Contame qué tenés en mente
              y te cuento cómo lo abordaría.
            </p>
            <Link href="/contacto" className="link-underline mt-8 inline-block text-sm" data-active="true">
              Hablemos
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
