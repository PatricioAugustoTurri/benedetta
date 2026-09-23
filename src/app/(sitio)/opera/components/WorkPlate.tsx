import Image from "next/image";
import type { Work } from "@/lib/works";

/**
 * Le tavole.
 *
 * Comanda l'opera: larghezza piena, senza ritaglio, proporzione reale. Il
 * tetto di 78vh è l'unico vincolo, e non ritaglia —`object-contain` lascia il
 * pezzo intero e lo scala— perché un'opera più alta dello schermo costringe a
 * scorrere per vederla tutta, che è il contrario di guardarla.
 *
 * Un'opera può portare più di un'immagine: il fronte, un dettaglio, il foglio
 * sul tavolo. Escono tutte, una sotto l'altra e nell'ordine che ha dato loro
 * lei nell'admin. La prima è quella che apre e l'unica con `priority`: è
 * quella che sta nel primo viewport, e precaricare le altre toglierebbe banda
 * proprio a quella che si sta guardando.
 *
 * Le successive vanno con più aria fra loro di quanta ne le separi dal
 * titolo, perché si leggano come una sequenza della stessa opera e non come
 * pezzi diversi impilati.
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
