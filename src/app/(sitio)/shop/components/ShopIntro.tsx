import Reveal from "@/components/Reveal";

/**
 * L'ingresso dello Shop. Dice le due cose che il negozio fa, perché sono due
 * cose diverse e chi arriva deve sapere subito quale cerca: le stampe si
 * comprano qui; ritratti e illustrazioni si chiedono.
 *
 * Non promette tempi di consegna né tirature: non sono decisi (PRODUCT.md,
 * "Alcance de la tienda").
 */
export default function ShopIntro() {
  return (
    <>
      <Reveal>
        <h1 className="display-h1 max-w-[22ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
          Stampe, ritratti e illustrazioni su richiesta.
        </h1>
      </Reveal>

      <Reveal delay={90}>
        <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft md:mt-8">
          Le stampe si comprano qui e si spediscono in Italia e nell&apos;Unione Europea. Ritratti
          e illustrazioni personalizzate si fanno su misura: leggi come funziona ognuno e
          scrivimi.
        </p>
      </Reveal>
    </>
  );
}
