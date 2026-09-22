import Link from "next/link";
import { Mail } from "@/components/Icon";
import Reveal from "@/components/Reveal";
import type { Work } from "@/lib/works";

/**
 * La ficha de la obra y la acción primaria del sitio entero, que acá es la
 * única forma cerrada y lo único redondeado que el sitio se permite.
 *
 * La ficha es una lista de definición abierta y cerrada por filetes, una
 * regla por fila: rótulo en versalitas a la izquierda, valor alineado a la
 * derecha con cifras de ancho fijo. Sin fondo, sin cebra, sin radio.
 *
 * Hoy son dos filas, año y técnica, que es lo que la tabla `works` guarda.
 * Llegó a tener cinco —categoría, comitente y medidas— cuando la obra vivía
 * en un archivo TypeScript. Si esas tres vuelven a hacer falta, vuelven como
 * columnas de la tabla y como campos del admin; inventarlas acá dejaría la
 * ficha diciendo cosas que nadie cargó.
 */
export default function WorkAside({ work }: { work: Work }) {
  const ficha = [
    { label: "Anno", value: String(work.year) },
    { label: "Tecnica", value: work.tecnica },
  ];

  return (
    <aside className="md:col-span-4 md:col-start-9">
      <Reveal delay={90}>
        <dl className="border-t border-line">
          {ficha.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-6 border-b border-line py-3"
            >
              <dt className="label">{row.label}</dt>
              <dd className="figures text-right text-sm">{row.value}</dd>
            </div>
          ))}
        </dl>

        {/*
          La acción primaria del sitio entero vive acá, en la obra concreta.

          **Es la única forma cerrada del sitio**, y contradice a propósito dos
          reglas del sistema: que la terracota no sea más que filetes y marcas,
          y que nada lleve borde en los cuatro lados. Se hace a pedido del
          cliente y por una razón defendible: el sitio no vende ni tiene
          checkout, y todo el recorrido termina en un mail. Hay exactamente una
          acción, y ésta es.

          **Probado en tres formas, y ésta es la elegida.** Fue un bloque de
          terracota lleno —demasiado: un rectángulo saturado al lado de una
          ilustración compite con ella—, después volvió un rato al ícono con la
          palabra subrayada, y quedó acá. El reposo es un filete de 1px y la
          palabra en terracota sobre papel: se ve cálido y se lee como algo que
          se toca, sin poner un bloque de color al lado de la obra. El relleno
          no desapareció, se movió al hover, que es donde el peso no compite
          con nada porque ya hay alguien apuntando.

          El radio es de 6px sobre 42 de alto, y es lo único redondeado del
          sitio: el escalón más suave que todavía se nota. Más que esto empieza
          a leerse como una píldora y este mundo no tiene ninguna.

          **A dónde lleva.** Ya no abre un `mailto:`, que dependía de que el
          visitante tuviera un programa de correo configurado y en un teléfono
          o en un webmail muchas veces no abre nada ni avisa. Ahora va al
          formulario de Contatti con el asunto puesto: viaja el slug y el
          título lo resuelve esa página contra la tabla.

          El subrayado se fue con la forma: dentro de una forma cerrada sería
          decir dos veces que esto se toca.
        */}
        <Link
          href={`/contatti?opera=${work.slug}`}
          className="mt-8 inline-flex items-center gap-2.5 rounded-md border border-accent px-5 py-2.5 text-sm text-accent transition-colors duration-300 hover:bg-accent hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ink"
        >
          {/*
            El ícono toma `currentColor`: viaja en terracota con la palabra y
            pasa a papel con ella cuando el fondo se llena. No cambia de color
            por su cuenta —lo que responde al puntero es la forma entera— así
            que nunca hay dos cosas moviéndose por un solo gesto.
          */}
          <Mail size={18} className="shrink-0" />
          Chiedi info
        </Link>
        <p className="mt-3 text-xs text-ink-faint">
          Te lleva al formulario con el asunto ya puesto.
        </p>
      </Reveal>
    </aside>
  );
}
