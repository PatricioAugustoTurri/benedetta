import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@/components/Icon";
import { esServizio, getShopCategory, shopCategories } from "@/data/shop";
import { listPubblicati } from "@/lib/prodotti";
import { getServizio } from "@/lib/servizi";
import { listTestimonianze } from "@/lib/testimonianze";
import { immagineFerma } from "@/lib/video";
import ServizioPagina from "../components/ServizioPagina";
import SezioneCategoria from "../components/SezioneCategoria";

type Params = { params: Promise<{ categoria: string }> };

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return shopCategories.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { categoria } = await params;
  const c = getShopCategory(categoria);
  if (!c) return {};

  if (esServizio(c.slug)) {
    const servizio = await getServizio(c.slug);
    const portada = servizio?.image[0];
    const descrizione =
      servizio?.description?.split(/\n/)[0] ?? `${c.label} su commissione: leggi come funziona e scrivimi.`;
    return {
      title: servizio?.title ?? c.label,
      description: descrizione,
      alternates: { canonical: `/shop/${c.slug}` },
      openGraph: portada
        ? { images: [{ url: immagineFerma(portada), width: portada.width, height: portada.height, alt: portada.alt }] }
        : undefined,
    };
  }

  return {
    title: c.label,
    description: "Stampe da comprare online, con spedizione in Italia e nell'Unione Europea.",
    alternates: { canonical: `/shop/${c.slug}` },
  };
}

/**
 * Dove portano il menu e il footer. Per le stampe è la lista; per un servizio
 * è la pagina del servizio stesso, perché un servizio non ha una lista: è uno.
 */
export default async function CategoriaPage({ params }: Params) {
  const { categoria } = await params;
  const c = getShopCategory(categoria);
  if (!c) notFound();

  if (esServizio(c.slug)) {
    const [servizio, testimonianze] = await Promise.all([getServizio(c.slug), listTestimonianze(c.slug)]);
    if (!servizio) notFound();
    return <ServizioPagina servizio={servizio} testimonianze={testimonianze} />;
  }

  const prodotti = await listPubblicati(c.slug);

  return (
    <div className="shell pt-8 pb-8 md:pt-12">
      <Link
        href="/shop"
        className="area-tocco group mb-10 inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink md:mb-14"
      >
        <ArrowLeft
          size={16}
          className="shrink-0 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-x-0.5"
        />
        <span className="link-underline">Shop</span>
      </Link>

      <SezioneCategoria categoria={c} prodotti={prodotti} titolo="h1" eager={3} />
    </div>
  );
}
