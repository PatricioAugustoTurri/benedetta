import Image from "next/image";
import type { Work } from "@/lib/works";

/**
 * Las láminas.
 *
 * La obra manda: ancho completo, sin recorte, proporción real. El techo de
 * 78vh es la única restricción, y no recorta —`object-contain` deja la pieza
 * entera y la escala—, porque una obra más alta que la pantalla obliga a
 * hacer scroll para verla de una vez, que es lo contrario de mirarla.
 *
 * Una obra puede traer más de una imagen: el frente, un detalle, la hoja
 * sobre la mesa. Salen todas, una debajo de la otra y en el orden que ella
 * les dio en el admin. La primera es la que abre y la única con `priority`:
 * es la que está en el primer viewport, y precargar las demás le sacaría
 * ancho de banda justo a la que se está mirando.
 *
 * Las siguientes van con más aire entre ellas que el que las separa del
 * título, para que se lean como una secuencia de la misma obra y no como
 * piezas distintas apiladas.
 */
export default function WorkPlate({ work }: { work: Work }) {
  return (
    <div className="mt-6 space-y-6 md:mt-8 md:space-y-10">
      {work.image.map((img, i) => (
        <div key={img.url} className="flex justify-center">
          <Image
            src={img.url}
            alt={img.alt}
            width={img.width}
            height={img.height}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 60rem"
            priority={i === 0}
            loading={i === 0 ? undefined : "lazy"}
            className="max-h-[78vh] w-auto bg-paper-deep object-contain"
          />
        </div>
      ))}
    </div>
  );
}
