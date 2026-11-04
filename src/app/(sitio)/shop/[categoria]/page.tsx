import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "@/components/Icon";
import { esServizio, prodottoHref } from "@/data/shop";
import { getCategoria } from "@/lib/categorie";
import { listPubblicati } from "@/lib/prodotti";
import { getServizio } from "@/lib/servizi";
import { listTestimonianze } from "@/lib/testimonianze";
import { immagineFerma } from "@/lib/video";
import ServizioPagina from "../components/ServizioPagina";
import SezioneCategoria from "../components/SezioneCategoria";

type Params = { params: Promise<{ categoria: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { categoria } = await params;
  const c = await getCategoria(categoria);
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
    description:
      c.slug === "stampe"
        ? "Stampe da comprare online, con spedizione in Italia e nell'Unione Europea."
        : `${c.label}: da comprare online, con spedizione in Italia e nell'Unione Europea.`,
    alternates: { canonical: `/shop/${c.slug}` },
    // Una categoria ancora nascosta si vede solo con l'indirizzo: lei la
    // guarda prima di accenderla, Google no.
    robots: c.visibile ? undefined : { index: false, follow: false },
  };
}

/**
 * Dove portano il menu e il footer. Per le stampe —e per ogni categoria che
 * si compra— è la lista; per un servizio
 * è la pagina del servizio stesso, perché un servizio non ha una lista: è uno.
 *
 * **Una categoria con un prodotto solo non fa la lista.** Il Calendario 2027
 * è uno: una griglia con una casella sola promette una scelta che non c'è e
 * aggiunge un clic. Si va dritti al prodotto, al suo indirizzo di sempre, e
 * con un redirect temporaneo: quando arriva il secondo, la lista torna da sé.
 */
export default async function CategoriaPage({ params }: Params) {
  const { categoria } = await params;
  const c = await getCategoria(categoria);
  if (!c) notFound();

  if (esServizio(c.slug)) {
    const [servizio, testimonianze] = await Promise.all([getServizio(c.slug), listTestimonianze(c.slug)]);
    if (!servizio) notFound();
    return <ServizioPagina servizio={servizio} testimonianze={testimonianze} />;
  }

  const prodotti = await listPubblicati(c.slug);
  if (prodotti.length === 1) redirect(prodottoHref(prodotti[0]));

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
