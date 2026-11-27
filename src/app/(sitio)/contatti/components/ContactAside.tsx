import { ArrowUpRight } from "@/components/Icon";
import Reveal from "@/components/Reveal";
import { site } from "@/data/site";

/**
 * La colonna laterale di Contatti.
 *
 * L'indirizzo resta sempre in vista, non solo dopo l'invio: è la via d'uscita
 * per chi non vuole compilare un modulo e la rete di sicurezza per chi non ha
 * un programma di posta. 14px, come ogni colonna laterale aperta da un
 * maiuscoletto.
 */
export default function ContactAside() {
  return (
    <div className="md:col-span-4 md:col-start-9">
      <Reveal delay={120}>
        <div className="border-t border-line pt-5">
          <h2 className="label">Scrivimi</h2>
          <a
            href={`mailto:${site.email}`}
            className="link-underline mt-4 block break-all text-sm text-ink-soft transition-colors hover:text-ink"
          >
            {site.email}
          </a>
        </div>

        <div className="mt-10 border-t border-line pt-5">
          <h2 className="label">Social</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {site.socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
                >
                  <span className="link-underline">{s.label}</span>
                  <ArrowUpRight className="shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/*
          "Studio" qui è il laboratorio, non la pagina: introduce il luogo.

          L'indirizzo intero, e non solo la città: è lo stesso dei dati
          strutturati (`StructuredData`) e del profilo Google, e Google si
          fida di un indirizzo solo se lo ritrova scritto nella pagina, uguale
          ovunque. Viene da `site.negozio`, quindi segue un trasloco da solo.
        */}
        <div className="mt-10 border-t border-line pt-5">
          <h2 className="label">Studio</h2>
          <address className="mt-4 text-sm not-italic text-ink-soft">
            {site.negozio.indirizzo}
            <br />
            {site.negozio.cap} {site.negozio.citta} ({site.negozio.provincia})
          </address>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${site.negozio.indirizzo}, ${site.negozio.cap} ${site.negozio.citta}`,
            )}`}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
          >
            <span className="link-underline">Apri in Maps</span>
            <ArrowUpRight className="shrink-0" />
          </a>
        </div>
      </Reveal>
    </div>
  );
}
