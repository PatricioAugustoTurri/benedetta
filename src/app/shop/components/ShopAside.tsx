import Reveal from "@/components/Reveal";
import { site } from "@/data/site";

/**
 * La salida directa, para quien no viene por una categoría sino por una obra
 * puntual. 14px, como toda columna lateral encabezada por versalitas.
 */
export default function ShopAside() {
  return (
    <aside className="md:col-span-4 md:col-start-9">
      <Reveal delay={120}>
        <div className="border-t border-line pt-5">
          <h2 className="label">Scrivimi</h2>
          <a
            href={`mailto:${site.email}`}
            className="link-underline mt-4 block break-all text-sm text-ink-soft transition-colors hover:text-ink"
          >
            {site.email}
          </a>
        </div>
      </Reveal>
    </aside>
  );
}
