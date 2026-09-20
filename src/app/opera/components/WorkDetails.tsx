import Reveal from "@/components/Reveal";
import type { Illustration } from "@/data/illustrations";
import WorkAside from "./WorkAside";

/**
 * Lo que se lee debajo de la lámina: el título y su contexto a la izquierda,
 * la ficha y el "Chiedi info" en la columna lateral.
 *
 * La sección es dueña de su grilla y se trae el lateral adentro, igual que la
 * presentación de About me.
 *
 * PLACEHOLDER: `story` es texto de relleno en todas las obras, y ninguna es
 * un encargo real. Ver PRODUCT.md.
 */
export default function WorkDetails({ item }: { item: Illustration }) {
  return (
    <div className="mt-10 grid gap-10 md:mt-14 md:grid-cols-12 md:gap-8">
      <div className="md:col-span-7">
        <Reveal>
          <h1 className="display-lead font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
            {item.title}
          </h1>
          {item.story && (
            <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft">
              {item.story}
            </p>
          )}
        </Reveal>
      </div>

      <WorkAside item={item} />
    </div>
  );
}
