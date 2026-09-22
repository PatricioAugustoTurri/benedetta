import Reveal from "@/components/Reveal";
import { site } from "@/data/site";

/**
 * La columna lateral de la presentación.
 *
 * 14px, como la ficha de la obra, el aside de contacto y las columnas del
 * pie: en este sitio una columna encabezada por versalitas lleva el escalón
 * chico.
 *
 * "Studio" acá es el taller —encabeza la ubicación—, no el rótulo de la
 * página, que en el menú se llama "About me".
 */
export default function StudioAside() {
  return (
    <aside className="md:col-span-4 md:col-start-9">
      <Reveal delay={150}>
        <div className="border-t border-line pt-5">
          <h2 className="label">Studio</h2>
          <p className="mt-4 text-sm text-ink-soft">{site.location}</p>
        </div>

        <div className="mt-10 border-t border-line pt-5">
          <h2 className="label">Social</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {site.socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link-underline text-ink-soft transition-colors hover:text-ink"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </aside>
  );
}
