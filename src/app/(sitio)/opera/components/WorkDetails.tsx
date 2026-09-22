import Reveal from "@/components/Reveal";
import type { Work } from "@/lib/works";
import WorkAside from "./WorkAside";

/**
 * Lo que se lee debajo de las láminas: el texto de la obra a la izquierda, la
 * ficha y el «Chiedi info» en la columna lateral.
 *
 * El título ya no está acá: subió al principio de la página, antes de las
 * láminas. Lo que queda es contexto de algo que el visitante ya vio, que es
 * exactamente el orden en que se quiso dejar la página.
 *
 * La sección es dueña de su grilla y se trae el lateral adentro, igual que la
 * presentación de About me.
 */
export default function WorkDetails({ work }: { work: Work }) {
  return (
    <div className="mt-10 grid gap-10 md:mt-14 md:grid-cols-12 md:gap-8">
      {/*
        La columna del texto no se dibuja si no hay texto. Antes siempre tenía
        algo —el título— así que el caso no existía; ahora una obra cargada sin
        descripción, que es un estado que el admin admite y marca, dejaría acá
        siete columnas en blanco y, en el teléfono, un hueco de 2.5rem antes de
        la ficha. El lateral no se mueve: su lugar lo fija `col-start-9`, no la
        presencia del vecino.
      */}
      {work.description && (
        <div className="md:col-span-7">
          <Reveal>
            <p className="prose-measure text-lg leading-relaxed text-ink-soft">
              {work.description}
            </p>
          </Reveal>
        </div>
      )}

      <WorkAside work={work} />
    </div>
  );
}
