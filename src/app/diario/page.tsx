import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { entries, formatDate } from "@/data/journal";

export const metadata: Metadata = {
  title: "Diario",
  description: "Proceso, bocetos y notas de taller.",
};

export default function DiarioPage() {
  return (
    <section className="shell pt-12 pb-8 md:pt-20">
      <Reveal>
        <h1 className="display-lead font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-tight tracking-[-0.02em]">
          Diario
        </h1>
        <p className="prose-measure mt-6 text-ink-soft">
          Notas de taller: cómo sale cada serie, qué se rehace y qué queda por el camino.
        </p>
      </Reveal>

      {entries.length === 0 ? (
        // Estado vacío: la sección existe aunque todavía no haya nada escrito.
        <p className="mt-16 border-t border-line pt-8 text-ink-faint">
          Todavía no hay entradas publicadas.
        </p>
      ) : (
        <ul className="mt-14 border-t border-line">
          {entries.map((entry, i) => (
            <li key={entry.slug}>
              <Reveal delay={i * 70}>
                <Link
                  href={`/diario/${entry.slug}`}
                  className="group grid gap-2 border-b border-line py-7 md:grid-cols-12 md:gap-8"
                >
                  <time
                    dateTime={entry.date}
                    className="label figures md:col-span-2 md:pt-1.5"
                  >
                    {formatDate(entry.date)}
                  </time>
                  <div className="md:col-span-10">
                    <h2 className="font-display text-xl tracking-tight transition-colors group-hover:text-accent md:text-2xl">
                      {entry.title}
                    </h2>
                    <p className="prose-measure mt-2 text-ink-soft">{entry.excerpt}</p>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
