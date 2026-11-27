import type { MetadataRoute } from "next";
import { prodottoHref } from "@/data/shop";
import { listCategorieVisibili } from "@/lib/categorie";
import { listPubblicati } from "@/lib/prodotti";
import { getServizio } from "@/lib/servizi";
import { esServizio } from "@/data/shop";
import { immagineFerma } from "@/lib/video";
import { listWorks, type WorkImage } from "@/lib/works";
import { legaliPronte } from "@/data/legale";
import { site } from "@/data/site";

/**
 * Sitemap dinamica: `/`, `/studio`, `/shop`, `/contatti`, una riga per ogni opera
 * e una per ogni categoria e prodotto pubblicato dello Shop.
 *
 * Le opere si prendono da `listWorks()`, la stessa tabella che alimenta
 * `generateStaticParams` in `opera/[slug]`, così la sitemap non si scorda mai
 * un pezzo pubblicato né ne offre uno cancellato.
 *
 * Ogni opera, stampa e servizio porta con sé le sue immagini
 * (`<image:image>`). Le tavole vivono su Cloudinary, un altro dominio: senza
 * questa lista Google le trova solo se le incontra scansionando la pagina, e
 * per un'illustratrice Google Immagini e Lens sono la vetrina più grande.
 *
 * Niente `lastmod`: le tabelle non tengono la data dell'ultima modifica, e
 * una data inventata —oggi per tutte— Google impara presto a ignorarla.
 *
 * `site.url` è l'unico posto da cui dipende il dominio: cambia lì (in
 * `src/data/site.ts`) quando il dominio finale sostituisce il placeholder, e
 * questa sitemap segue senza toccarla.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Si las tablas del Shop todavía no existen en esta base —la migración 002
  // va después del deploy—, el sitemap sale igual, sin las stampe.
  const [works, tutti, categorie] = await Promise.all([
    listWorks(),
    listPubblicati().catch(() => []),
    listCategorieVisibili(),
  ]);
  // I prodotti di una categoria ancora nascosta restano fuori con lei.
  const visibili = new Set(categorie.map((c) => c.slug));
  const prodotti = tutti.filter((p) => visibili.has(p.categoria));

  const pagine: MetadataRoute.Sitemap = [
    { url: site.url, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/studio`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site.url}/shop`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site.url}/contatti`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site.url}/domande-frequenti`, changeFrequency: "monthly", priority: 0.4 },
    // Le pagine legali entrano quando sono complete (vedi `legaliPronte`).
    ...(legaliPronte()
      ? ([
          { url: `${site.url}/spedizioni-e-resi`, changeFrequency: "yearly", priority: 0.3 },
          { url: `${site.url}/condizioni-di-vendita`, changeFrequency: "yearly", priority: 0.2 },
          { url: `${site.url}/privacy`, changeFrequency: "yearly", priority: 0.2 },
        ] satisfies MetadataRoute.Sitemap)
      : []),
  ];

  const opere: MetadataRoute.Sitemap = works.map((w) => ({
    url: `${site.url}/opera/${w.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
    images: immagini(w.image),
  }));

  // I servizi (ritratti, illustrazioni personalizzate) sono categorie con una
  // pagina sola, fatta delle loro tavole.
  const servizi = new Map(
    await Promise.all(
      categorie
        .filter((c) => esServizio(c.slug))
        .map(async (c) => [c.slug, await getServizio(c.slug).catch(() => null)] as const),
    ),
  );

  // Le categorie e i prodotti pubblicati. Le bozze non escono: listPubblicati
  // non le restituisce.
  // Una categoria con un prodotto solo rimanda a quel prodotto: in sitemap
  // va il prodotto, non un indirizzo che fa un redirect.
  const quanti = new Map<string, number>();
  for (const p of prodotti) quanti.set(p.categoria, (quanti.get(p.categoria) ?? 0) + 1);

  const shop: MetadataRoute.Sitemap = [
    ...categorie.filter((c) => quanti.get(c.slug) !== 1).map((c) => ({
      url: `${site.url}/shop/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
      images: immagini(servizi.get(c.slug)?.image ?? []),
    })),
    ...prodotti.map((p) => ({
      url: `${site.url}${prodottoHref(p)}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      images: immagini(p.image),
    })),
  ];

  return [...pagine, ...opere, ...shop];
}

/** Le immagini di una pagina, per la sitemap: di un video, il fotogramma. */
function immagini(pezzi: WorkImage[]): string[] | undefined {
  const urls = pezzi.map((p) => {
    const url = immagineFerma(p);
    return url.startsWith("/") ? `${site.url}${url}` : url;
  });
  return urls.length ? urls : undefined;
}
