import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@/components/Icon";
import { prezzoScontato, prodottoHref } from "@/data/shop";
import { getCategoria } from "@/lib/categorie";
import { scontiInCorso } from "@/lib/sconti";
import { tariffeSpedizione } from "@/lib/spedizione";
import { site } from "@/data/site";
import { mockupComeStampa } from "@/lib/mockup";
import { esaurito, getPubblicato, listPubblicati } from "@/lib/prodotti";
import { recensioniDelProdotto, riepilogo } from "@/lib/recensioni";
import { immagineFerma } from "@/lib/video";
import { briciole, descrizioneBreve, JsonLd, openGraphPagina } from "@/lib/seo";
import { getWork } from "@/lib/works";
import Visore from "../../../opera/components/Visore";
import WorkPlate, { WorkPlates } from "../../../opera/components/WorkPlate";
import WorkTitle from "../../../opera/components/WorkTitle";
import CaroselloStampa from "../../components/CaroselloStampa";
import ProdottoScheda from "../../components/ProdottoScheda";
import RecensioniProdotto from "../../components/RecensioniProdotto";

type Params = { params: Promise<{ categoria: string; slug: string }> };

export const dynamic = "force-dynamic";

/*
  Il prodotto si cerca per slug e poi si controlla che la categoria
  dell'indirizzo sia la sua. Un indirizzo con la categoria sbagliata non porta
  alla pagina giusta per caso: è un 404, così ogni prodotto ha un indirizzo
  solo e Google non ne indicizza due.
*/
async function cerca(categoria: string, slug: string) {
  const c = await getCategoria(categoria);
  // Solo le categorie che si comprano hanno pagine sotto: un servizio è una pagina sola.
  const p = c?.vendita ? await getPubblicato(slug) : null;
  if (!c || !p || p.categoria !== c.slug) return null;
  return { c, p };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { categoria, slug } = await params;
  const trovato = await cerca(categoria, slug);
  if (!trovato) return {};
  const { c, p } = trovato;

  // «Stampa» nel titolo: una stampa fatta da un'opera ha lo stesso nome della
  // pagina dell'opera, e due risultati uguali in Google non dicono quale sia
  // quella che si compra. Nelle altre categorie va il nome della categoria,
  // se il titolo non lo dice già: «Calendario 2027» non diventa «Calendario
  // 2027 — Calendario 2027».
  const tipo = c.slug === "stampe" ? "Stampa" : c.label;
  const titolo = p.title.toLowerCase().includes(tipo.toLowerCase()) ? p.title : `${p.title} — ${tipo}`;
  // Senza testo, la descrizione dice almeno cos'è, di chi e che si compra
  // qui: «Stampa di un'illustrazione di Benedetta Zibetti…».
  const description = p.description
    ? descrizioneBreve(p.description)
    : `${c.slug === "stampe" ? `Stampa di un'illustrazione` : c.label} di ${site.name}, ${site.role.toLowerCase()} a ${site.zona}. Da comprare online, con spedizione in Italia e in Europa.`;
  return {
    title: titolo,
    description,
    alternates: { canonical: prodottoHref(p) },
    robots: c.visibile ? undefined : { index: false, follow: false },
    openGraph: openGraphPagina({
      path: prodottoHref(p),
      title: `${titolo} · ${site.name}`,
      description,
      immagine: p.image[0],
    }),
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

  const [opera, sconti, fratelli, recensioni] = await Promise.all([
    p.operaSlug ? getWork(p.operaSlug) : null,
    scontiInCorso().catch(() => new Map()),
    listPubblicati(c.slug),
    recensioniDelProdotto(p.id),
  ]);
  const voti = riepilogo(recensioni);
  const sconto = sconti.get(p.id) ?? null;
  const portada = p.image[0];

  // Se è l'unico della sua categoria, la pagina della categoria rimanda qui:
  // tornare indietro porta allo Shop, non a un giro su se stessi.
  const indietro =
    fratelli.length > 1 ? { href: `/shop/${c.slug}`, label: c.label } : { href: "/shop", label: "Shop" };

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
    description:
      p.description ??
      (c.slug === "stampe" ? `Stampa di un'illustrazione di ${site.name}.` : `${c.label} di ${site.name}.`),
    // Tutte le foto della stampa, mockup compreso: Google Shopping e Lens
    // ne usano più di una.
    image: immagini.map(immagineFerma),
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
      availability: esaurito(p) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
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
    // Le recensioni vere di chi l'ha comprata, se ce ne sono: sono quelle
    // che Google mostra come stelle sotto il risultato.
    ...(voti.numero > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: voti.media.toFixed(1),
        reviewCount: voti.numero,
        bestRating: 5,
        worstRating: 1,
      },
      review: recensioni.slice(0, 10).map((r) => ({
        "@type": "Review",
        reviewRating: { "@type": "Rating", ratingValue: r.voto, bestRating: 5, worstRating: 1 },
        author: { "@type": "Person", name: r.autore },
        reviewBody: r.testo,
        datePublished: r.creata.toISOString().slice(0, 10),
      })),
    }),
  };

  return (
    <article className="shell pt-8 pb-12 md:pt-12">
      <JsonLd
        dati={[
          dati,
          briciole([
            { nome: "Shop", path: "/shop" },
            ...(fratelli.length > 1 ? [{ nome: c.label, path: `/shop/${c.slug}` }] : []),
            { nome: p.title, path: prodottoHref(p) },
          ]),
        ]}
      />

      <Link
        href={indietro.href}
        className="area-tocco group inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft
          size={16}
          className="shrink-0 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-x-0.5"
        />
        <span className="link-underline">{indietro.label}</span>
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

      <RecensioniProdotto recensioni={recensioni} />
    </article>
  );
}
