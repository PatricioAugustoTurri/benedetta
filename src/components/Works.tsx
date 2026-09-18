import Image from "next/image";
import Link from "next/link";
import { illustrations } from "@/data/illustrations";

/**
 * La obra: grilla simétrica de tres columnas.
 *
 * Todas las celdas tienen la misma proporción vertical (3:4) porque la obra
 * real es toda de formato vertical. Las placeholders que hoy son apaisadas o
 * cuadradas se recortan para entrar; cuando entren las reales el recorte
 * deja de existir.
 *
 * Movimiento: cada pieza entra desde su columna —la izquierda desde la
 * izquierda, la del medio desde abajo, la derecha desde la derecha— y se
 * asienta con el desenfoque saliendo. La dirección la da la posición en la
 * grilla, no el azar.
 */
export default function Works() {
  return (
    <div className="shell pt-8 pb-8 md:pt-14">
      <ul className="grid gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {illustrations.map((item, i) => {
          // Tres columnas en escritorio: izquierda, centro, derecha.
          const column = i % 3;
          const enterX = column === 0 ? "-3rem" : column === 2 ? "3rem" : "0rem";
          const eager = i < 3;

          return (
            <li
              key={item.slug}
              className="rivista-piece"
              style={{ "--enter-x": enterX } as React.CSSProperties}
            >
              <Link href={`/opera/${item.slug}`} className="group block focus-visible:outline-none">
                {/* El foco se dibuja sobre la imagen, que es lo que el visitante mira. */}
                <span className="block overflow-hidden bg-paper-deep group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[3px] group-focus-visible:outline-accent">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={item.width}
                    height={item.height}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={eager}
                    loading={eager ? undefined : "lazy"}
                    className="aspect-[3/4] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />
                </span>

                <span className="mt-3 flex items-baseline justify-between gap-4">
                  <span className="font-display text-base tracking-tight transition-colors group-hover:text-accent">
                    {item.title}
                  </span>
                  <span className="label figures shrink-0">{item.year}</span>
                </span>
                <span className="mt-0.5 block text-xs text-ink-soft">
                  {[item.client, item.medium].filter(Boolean).join(" · ")}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
