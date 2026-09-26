import Link from "next/link";
import { ArrowRight } from "@/components/Icon";
import Reveal from "@/components/Reveal";
import { servicios } from "@/data/studio";
import { listWorks } from "@/lib/works";

/**
 * Come lavora: i tipi di commissione, in una lista di definizione.
 *
 * Tre voci su tre colonne, una per colonna. Ogni voce è una subgrid di tre
 * righe —titolo, testo, opere— così la riga sottile sopra le opere cade alla
 * stessa altezza in tutte e tre anche se un testo va a capo una volta in più.
 *
 * Sotto ogni testo, separate da una riga sottile come le righe della scheda
 * di un'opera, le opere che lo mostrano: chi legge «Prodotti e packaging»
 * arriva alle etichette in un clic, senza doverle cercare nella griglia. La
 * promessa si appoggia a un lavoro vero, che è la cosa che un committente
 * guarda davvero.
 *
 * I titoli escono dalla tabella e non da un testo scritto qui, così se lei ne
 * cambia uno in /admin cambia anche in questa pagina. L'ordine è quello della
 * griglia, che decide lei. Una voce senza opere rimaste resta senza lista.
 *
 * Entrano scalati di 90ms l'uno dall'altro, che è il passo del resto del sito.
 */
export default async function StudioServices() {
  const works = await listWorks();

  return (
    <section className="shell mt-16" aria-labelledby="servizi">
      <Reveal>
        <h2 id="servizi" className="label border-b border-line pb-4">
          Come lavoro
        </h2>
      </Reveal>
      <dl className="mt-10 grid gap-12 md:grid-cols-3 md:gap-x-12 md:gap-y-0">
        {servicios.map((s, i) => {
          const opere = works.filter((w) => s.opere.includes(w.slug));
          return (
            <Reveal
              key={s.title}
              delay={i * 90}
              className="md:row-span-3 md:grid md:grid-rows-subgrid"
            >
              <dt className="display-section font-display text-xl">{s.title}</dt>
              <dd className="mt-3 text-ink-soft">{s.body}</dd>
              {opere.length > 0 && (
                <dd className="mt-6 border-t border-line pt-4">
                  <ul className="space-y-2.5 text-sm" aria-label={`Opere: ${s.title}`}>
                    {opere.map((w) => (
                      <li key={w.slug}>
                        <Link
                          href={`/opera/${w.slug}`}
                          className="group inline-flex items-baseline gap-2 text-ink transition-colors hover:text-accent"
                        >
                          <ArrowRight
                            size={12}
                            className="shrink-0 translate-y-px text-ink-faint transition-[color,transform] duration-300 group-hover:translate-x-0.5 group-hover:text-accent"
                          />
                          {w.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </dd>
              )}
            </Reveal>
          );
        })}
      </dl>
    </section>
  );
}
