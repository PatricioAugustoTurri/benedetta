import type { ReactNode } from "react";
import Reveal from "@/components/Reveal";
import { datiMancanti, legale } from "@/data/legale";

export type SezioneLegale = { id: string; titolo: string; corpo: ReactNode };

/**
 * La cornice delle pagine da leggere —privacy, condizioni di vendita,
 * spedizioni—: il titolo, la data dell'ultima modifica, e il testo in
 * sezioni con un indice accanto.
 *
 * È la cornice di Contatti e About me girata al contrario: qui la colonna
 * stretta è l'indice e sta a sinistra, perché una pagina legale non si legge
 * dall'inizio alla fine ma si cerca il punto che serve («il recesso», «i
 * cookie»). Sul telefono l'indice va sopra, come una lista di salti.
 *
 * Finché manca un dato in `src/data/legale.ts` la pagina lo dice in cima, in
 * terracotta: è una bozza, e deve vedersi che lo è.
 */
export default function PaginaLegale({
  titolo,
  intro,
  sezioni,
}: {
  titolo: string;
  intro?: ReactNode;
  sezioni: SezioneLegale[];
}) {
  const mancanti = datiMancanti();

  return (
    <article className="shell pt-12 pb-8 md:pt-20">
      {mancanti.length > 0 && (
        <p className="mb-10 nota md:mb-14">
          Bozza: mancano {mancanti.join(", ")}. I punti da completare sono segnati nel testo.
        </p>
      )}

      <div className="grid gap-10 md:grid-cols-12 md:gap-16">
        <header className="md:col-span-8 md:col-start-5">
          <Reveal>
            <h1 className="display-h1 max-w-[18ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
              {titolo}
            </h1>
          </Reveal>
          <Reveal delay={90}>
            <p className="figures mt-4 text-xs text-ink-faint">Ultimo aggiornamento: {legale.aggiornato}</p>
            {intro && <div className="testo-legale prose-measure mt-6 text-lg leading-relaxed text-ink-soft">{intro}</div>}
          </Reveal>
        </header>

        <nav aria-label="In questa pagina" className="md:col-span-3 md:row-start-1 md:row-span-2">
          <div className="border-t border-line pt-5 md:sticky md:top-24">
            <h2 className="label">In questa pagina</h2>
            <ol className="mt-4 space-y-2 text-sm">
              {sezioni.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="area-tocco link-underline text-ink-soft transition-colors hover:text-ink">
                    {s.titolo}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <div className="md:col-span-8 md:col-start-5">
          {sezioni.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`} className="scroll-mt-24 border-t border-line pt-6 pb-10">
              <h2 id={`${s.id}-t`} className="display-section font-display text-[clamp(1.25rem,2vw,1.5rem)] leading-tight">
                {s.titolo}
              </h2>
              <div className="testo-legale prose-measure mt-4 space-y-4 text-[0.9375rem] leading-relaxed text-ink-soft">
                {s.corpo}
              </div>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}

/**
 * Un dato che ancora non c'è. Si vede, in terracotta e tra parentesi quadre,
 * invece di sparire: un testo legale con un buco invisibile è peggio di uno
 * con un buco segnato.
 */
export function Dato({ valore, nome }: { valore: string | null; nome: string }) {
  if (valore) return <>{valore}</>;
  return <span className="text-accent">[{nome}: da completare]</span>;
}
