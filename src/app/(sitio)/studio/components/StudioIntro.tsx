import Reveal from "@/components/Reveal";
import { bio, bioChiusura } from "@/data/studio";
import StudioAside from "./StudioAside";

/**
 * La presentazione: misura di 7 colonne per il testo e colonna laterale sulla
 * 9, che è la cornice che usa già Contatti.
 *
 * La sezione è padrona della propria griglia e si porta la colonna laterale
 * dentro: così la pagina non deve sapere come si distribuiscono le colonne di
 * un blocco che non è suo.
 *
 * Il saluto non sta più qui: è il titolo del frontespizio, sopra il video
 * (`StudioOpening`). La bio comincia subito sotto, sulla stessa linea.
 */
export default function StudioIntro() {
  return (
    <section className="shell pt-6 md:pt-8">
      <div className="grid gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7">
          <Reveal>
            <div className="prose-measure space-y-5 text-lg leading-relaxed text-ink-soft">
              {bio.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
              <p className="text-ink">{bioChiusura}</p>
            </div>
          </Reveal>
        </div>

        <StudioAside />
      </div>
    </section>
  );
}
