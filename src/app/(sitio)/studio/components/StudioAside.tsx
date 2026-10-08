import Reveal from "@/components/Reveal";
import { site } from "@/data/site";

/**
 * La colonna laterale della presentazione.
 *
 * 14px, come la scheda dell'opera, l'aside dei contatti e le colonne del
 * footer: in questo sito una colonna aperta da un maiuscoletto porta il
 * gradino piccolo.
 *
 * "Studio" qui è il laboratorio —introduce il luogo—, non l'etichetta della
 * pagina, che nel menu si chiama "About me".
 */
export default function StudioAside() {
  return (
    <div className="md:col-span-4 md:col-start-9">
      <Reveal delay={150}>
        <div className="border-t border-line pt-5">
          <h2 className="label">Studio</h2>
          <p className="mt-4 text-sm text-ink-soft">{site.location}</p>
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
                  className="link-underline text-ink-soft transition-colors hover:text-ink"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}
