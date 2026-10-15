import type { ReactNode } from "react";

/**
 * Una parte di una pagina dell'admin. Il filetto spesso d'inchiostro la apre
 * su tutta la larghezza: è il solo posto del sistema dove una riga pesa più
 * di un pixel, e pesa perché ogni pagina dell'admin mette insieme lavori
 * diversi e bisogna sapere, scorrendo, dove ne finisce uno e ne comincia un
 * altro. I filetti sottili restano dentro, a separare le righe.
 *
 * Sotto, da 1024px, il nome e la spiegazione a sinistra e la cosa a destra,
 * così la spiegazione sta accanto a quello che spiega. Sul telefono uno sotto
 * l'altro.
 */
export default function Sezione({
  id,
  titolo,
  accanto,
  testo,
  azione,
  children,
}: {
  id: string;
  titolo: string;
  /** Una riga breve sotto il nome: quante sono, o come si comportano. */
  accanto?: ReactNode;
  testo?: ReactNode;
  azione?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-6 border-t-4 border-ink pt-6 md:pt-8 lg:grid-cols-12 lg:gap-8"
    >
      <header className="lg:col-span-3">
        <h2 id={id} className="display-section font-display text-xl leading-tight">
          {titolo}
        </h2>
        {accanto && <p className="figures mt-1 text-xs text-ink-faint">{accanto}</p>}
        {testo && (
          <div className="mt-4 max-w-[38ch] space-y-2 text-[0.8125rem] leading-relaxed text-ink-soft">
            {testo}
          </div>
        )}
        {azione && <div className="mt-4">{azione}</div>}
      </header>
      <div className="min-w-0 lg:col-span-9">{children}</div>
    </section>
  );
}
