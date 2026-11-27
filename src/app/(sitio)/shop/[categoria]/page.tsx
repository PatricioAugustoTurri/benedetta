import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "@/components/Icon";
import { esServizio, prodottoHref } from "@/data/shop";
import { site } from "@/data/site";
import { getCategoria } from "@/lib/categorie";
import { listPubblicati } from "@/lib/prodotti";
import { getServizio } from "@/lib/servizi";
import { listTestimonianze } from "@/lib/testimonianze";
import { briciole, descrizioneBreve, JsonLd, openGraphPagina } from "@/lib/seo";
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
    // Tutto il testo del servizio, ridotto alla misura di Google: la sola
    // prima riga a volte è una frase di ottanta caratteri che non dice dove
    // né come.
    const descrizione = servizio?.description
      ? descrizioneBreve(servizio.description)
      : `${c.label} su commissione: leggi come funziona e scrivimi.`;
    return {
      // «su commissione» è come lo si cerca: un ritratto illustrato si ordina,
      // non si compra già fatto, e il titolo lo dice prima ancora di aprirlo.
      title: `${servizio?.title ?? c.label} su commissione`,
      description: descrizione,
      alternates: { canonical: `/shop/${c.slug}` },
      openGraph: openGraphPagina({ path: `/shop/${c.slug}`, immagine: servizio?.image[0] }),
    };
  }

  return {
    // «Stampe» da solo è un titolo che non dice di chi né di cosa; «stampe
    // d'arte» è come le si cerca.
    title: c.slug === "stampe" ? "Stampe d'arte illustrate" : `${c.label} · Shop`,
    description:
      c.slug === "stampe"
        ? `Stampe d'arte delle illustrazioni di ${site.name}, ${site.role.toLowerCase()} a Foligno: stampate dopo il tuo ordine e spedite in Italia e in Europa.`
        : `${c.label} con le illustrazioni di ${site.name}: da comprare online, con spedizione in Italia e nell'Unione Europea.`,
    alternates: { canonical: `/shop/${c.slug}` },
    openGraph: openGraphPagina({ path: `/shop/${c.slug}` }),
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
      <JsonLd
        dati={briciole([
          { nome: "Shop", path: "/shop" },
          { nome: c.label, path: `/shop/${c.slug}` },
        ])}
      />
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
