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

        {/* "Studio" qui è il laboratorio, non la pagina: introduce il luogo. */}
        <div className="mt-10 border-t border-line pt-5">
          <h2 className="label">Studio</h2>
          <p className="mt-4 text-sm text-ink-soft">{site.location}</p>
        </div>
      </Reveal>
    </div>
  );
}
