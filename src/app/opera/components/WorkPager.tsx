import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@/components/Icon";
import { neighbours } from "@/data/illustrations";

/**
 * Seguir recorriendo sin volver al archivo.
 *
 * Recibe el slug y busca a los vecinos por su cuenta: quién está antes y
 * quién después es asunto de este bloque, y la página no gana nada sabiéndolo.
 *
 * Las dos columnas se dibujan siempre, aunque una esté vacía —la primera obra
 * no tiene anterior y la última no tiene siguiente—: así "Successiva" no se
 * corre al centro al llegar a las puntas del archivo.
 */
export default function WorkPager({ slug }: { slug: string }) {
  const { prev, next } = neighbours(slug);

  return (
    <nav
      className="mt-14 grid grid-cols-2 gap-6 border-t border-line pt-6 md:mt-20"
      aria-label="Altre opere"
    >
      <div>
        {prev && (
          <Link href={`/opera/${prev.slug}`} className="group block">
            <span className="label inline-flex items-center gap-1.5">
              <ArrowLeft size={14} className="shrink-0" />
              Precedente
            </span>
            <span className="display-section mt-1.5 block font-display text-lg transition-colors group-hover:text-accent">
              {prev.title}
            </span>
          </Link>
        )}
      </div>
      <div className="text-right">
        {next && (
          <Link href={`/opera/${next.slug}`} className="group block">
            <span className="label inline-flex items-center gap-1.5">
              Successiva
              <ArrowRight size={14} className="shrink-0" />
            </span>
            <span className="display-section mt-1.5 block font-display text-lg transition-colors group-hover:text-accent">
              {next.title}
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
