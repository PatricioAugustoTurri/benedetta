import Image from "next/image";
import type { CSSProperties } from "react";
import type { Work } from "@/lib/works";

/**
 * Le tavole, in due pezzi: la prima e le altre.
 *
 * Comanda l'opera: proporzione reale, senza ritaglio. Un'opera può portare
 * più di un'immagine —il fronte, un dettaglio, il foglio sul tavolo— ed
 * escono tutte nell'ordine che ha dato loro lei nell'admin.
 *
 * Sono due componenti perché da tablet in su occupano due posti diversi: la
 * prima sta accanto al nome, a destra, e le altre sotto, a due a due. Sul
 * telefono tornano una sotto l'altra, come una sola colonna.
 */

/**
 * La prima tavola: quella che apre, e l'unica con `preload`, perché sta nel
 * primo viewport e precaricare le altre toglierebbe banda proprio a lei.
 *
 * Il tetto di 78vh non ritaglia —`object-contain` lascia il pezzo intero e lo
 * scala—: un'opera più alta dello schermo costringe a scorrere per vederla
 * tutta, che è il contrario di guardarla. Accanto al testo si allinea al
 * bordo destro del contenitore, lo stesso della seconda colonna sotto, così
 * il suo margine esterno è sempre lo stesso qualunque sia la proporzione;
 * quello che varia è l'aria verso il testo.
 */
export default function WorkPlate({ work }: { work: Work }) {
  const img = work.image[0];
  if (!img) return null;

  return (
    <div className="opera__tavola flex items-start justify-center md:justify-end">
      <Image
        src={img.url}
        alt={img.alt}
        width={img.width}
        height={img.height}
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 50rem"
        preload
        className="max-h-[78vh] w-auto bg-paper-deep object-contain"
      />
    </div>
  );
}

/**
 * Le altre tavole, sotto, a coppie da tablet in su.
 *
 * Ogni coppia è una riga giustificata: i due pezzi prendono la stessa altezza
 * e insieme riempiono esattamente la larghezza del contenitore, ognuno nella
 * sua proporzione e senza ritaglio. Il trucco è far crescere ogni pezzo in
 * proporzione al suo rapporto larghezza/altezza (`--r`): con la stessa base
 * zero, le larghezze escono proporzionali ai rapporti e quindi le altezze
 * uguali. Così ogni riga è un rettangolo pulito, i bordi esterni coincidono
 * con quelli della pagina, e non resta nessun gradino fra un pezzo e l'altro.
 *
 * Con un numero dispari l'ultima riga è di tre, giustificata allo stesso
 * modo: un pezzo rimasto solo a metà riga sarebbe molto più alto delle righe
 * sopra, e stirato a tutta pagina sembrerebbe più importante degli altri.
 * L'unico caso in cui resta solo è quando è l'unico: allora prende mezza
 * riga, allineato a sinistra, come se avesse una compagna.
 */
export function WorkPlates({ work }: { work: Work }) {
  const resto = work.image.slice(1);
  if (resto.length === 0) return null;

  const coppie: (typeof resto)[] = [];
  const finePari = resto.length % 2 === 1 && resto.length >= 3 ? resto.length - 3 : resto.length;
  for (let i = 0; i < finePari; i += 2) coppie.push(resto.slice(i, i + 2));
  if (finePari < resto.length) coppie.push(resto.slice(finePari));

  return (
    <div className="opera__resto">
      {coppie.map((coppia) => (
        <div
          key={coppia[0].url}
          className="opera__coppia"
          data-sola={coppia.length === 1 ? "" : undefined}
        >
          {coppia.map((img) => (
            <div
              key={img.url}
              className="opera__pezzo"
              style={{ "--r": img.width / img.height } as CSSProperties}
            >
              <Image
                src={img.url}
                alt={img.alt}
                width={img.width}
                height={img.height}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 40rem"
                loading="lazy"
                className="max-h-[78vh] w-auto bg-paper-deep object-contain md:h-auto md:max-h-none md:w-full"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
