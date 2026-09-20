import Image from "next/image";
import type { Illustration } from "@/data/illustrations";

/**
 * La lámina.
 *
 * La obra manda: ancho completo, sin recorte, proporción real. El techo de
 * 78vh es la única restricción, y no recorta —`object-contain` deja la pieza
 * entera y la escala—, porque una obra más alta que la pantalla obliga a
 * hacer scroll para verla de una vez, que es lo contrario de mirarla.
 */
export default function WorkPlate({ item }: { item: Illustration }) {
  return (
    <div className="mt-6 flex justify-center md:mt-8">
      <Image
        src={item.src}
        alt={item.alt}
        width={item.width}
        height={item.height}
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 60rem"
        priority
        className="max-h-[78vh] w-auto bg-paper-deep object-contain"
      />
    </div>
  );
}
