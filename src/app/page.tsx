import Link from "next/link";
import Gallery from "@/components/Gallery";
import Reveal from "@/components/Reveal";
import Stars, { formatAverage } from "@/components/Stars";
import { featured } from "@/data/illustrations";
import { site } from "@/data/site";
import { getPublicReviews, illustrationBySlug, summarize } from "@/lib/reviews";

export default async function Home() {
  const reviews = await getPublicReviews();
  const all = Object.values(reviews)
    .flat()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const total = summarize(all);
  const latest = all.slice(0, 3);

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

        <Gallery items={featured} reviews={reviews} />
      </section>

      {latest.length > 0 && (
        <section className="shell mt-28" aria-labelledby="resenas">
          <Reveal>
            <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-5">
              <h2 id="resenas" className="eyebrow">
                Lo que dicen quienes compraron
              </h2>
              <p className="flex items-center gap-2 text-sm text-ink-soft">
                <Stars value={total.average} />
                <span className="tabular-nums">
                  {formatAverage(total.average)} · {total.count}{" "}
                  {total.count === 1 ? "reseña" : "reseñas"}
                </span>
              </p>
            </div>
          </Reveal>

          <ul className="grid gap-12 md:grid-cols-3 md:gap-10">
            {latest.map((r, i) => (
              <li key={r.id}>
                <Reveal delay={i * 90}>
                  <figure>
                    <Stars value={r.rating} className="text-sm" />
                    <blockquote className="mt-4 font-display text-xl leading-snug tracking-[-0.01em]">
                      “{r.comment.length > 220 ? `${r.comment.slice(0, 220).trimEnd()}…` : r.comment}”
                    </blockquote>
                    <figcaption className="mt-4 text-sm text-ink-soft">
                      {r.name}
                      <span className="text-ink-faint"> · sobre {illustrationBySlug(r.slug)?.title}</span>
                    </figcaption>
                  </figure>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      )}

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
