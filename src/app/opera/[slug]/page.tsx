import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Mail } from "@/components/Icon";
import Reveal from "@/components/Reveal";
import { getIllustration, illustrations, neighbours } from "@/data/illustrations";
import { site } from "@/data/site";

type Params = { params: Promise<{ slug: string }> };

/** Las doce páginas se generan estáticas en el build. */
export function generateStaticParams() {
  return illustrations.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const item = getIllustration(slug);
  if (!item) return {};

  const detail = [item.client, item.medium, item.year].filter(Boolean).join(" · ");
  return {
    title: item.title,
    description: item.story ?? detail,
    openGraph: {
      title: `${item.title} · ${site.name}`,
      description: item.story ?? detail,
      images: [{ url: item.src, width: item.width, height: item.height, alt: item.alt }],
    },
  };
}

export default async function OperaPage({ params }: Params) {
  const { slug } = await params;
  const item = getIllustration(slug);
  if (!item) notFound();

  const { prev, next } = neighbours(slug);

  // La consulta llega con la obra ya nombrada: sin esto, el mail arranca vacío
  // y ella tiene que preguntar de cuál se trata.
  const mailto = `mailto:${site.email}?subject=${encodeURIComponent(
    `Info — ${item.title} (${item.year})`,
  )}`;

  const ficha = [
    { label: "Anno", value: String(item.year) },
    { label: "Categoria", value: item.category },
    item.client ? { label: "Committente", value: item.client } : null,
    { label: "Tecnica", value: item.medium },
    item.size ? { label: "Misure", value: item.size } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <article className="shell pt-8 md:pt-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={16} className="shrink-0" />
        <span className="link-underline">Archivio</span>
      </Link>

      {/* La obra manda: ancho completo, sin recorte, proporción real. */}
      <div className="mt-6 flex justify-center md:mt-8">
        <Image
          src={item.src}
          alt={item.alt}
          width={item.width}
          height={item.height}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 60rem"
          priority
          className="max-h-[78vh] w-auto bg-paper-deep object-contain"
        />
      </div>

      <div className="mt-10 grid gap-10 md:mt-14 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-7">
          <Reveal>
            <h1 className="display-lead font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] tracking-[-0.02em] text-balance">
              {item.title}
            </h1>
            {item.story && (
              <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft">
                {item.story}
              </p>
            )}
          </Reveal>
        </div>

        <aside className="md:col-span-4 md:col-start-9">
          <Reveal delay={90}>
            <dl className="border-t border-line">
              {ficha.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-6 border-b border-line py-3"
                >
                  <dt className="label">{row.label}</dt>
                  <dd className="figures text-right text-sm">{row.value}</dd>
                </div>
              ))}
            </dl>

            {/* La acción primaria del sitio entero vive acá, en la obra concreta. */}
            <a
              href={mailto}
              className="group mt-7 inline-flex items-center gap-2.5 text-sm text-ink"
            >
              <Mail size={18} className="shrink-0 text-ink-faint transition-colors group-hover:text-accent" />
              <span className="link-underline" data-active="true">
                Chiedi info
              </span>
            </a>
            <p className="mt-2 text-xs text-ink-faint">
              Se abre el mail con el título de la obra ya puesto.
            </p>
          </Reveal>
        </aside>
      </div>

      {/* Seguir recorriendo sin volver al archivo. */}
      <nav
        className="mt-14 grid grid-cols-2 gap-6 border-t border-line pt-6 md:mt-20"
        aria-label="Altre opere"
      >
        <div>
          {prev && (
            <Link href={`/opera/${prev.slug}`} className="group block">
              <span className="label inline-flex items-center gap-1.5">
                <ArrowLeft size={14} className="shrink-0" />
                Precedente
              </span>
              <span className="mt-1.5 block font-display text-lg tracking-tight transition-colors group-hover:text-accent">
                {prev.title}
              </span>
            </Link>
          )}
        </div>
        <div className="text-right">
          {next && (
            <Link href={`/opera/${next.slug}`} className="group block">
              <span className="label inline-flex items-center gap-1.5">
                Successiva
                <ArrowRight size={14} className="shrink-0" />
              </span>
              <span className="mt-1.5 block font-display text-lg tracking-tight transition-colors group-hover:text-accent">
                {next.title}
              </span>
            </Link>
          )}
        </div>
      </nav>
    </article>
  );
}
