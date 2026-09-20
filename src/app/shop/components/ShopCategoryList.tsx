import { Mail } from "@/components/Icon";
import Reveal from "@/components/Reveal";
import { shopCategories, shopHref } from "@/data/shop";

/**
 * Las categorías, con su nota de precios.
 *
 * Van dentro de la misma medida que el texto y no a lo ancho del pliego: a
 * 82rem la fila quedaba tan larga que el sobre del margen derecho se leía
 * como si perteneciera a otra cosa. Acá el nombre y su destino entran de una
 * sola mirada.
 *
 * Cada fila entera es el link: el nombre, la línea de material y el sobre
 * dibujado al margen, que es el mismo gesto del "Chiedi info" de una obra.
 * Filetes y espacio separan; no hay recuadros.
 *
 * La nota del final viaja con la lista y no suelta en la página: anota estas
 * filas, y separarlas dejaría la advertencia lejos de lo que advierte.
 */
export default function ShopCategoryList() {
  return (
    <>
      <Reveal delay={170}>
        <ul className="mt-14 border-t border-line md:mt-16">
          {shopCategories.map((c) => (
            <li key={c.slug}>
              <a
                href={shopHref(c)}
                className="group flex items-baseline justify-between gap-6 border-b border-line py-5 md:py-6"
              >
                <span className="min-w-0">
                  <span className="display-section block font-display text-xl transition-colors group-hover:text-accent">
                    {c.label}
                  </span>
                  <span className="mt-1.5 block text-sm text-ink-soft">{c.note}</span>
                </span>
                {/*
                  El sobre en tinta pálida, terracota al pasar por encima: dice
                  a dónde lleva la fila antes de que haya que probarlo.
                */}
                <Mail
                  size={18}
                  className="shrink-0 translate-y-0.5 text-ink-faint transition-colors group-hover:text-accent"
                />
              </a>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={240}>
        <p className="mt-6 text-xs text-ink-faint">
          Todavía no hay precios ni medidas publicadas: se arman por encargo.
        </p>
      </Reveal>
    </>
  );
}
