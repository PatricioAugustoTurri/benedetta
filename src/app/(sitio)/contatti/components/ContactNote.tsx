import Link from "next/link";
import Reveal from "@/components/Reveal";

/**
 * L'altra strada, quella di chi arriva per un'opera precisa. Va in fondo e in
 * inchiostro pallido perché è una nota, non un'alternativa alla pari: il
 * modulo è la strada.
 *
 * Non si disegna quando il visitatore è arrivato con l'oggetto già scritto,
 * da un'opera o da una categoria dello Shop. Spiegargli come fare quello che
 * ha appena fatto non è aiuto: è rumore, e per giunta lo fa dubitare di
 * averlo fatto bene.
 */
export default function ContactNote({ conOggetto = false }: { conOggetto?: boolean }) {
  if (conOggetto) return null;

  return (
    <Reveal delay={240}>
      {/*
        Il filetto va sul contenitore e la misura di lettura sul testo: se il
        filetto la ereditasse, taglierebbe prima di quelli dei campi e il
        bordo destro della colonna resterebbe frastagliato.
      */}
      <div className="mt-12 border-t border-line pt-6">
        <p className="prose-measure text-xs leading-relaxed text-ink-faint">
          Se la tua richiesta riguarda un&apos;opera in particolare, il pulsante{" "}
          <span className="text-ink-soft">Chiedi info</span> che trovi su ognuna ti porta qui
          con l&apos;oggetto già compilato. Sono tutte{" "}
          <Link href="/" className="link-underline text-ink-soft transition-colors hover:text-ink">
            nell&apos;archivio
          </Link>
          .
        </p>
      </div>
    </Reveal>
  );
}
