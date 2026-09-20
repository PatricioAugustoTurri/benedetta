import Reveal from "@/components/Reveal";

/**
 * La entrada de Contatti: el titular y el único consejo que no tiene un campo
 * donde vivir.
 *
 * Lo que antes decía este párrafo —qué contar, para cuándo, en qué formato—
 * ahora está debajo del campo donde se escribe. Una instrucción sirve donde
 * se ejecuta, no tres pantallas más arriba.
 */
export default function ContactIntro() {
  return (
    <>
      <Reveal>
        <h1 className="display-lead font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
          Escribime y armamos algo juntos.
        </h1>
      </Reveal>

      <Reveal delay={90}>
        <p className="prose-measure mt-8 text-lg leading-relaxed text-ink-soft">
          Si ya tenés referencias o un presupuesto en mente, mejor: así te respondo con
          algo concreto en lugar de un ida y vuelta largo.
        </p>
      </Reveal>
    </>
  );
}
