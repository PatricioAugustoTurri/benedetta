import Reveal from "@/components/Reveal";
import Stelle, { media } from "@/components/Stelle";
import { riepilogo, type Recensione } from "@/lib/recensioni";

const mese = (d: Date) =>
  new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric", timeZone: "Europe/Rome" }).format(d);

/**
 * Le recensioni di un prodotto, in fondo alla sua pagina: sotto l'immagine e
 * il carrello, perché si viene per la stampa e le parole degli altri sono
 * la conferma, non l'argomento. Ha la forma delle testimonianze dei servizi
 * —filetto, etichetta pallida, citazioni a due colonne— con le stelle sopra.
 *
 * Senza recensioni non disegna niente: nessun «sii il primo», che in un
 * sito piccolo si leggerebbe come un negozio vuoto.
 */
export default function RecensioniProdotto({ recensioni }: { recensioni: Recensione[] }) {
  if (recensioni.length === 0) return null;
  const { media: m, numero } = riepilogo(recensioni);

  return (
    <section aria-labelledby="recensioni" className="mt-16 border-t border-line pt-8 md:mt-24 md:pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
        <h2 id="recensioni" className="label">
          Recensioni di chi l&apos;ha comprato
        </h2>
        <p className="flex items-center gap-2.5 text-sm text-ink-soft">
          <Stelle voto={m} />
          <span className="figures">
            {media(m)} · {numero === 1 ? "1 recensione" : `${numero} recensioni`}
          </span>
        </p>
      </div>
      <ul className="mt-8 grid gap-x-14 gap-y-12 md:mt-10 md:grid-cols-2">
        {recensioni.map((r, i) => (
          <li key={r.id}>
            <Reveal delay={Math.min(i, 3) * 90}>
              <figure>
                <Stelle voto={r.voto} className="text-sm" />
                <blockquote className="prose-measure mt-3 text-lg leading-relaxed text-pretty whitespace-pre-line text-ink">
                  {r.testo}
                </blockquote>
                <figcaption className="mt-4 text-sm text-ink-soft">
                  {r.autore}
                  <span className="text-ink-faint"> · {mese(r.creata)}</span>
                </figcaption>
              </figure>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
