import Reveal from "@/components/Reveal";
import { servicios } from "@/data/studio";

/**
 * Cómo trabaja: los tres tipos de encargo, en una lista de definición.
 *
 * Entran escalonados de a 90ms, que es el paso del resto del sitio.
 *
 * PLACEHOLDER: las tres descripciones son de relleno. Ver PRODUCT.md.
 */
export default function StudioServices() {
  return (
    <section className="shell mt-16" aria-labelledby="servizi">
      <Reveal>
        <h2 id="servizi" className="label border-b border-line pb-4">
          Cómo trabajo
        </h2>
      </Reveal>
      <dl className="mt-10 grid gap-10 md:grid-cols-3 md:gap-12">
        {servicios.map((s, i) => (
          <Reveal key={s.title} delay={i * 90}>
            <dt className="display-section font-display text-xl">{s.title}</dt>
            <dd className="mt-3 text-ink-soft">{s.body}</dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
