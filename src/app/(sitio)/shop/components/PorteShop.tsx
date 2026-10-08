import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { shopHref } from "@/data/shop";
import { site } from "@/data/site";
import type { Porta } from "@/lib/copertine";
import { immagineFerma } from "@/lib/video";

/**
 * Le categorie dello Shop, una accanto all'altra: tre lamine 4:5 con il nome
 * sotto, come le opere nell'archivio. Ognuna è una porta e porta alla pagina
 * della sua categoria, dove c'è il dettaglio.
 *
 * Il nome va sotto l'immagine perché tutto il sito si legge così: prima il
 * disegno, poi la parola. Solo quelle due cose (cliente, 2026-10-08).
 *
 * La griglia regge più di tre categorie senza cambiare: tre per riga sullo
 * schermo largo e sul tablet, una sul telefono. Una riga incompleta resta
 * allineata a sinistra, come nell'archivio.
 */
export default function PorteShop({ porte }: { porte: Porta[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 md:grid-cols-3 md:gap-x-6 md:gap-y-16 lg:gap-x-8">
      {porte.map(({ categoria: c, immagine }, i) => (
        <li key={c.slug}>
          <Reveal delay={i * 90}>
            <Link href={shopHref(c)} className="group block focus-visible:outline-none">
              <span className="relative block overflow-hidden bg-paper-deep group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[3px] group-focus-visible:outline-accent">
                {immagine ? (
                  <Image
                    src={immagineFerma(immagine)}
                    alt={immagine.alt || `${c.label} — ${site.signature}`}
                    width={immagine.width}
                    height={immagine.height}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={i < 3}
                    className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="block aspect-[4/5] w-full" />
                )}
              </span>

              <span className="display-section mt-4 block font-display text-[clamp(1.25rem,2vw,1.5rem)] leading-tight text-ink transition-colors duration-300 group-hover:text-accent">
                {c.label}
              </span>
            </Link>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
