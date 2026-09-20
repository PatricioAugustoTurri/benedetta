import { Mail } from "@/components/Icon";
import Reveal from "@/components/Reveal";
import type { Illustration } from "@/data/illustrations";
import { site } from "@/data/site";

/**
 * La ficha de la obra y la acción primaria del sitio entero.
 *
 * Las dos derivaciones que antes vivían en `page.tsx` —las filas de la ficha
 * y la dirección del mail— se mudaron acá, que es el único lugar donde se
 * usan. La página recibe la obra y no tiene que saber cómo se arma ninguna
 * de las dos.
 *
 * La ficha es una lista de definición abierta y cerrada por filetes, una
 * regla por fila: rótulo en versalitas a la izquierda, valor alineado a la
 * derecha con cifras de ancho fijo. Sin fondo, sin cebra, sin radio.
 */
export default function WorkAside({ item }: { item: Illustration }) {
  /*
    Cliente y medidas sólo aparecen si existen: un trabajo personal no tiene
    comitente, y una pieza digital no tiene medidas físicas. Una fila vacía
    diría que el dato falta, y no es que falte: no aplica.
  */
  const ficha = [
    { label: "Anno", value: String(item.year) },
    { label: "Categoria", value: item.category },
    item.client ? { label: "Committente", value: item.client } : null,
    { label: "Tecnica", value: item.medium },
    item.size ? { label: "Misure", value: item.size } : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

  // La consulta llega con la obra ya nombrada: sin esto, el mail arranca
  // vacío y ella tiene que preguntar de cuál se trata.
  const mailto = `mailto:${site.email}?subject=${encodeURIComponent(
    `Info — ${item.title} (${item.year})`,
  )}`;

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

        {/* La acción primaria del sitio entero vive acá, en la obra concreta. */}
        <a href={mailto} className="group mt-7 inline-flex items-center gap-2.5 text-sm text-ink">
          <Mail
            size={18}
            className="shrink-0 text-ink-faint transition-colors group-hover:text-accent"
          />
          <span className="link-underline" data-active="true">
            Chiedi info
          </span>
        </a>
        <p className="mt-2 text-xs text-ink-faint">
          Se abre el mail con el título de la obra ya puesto.
        </p>
      </Reveal>
    </aside>
  );
}
