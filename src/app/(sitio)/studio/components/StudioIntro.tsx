import Reveal from "@/components/Reveal";
import { bio } from "@/data/studio";
import { site } from "@/data/site";
import StudioAside from "./StudioAside";

/**
 * La presentazione: misura di 7 colonne per il testo e colonna laterale sulla
 * 9, che è la cornice che usa già Contatti.
 *
 * La sezione è padrona della propria griglia e si porta la colonna laterale
 * dentro: così la pagina non deve sapere come si distribuiscono le colonne di
 * un blocco che non è suo.
 *
 * PLACEHOLDER: la bio è testo segnaposto. Vedi PRODUCT.md.
 */
export default function StudioIntro() {
  return (
    <section className="shell pt-12 md:pt-16">
      <div className="grid gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7">
          <Reveal>
            <h1 className="display-h1 text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
              Ciao, sono {site.author}.
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
