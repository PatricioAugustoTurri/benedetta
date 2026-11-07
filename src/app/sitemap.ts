import type { MetadataRoute } from "next";
import { prodottoHref } from "@/data/shop";
import { listCategorieVisibili } from "@/lib/categorie";
import { listPubblicati } from "@/lib/prodotti";
import { listSlugs } from "@/lib/works";
import { legaliPronte } from "@/data/legale";
import { site } from "@/data/site";

/**
 * Sitemap dinamica: `/`, `/studio`, `/shop`, `/contatti`, una riga per ogni opera
 * e una per ogni categoria e prodotto pubblicato dello Shop.
 *
 * Le opere si prendono da `listSlugs()`, la stessa funzione che alimenta
 * `generateStaticParams` in `opera/[slug]`, così la sitemap non si scorda mai
 * un pezzo pubblicato né ne offre uno cancellato: le due liste vivono della
 * stessa query.
 *
 * `site.url` è l'unico posto da cui dipende il dominio: cambia lì (in
 * `src/data/site.ts`) quando il dominio finale sostituisce il placeholder, e
 * questa sitemap segue senza toccarla.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Si las tablas del Shop todavía no existen en esta base —la migración 002
  // va después del deploy—, el sitemap sale igual, sin las stampe.
  const [slugs, tutti, categorie] = await Promise.all([
    listSlugs(),
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

  const opere: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${site.url}/opera/${slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

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
    })),
    ...prodotti.map((p) => ({
      url: `${site.url}${prodottoHref(p)}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  return [...pagine, ...opere, ...shop];
}
