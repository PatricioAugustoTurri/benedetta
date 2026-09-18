import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@/components/Icon";
import Reveal from "@/components/Reveal";
import { getIllustration } from "@/data/illustrations";
import { entries, formatDate, getEntry } from "@/data/journal";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return entries.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry) return {};
  return { title: entry.title, description: entry.excerpt };
}

export default async function EntryPage({ params }: Params) {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry) notFound();

  const related = entry.related ? getIllustration(entry.related) : undefined;

  return (
    <article className="shell pt-8 pb-8 md:pt-12">
      <Link
        href="/diario"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={16} className="shrink-0" />
        <span className="link-underline">Diario</span>
      </Link>

      <Reveal>
        <time dateTime={entry.date} className="label figures mt-10 block">
          {formatDate(entry.date)}
        </time>
        <h1 className="display-lead mt-3 max-w-3xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] tracking-[-0.02em] text-balance">
          {entry.title}
        </h1>
      </Reveal>

      <Reveal delay={90}>
        <div className="prose-measure mt-10 space-y-5 text-lg leading-relaxed text-ink-soft">
          {entry.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </Reveal>

      {related && (
        <Reveal delay={140}>
          <aside className="mt-16 border-t border-line pt-8">
            <h2 className="label">Opera citata</h2>
            <Link href={`/opera/${related.slug}`} className="group mt-5 flex items-center gap-5">
              <span className="block w-24 shrink-0 overflow-hidden bg-paper-deep md:w-32">
                <Image
                  src={related.src}
                  alt={related.alt}
                  width={related.width}
                  height={related.height}
                  sizes="8rem"
                  className="w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
              </span>
              <span>
                <span className="block font-display text-lg tracking-tight transition-colors group-hover:text-accent">
                  {related.title}
                </span>
                <span className="figures mt-0.5 block text-xs text-ink-soft">
                  {[related.client, related.medium, related.year].filter(Boolean).join(" · ")}
                </span>
              </span>
            </Link>
          </aside>
        </Reveal>
      )}
    </article>
  );
}
