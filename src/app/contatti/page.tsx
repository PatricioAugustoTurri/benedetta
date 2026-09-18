import type { Metadata } from "next";
import { ArrowUpRight } from "@/components/Icon";
import Reveal from "@/components/Reveal";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Contatti",
  description: "Encargos, colaboraciones y consultas por impresiones.",
};

export default function ContattiPage() {
  return (
    <section className="shell pt-12 pb-8 md:pt-20">
      <div className="grid gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7">
          <Reveal>
            <h1 className="display-lead font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] tracking-[-0.02em] text-balance">
              Escribime y armamos algo juntos.
            </h1>
          </Reveal>

          <Reveal delay={90}>
            <p className="prose-measure mt-8 text-lg leading-relaxed text-ink-soft">
              Contame de qué se trata el proyecto, para cuándo lo necesitás y en qué formato.
              Si ya tenés referencias o un presupuesto en mente, mejor: así te respondo con
              algo concreto en lugar de un ida y vuelta largo.
            </p>
          </Reveal>

          <Reveal delay={170}>
            <a
              href={`mailto:${site.email}`}
              className="mt-10 inline-block font-display text-[clamp(1.35rem,3.4vw,2.5rem)] tracking-tight"
            >
              <span className="link-underline break-all">{site.email}</span>
            </a>
          </Reveal>

          <Reveal delay={240}>
            <p className="mt-8 text-sm text-ink-faint">
              Para consultas por impresiones, escribime con el título de la obra que te
              interesa — o usá el botón <span className="text-ink-soft">Chiedi info</span> que
              hay en cada una, que ya lo pone en el asunto.
            </p>
          </Reveal>
        </div>

        <aside className="md:col-span-4 md:col-start-9">
          <Reveal delay={120}>
            <div className="border-t border-line pt-5">
              <h2 className="label">Social</h2>
              <ul className="mt-4 space-y-2">
                {site.socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 text-ink-soft hover:text-ink"
                    >
                      <span className="link-underline">{s.label}</span>
                      <ArrowUpRight className="shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 border-t border-line pt-5">
              <h2 className="label">Studio</h2>
              <p className="mt-4 text-ink-soft">{site.location}</p>
            </div>
          </Reveal>
        </aside>
      </div>
    </section>
  );
}
