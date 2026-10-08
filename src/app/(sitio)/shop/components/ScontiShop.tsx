import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { prezzo, prezzoMinimo, prezzoScontato, prodottoHref } from "@/data/shop";
import { site } from "@/data/site";
import type { ScontoInCorso } from "@/lib/sconti";
import { immagineFerma } from "@/lib/video";

const giorno = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );

/**
 * Gli sconti di stagione, sotto le porte dello Shop: una sezione per ogni
 * sconto in corso, aperta dal filetto come ogni sezione del sito.
 *
 * Il titolo è quello che sceglie lei («Sconti di Natale»), e accanto la
 * percentuale e l'ultimo giorno: uno sconto è un prezzo che scade, e la
 * scadenza fa parte dell'offerta. La percentuale è l'unica cosa in
 * terracotta, perché è quella che chiede attenzione.
 *
 * Sotto, le stampe scelte, con il prezzo pieno barrato e quello scontato: a
 * differenza della griglia delle stampe, che è solo immagini, qui il prezzo
 * è la notizia.
 */
export default function ScontiShop({ sconti }: { sconti: ScontoInCorso[] }) {
  if (sconti.length === 0) return null;

  return (
    // `#sconti` è dove porta la cinta in cima al sito. Lo scarto è l'altezza
    // del menu attaccato in alto (96px sul telefono, 159 da 768px) più un po'
    // d'aria, così il titolo arriva sotto il menu e non dietro.
    <div id="sconti" className="mt-20 scroll-mt-32 space-y-20 md:mt-28 md:scroll-mt-48 md:space-y-28">
      {sconti.map((s) => (
        <section key={s.id} aria-labelledby={`sconto-${s.id}`} className="border-t border-line pt-6 md:pt-8">
          <Reveal>
            <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
              <h2
                id={`sconto-${s.id}`}
                className="display-section font-display text-[clamp(1.5rem,2.6vw,2rem)] leading-tight text-balance"
              >
                {s.titolo}
              </h2>
              <p className="figures text-sm text-ink-soft">
                <span className="font-medium text-accent">−{s.percentuale}%</span>
                <span aria-hidden="true"> · </span>
                fino al {giorno(s.al)}
              </p>
            </div>
            {s.testo && (
              <p className="prose-measure mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{s.testo}</p>
            )}
          </Reveal>

          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:mt-10 md:gap-x-6 lg:grid-cols-4">
            {s.prodotti.map((p, i) => {
              const portada = p.image[0];
              const minimo = prezzoMinimo(p.formati);
              const piu = p.formati.length > 1 ? "da " : "";
              return (
                <li key={p.id}>
                  <Reveal delay={Math.min(i, 3) * 70}>
                    <Link href={prodottoHref(p)} className="group block focus-visible:outline-none">
                      <span className="block overflow-hidden bg-paper-deep group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[3px] group-focus-visible:outline-accent">
                        {portada ? (
                          <Image
                            src={immagineFerma(portada)}
                            alt={portada.alt || `${p.title} — ${site.signature}`}
                            width={portada.width}
                            height={portada.height}
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                          />
                        ) : (
                          <span className="block aspect-[4/5] w-full" />
                        )}
                      </span>
                      <span className="mt-3 block text-[0.9375rem] leading-snug text-ink transition-colors group-hover:text-accent">
                        {p.title}
                      </span>
                      {minimo !== null && (
                        <span className="figures mt-1 flex items-baseline gap-2 text-sm">
                          <s className="text-xs text-ink-faint">
                            <span className="sr-only">Prezzo pieno </span>
                            {piu}
                            {prezzo(minimo)}
                          </s>
                          <span className="text-ink">
                            <span className="sr-only">Prezzo scontato </span>
                            {piu}
                            {prezzo(prezzoScontato(minimo, s.percentuale))}
                          </span>
                        </span>
                      )}
                    </Link>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
