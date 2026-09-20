import Reveal from "@/components/Reveal";

/**
 * La entrada del Shop, que dice en el titular lo que la página no hace.
 *
 * No hay precios, ni medidas, ni stock, ni carrito: nada de eso está decidido
 * —ver PRODUCT.md, "Alcance de la tienda"— y la página lo declara en vez de
 * disimularlo.
 */
export default function ShopIntro() {
  return (
    <>
      <Reveal>
        <h1 className="display-lead font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
          Por ahora la tienda es un mail.
        </h1>
      </Reveal>

      <Reveal delay={90}>
        <p className="prose-measure mt-8 text-lg leading-relaxed text-ink-soft">
          Cada categoría abre un mensaje con el asunto ya puesto. Escribime qué te
          interesa y seguimos por ahí. El día que haya tienda de verdad, va a estar
          en esta misma página.
        </p>
      </Reveal>
    </>
  );
}
