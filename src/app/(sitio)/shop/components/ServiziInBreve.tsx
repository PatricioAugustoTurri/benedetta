import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/Icon";
import Reveal from "@/components/Reveal";
import { shopHref, getShopCategory } from "@/data/shop";
import { site } from "@/data/site";
import type { Servizio } from "@/lib/servizi";
import { immagineFerma } from "@/lib/video";

/**
 * I due lavori su commissione, nello Shop.
 *
 * Due e non una griglia: non sono prodotti da scorrere ma due porte, ognuna
 * con la sua copertina, il nome e l'inizio del testo. Le copertine hanno lo
 * stesso ritaglio 4:5 e la stessa misura delle celle delle stampe —due delle
 * tre colonne— così le due sezioni della pagina si leggono come la stessa
 * mano, e la differenza la fa la parola sotto: qui c'è il testo e niente
 * prezzo, là il prezzo.
 *
 * Senza immagini ancora, la copertina resta carta profonda con il nome
 * sopra: la sezione non sparisce, perché il servizio esiste anche prima che
 * lei carichi le foto.
 */
export default function ServiziInBreve({ servizi }: { servizi: Servizio[] }) {
  return (
    <section aria-labelledby="su-commissione">
      <Reveal>
        <div className="border-t border-line pt-6">
          <h2
            id="su-commissione"
            className="display-section font-display text-[clamp(1.375rem,2.4vw,1.75rem)] leading-tight"
          >
            Su commissione
          </h2>
          <p className="prose-measure mt-3 text-sm text-ink-soft">
            Lavori fatti su misura per te. Leggi come funzionano e scrivimi: il resto lo
            decidiamo insieme.
          </p>
        </div>
      </Reveal>

      <Reveal delay={90}>
        <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-4 md:mt-10 md:gap-x-6 lg:grid-cols-3">
          {servizi.map((s, i) => {
            const c = getShopCategory(s.slug);
            const portada = s.image[0];
            return (
              <li key={s.slug}>
                <Link
                  href={c ? shopHref(c) : "/shop"}
                  className="group block focus-visible:outline-none"
                >
                  <span className="relative block overflow-hidden bg-paper-deep group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[3px] group-focus-visible:outline-accent">
                    {portada ? (
                      <Image
                        src={immagineFerma(portada)}
                        alt={`${s.title} — ${site.signature}`}
                        width={portada.width}
                        height={portada.height}
                        sizes="(max-width: 1024px) 50vw, 33vw"
                        priority={i < 2}
                        className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="flex aspect-[4/5] w-full items-end p-4">
                        <span className="font-display text-lg leading-tight text-ink-faint">
                          {s.title}
                        </span>
                      </span>
                    )}
                  </span>

                  <span className="mt-3 block text-[0.9375rem] leading-snug text-ink transition-colors group-hover:text-accent">
                    {s.title}
                  </span>
                  {s.description && (
                    <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-ink-soft">
                      {s.description}
                    </span>
                  )}
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-ink-faint transition-colors group-hover:text-ink">
                    Scopri come funziona
                    <ArrowRight size={14} className="shrink-0" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </section>
  );
}
