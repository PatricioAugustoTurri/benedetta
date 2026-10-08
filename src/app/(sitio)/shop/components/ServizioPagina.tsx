import Link from "next/link";
import { AZIONE } from "@/components/azione";
import { ArrowLeft, Mail } from "@/components/Icon";
import Reveal from "@/components/Reveal";
import { site } from "@/data/site";
import type { Servizio } from "@/lib/servizi";
import type { Testimonianza } from "@/lib/testimonianze";
import { immagineFerma } from "@/lib/video";
import Visore from "../../opera/components/Visore";
import WorkPlate, { WorkPlates } from "../../opera/components/WorkPlate";

/**
 * La pagina di un servizio: Illustrazioni Personalizzate o Ritratti
 * Illustrati.
 *
 * È la composizione della pagina d'opera —nome e testo a sinistra, la prima
 * tavola a destra, le altre a due a due sotto— perché quello che vende un
 * ritratto su commissione sono i ritratti che ha già fatto. Cambia la scheda:
 * niente prezzo, niente carrello, solo «Chiedi info», che porta al modulo
 * con il nome del servizio già scritto nell'oggetto.
 *
 * Il testo qui è lungo —di cosa si tratta, come funziona— e quindi si divide
 * in paragrafi dove lei lascia una riga vuota, invece di uscire come un unico
 * blocco.
 */
export default function ServizioPagina({
  servizio: s,
  testimonianze = [],
}: {
  servizio: Servizio;
  testimonianze?: Testimonianza[];
}) {
  const paragrafi = (s.description ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const portada = s.image[0];

  const dati = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.title,
    description: s.description ?? undefined,
    image: portada ? immagineFerma(portada) : undefined,
    provider: { "@type": "Person", name: site.signature },
    areaServed: "IT",
    url: `${site.url}/shop/${s.slug}`,
  };

  return (
    <article className="shell pt-8 pb-12 md:pt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dati) }} />

      <Link
        href="/shop"
        className="area-tocco group inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft
          size={16}
          className="shrink-0 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-x-0.5"
        />
        <span className="link-underline">Shop</span>
      </Link>

      <Visore titolo={s.title} immagini={s.image}>
        <div className="opera opera--servizio">
          <header className="opera__nome">
            <Reveal>
              <h1 className="display-h1 max-w-[30ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
                {s.title}
              </h1>
            </Reveal>
            {paragrafi.length > 0 && (
              <Reveal delay={90}>
                <div className="prose-measure mt-4 space-y-4 text-lg leading-relaxed text-pretty text-ink-soft md:mt-5">
                  {paragrafi.map((p, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {p}
                    </p>
                  ))}
                </div>
              </Reveal>
            )}
          </header>

          <WorkPlate work={s} />
          <WorkPlates work={s} />

          <div className="opera__scheda">
            <Reveal delay={90}>
              <Link href={`/contatti?servizio=${s.slug}`} className={AZIONE}>
                <Mail size={18} className="shrink-0" />
                Chiedi info
              </Link>
              <p className="mt-3 text-xs text-ink-faint">
                Ti porta al modulo con l&apos;oggetto già compilato. Ogni lavoro si fa su misura,
                quindi il prezzo si decide insieme.
              </p>
            </Reveal>
          </div>
        </div>
      </Visore>

      {/*
        Le parole di chi l'ha già commissionato. Vengono dopo il lavoro e
        prima di niente: chi è arrivato fin qui ha visto le tavole e sta
        decidendo se scrivere. Le virgolette sono il carattere dei titoli, in
        pallido: segnano dove comincia una voce che non è quella di lei.
      */}
      {testimonianze.length > 0 && (
        <section aria-labelledby="dicono" className="mt-16 border-t border-line pt-8 md:mt-24 md:pt-10">
          <h2 id="dicono" className="label">
            Chi l&apos;ha già commissionato
          </h2>
          <ul className="mt-8 grid gap-x-14 gap-y-12 md:mt-10 md:grid-cols-2">
            {testimonianze.map((t, i) => (
              <li key={t.id}>
                <Reveal delay={Math.min(i, 3) * 90}>
                  <figure>
                    <span aria-hidden="true" className="display-h1 block text-5xl leading-none text-ink-faint/50">
                      “
                    </span>
                    <blockquote className="prose-measure -mt-2 text-lg leading-relaxed text-pretty text-ink">
                      {t.testo}
                    </blockquote>
                    <figcaption className="mt-4 text-sm text-ink-soft">
                      {t.autore}
                      {t.dettaglio && <span className="text-ink-faint"> · {t.dettaglio}</span>}
                    </figcaption>
                  </figure>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
