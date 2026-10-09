import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@/components/Icon";
import { getShopCategory, prezzoScontato, prodottoHref } from "@/data/shop";
import { scontiInCorso } from "@/lib/sconti";
import { tariffeSpedizione } from "@/lib/stripe";
import { site } from "@/data/site";
import { mockupComeStampa } from "@/lib/mockup";
import { getPubblicato } from "@/lib/prodotti";
import { immagineFerma } from "@/lib/video";
import { getWork } from "@/lib/works";
import Visore from "../../../opera/components/Visore";
import WorkPlate, { WorkPlates } from "../../../opera/components/WorkPlate";
import WorkTitle from "../../../opera/components/WorkTitle";
import CaroselloStampa from "../../components/CaroselloStampa";
import ProdottoScheda from "../../components/ProdottoScheda";

type Params = { params: Promise<{ categoria: string; slug: string }> };

export const dynamic = "force-dynamic";

/*
  Il prodotto si cerca per slug e poi si controlla che la categoria
  dell'indirizzo sia la sua. Un indirizzo con la categoria sbagliata non porta
  alla pagina giusta per caso: è un 404, così ogni prodotto ha un indirizzo
  solo e Google non ne indicizza due.
*/
async function cerca(categoria: string, slug: string) {
  const c = getShopCategory(categoria);
  // Solo le stampe hanno pagine sotto la categoria: un servizio è una pagina sola.
  const p = c?.vendita ? await getPubblicato(slug) : null;
  if (!c || !p || p.categoria !== c.slug) return null;
  return { c, p };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { categoria, slug } = await params;
  const trovato = await cerca(categoria, slug);
  if (!trovato) return {};
  const { c, p } = trovato;
  const portada = p.image[0];

  // «Stampa» nel titolo: una stampa fatta da un'opera ha lo stesso nome della
  // pagina dell'opera, e due risultati uguali in Google non dicono quale sia
  // quella che si compra.
  return {
    title: `${p.title} — Stampa`,
    description: p.description ?? c.label,
    alternates: { canonical: prodottoHref(p) },
    openGraph: {
      title: `${p.title} — Stampa · ${site.name}`,
      description: p.description ?? c.label,
      images: portada
        ? [{ url: immagineFerma(portada), width: portada.width, height: portada.height, alt: portada.alt }]
        : [],
    },
  };
}

/**
 * Una stampa dello Shop.
 *
 * È la pagina di un'opera —nome e testo, la prima tavola, le altre a due a
 * due, il visore a schermo intero— con la scheda cambiata: dove l'opera ha
 * Anno e Tecnica e «Chiedi info», qui c'è il formato e il carrello, oppure
 * «Chiedi info» con l'oggetto del lavoro su commissione. Lo stesso disegno
 * per due cose vicine: un prodotto di lei è prima di tutto una sua immagine.
 */
export default async function ProdottoPage({ params }: Params) {
  const { categoria, slug } = await params;
  const trovato = await cerca(categoria, slug);
  if (!trovato) notFound();
  const { c, p } = trovato;

  const [opera, sconti] = await Promise.all([
    p.operaSlug ? getWork(p.operaSlug) : null,
    scontiInCorso().catch(() => new Map()),
  ]);
  const sconto = sconti.get(p.id) ?? null;
  const portada = p.image[0];

  /*
    Con il mockup le immagini diventano un carosello: prima quelle della
    stampa, nell'ordine dell'admin, e in fondo il mockup. Il visore riceve la
    stessa lista, così ingrandendo si arriva anche alla stanza. Il mockup ha
    le stesse dimensioni della copertina (vedi `mockupComeStampa`), quindi
    passare dall'una all'altro non cambia misura né qui né nel visore. Senza
    mockup la pagina resta quella di un'opera: la tavola accanto al nome e le
    altre sotto.
  */
  const mockup =
    p.mockup && portada
      ? {
          ...mockupComeStampa(p.mockup, portada),
          alt: p.mockup.alt || `${p.title}, la stampa appesa in una stanza`,
        }
      : null;
  const immagini = mockup ? [...p.image, mockup] : p.image;

  /*
    Dati strutturati: un Product con un'offerta per formato, ognuna con la
    spedizione per paese e la politica di reso. È quello che Google chiede per
    mostrare la stampa con il prezzo nei risultati e nella scheda Shopping.
  */
  const url = `${site.url}${prodottoHref(p)}`;
  const tariffe = tariffeSpedizione();
  const dati = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.description ?? `Stampa di un'illustrazione di ${site.name}.`,
    image: portada ? immagineFerma(portada) : undefined,
    brand: { "@type": "Brand", name: site.name },
    sku: p.slug,
    offers: p.formati.map((f) => ({
      "@type": "Offer",
      name: f.formato,
      sku: `${p.slug}-${f.formato}`,
      // Il prezzo che si paga oggi, con lo sconto se c'è, e fino a quando vale.
      price: (prezzoScontato(f.prezzo, sconto?.percentuale) / 100).toFixed(2),
      priceValidUntil: sconto?.al,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      url,
      shippingDetails: tariffe.map((t) => ({
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: (t.prezzo / 100).toFixed(2), currency: "EUR" },
        shippingDestination: t.paesi.map((c) => ({ "@type": "DefinedRegion", addressCountry: c })),
      })),
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: [...new Set(tariffe.flatMap((t) => t.paesi))],
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      },
    })),
    url,
  };

  return (
    <article className="shell pt-8 pb-12 md:pt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dati) }} />

      <Link
        href={`/shop/${c.slug}`}
        className="area-tocco group inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft
          size={16}
          className="shrink-0 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-x-0.5"
        />
        <span className="link-underline">{c.label}</span>
      </Link>

      <Visore titolo={p.title} immagini={immagini}>
        <div className="opera">
          <WorkTitle work={p} />
          {mockup ? (
            <CaroselloStampa titolo={p.title} immagini={immagini} mockup={mockup.url} />
          ) : (
            <>
              <WorkPlate work={p} />
              <WorkPlates work={p} />
            </>
          )}
          <ProdottoScheda
            prodotto={p}
            opera={opera ? { slug: opera.slug, title: opera.title } : null}
            sconto={sconto}
          />
        </div>
      </Visore>
    </article>
  );
}
