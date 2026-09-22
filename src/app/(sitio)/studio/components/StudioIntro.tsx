import Reveal from "@/components/Reveal";
import { bio } from "@/data/studio";
import { site } from "@/data/site";
import StudioAside from "./StudioAside";

/**
 * La presentación: medida de 7 columnas para el texto y columna lateral en la
 * 9, que es el marco que ya usa Contatti.
 *
 * La sección es dueña de su propia grilla y se trae el lateral adentro: así
 * la página no tiene que saber cómo se reparten las columnas de un bloque que
 * no es suyo.
 *
 * PLACEHOLDER: la bio es texto de relleno y está en español. Ver PRODUCT.md.
 */
export default function StudioIntro() {
  return (
    <section className="shell pt-12 md:pt-16">
      <div className="grid gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7">
          <Reveal>
            <h1 className="display-h1 text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
              Hola, soy {site.author}.
            </h1>
          </Reveal>

          <Reveal delay={90}>
            <div className="prose-measure mt-8 space-y-5 text-lg leading-relaxed text-ink-soft">
              {bio.map((p) => (
                <p key={p.slice(0, 24)}>{p.replace("{location}", site.location)}</p>
              ))}
            </div>
          </Reveal>
        </div>

        <StudioAside />
      </div>
    </section>
  );
}
