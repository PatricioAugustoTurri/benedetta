import { site } from "@/data/site";

export type ShopCategory = {
  slug: string;
  label: string;
  /** Una línea sobre el material o el formato. Nunca precio, tirada ni stock. */
  note: string;
};

/**
 * Las categorías de la tienda.
 *
 * PLACEHOLDER: los nombres son inventados a pedido del cliente. Están cortados
 * por tipo de producto —qué se compra— y no por tema, porque el tema ya es el
 * eje del archivo (Editorial, Infantil, Botánica, Personal) y repetirlo acá
 * daría dos taxonomías compitiendo por lo mismo.
 *
 * Las notas hablan sólo de material y formato. No dicen precio, ni tirada, ni
 * que haya stock: nada de eso está decidido, y PRODUCT.md es explícito en que
 * lo que falta se pide y no se completa.
 */
export const shopCategories: ShopCategory[] = [
  { slug: "stampe", label: "Stampe fine art", note: "Su carta cotone, in vari formati." },
  { slug: "originali", label: "Originali", note: "Pezzi unici, acquerello e gouache." },
  { slug: "biglietti", label: "Biglietti", note: "Piccolo formato, carta ruvida." },
  { slug: "quaderni", label: "Quaderni", note: "Copertine illustrate." },
  { slug: "poster", label: "Poster", note: "Grande formato, stampa offset." },
];

/**
 * A dónde lleva cada categoría.
 *
 * Hoy la tienda no existe —no hay precios, ni stock, ni pasarela— así que cada
 * categoría abre un mail con la categoría ya puesta en el asunto, que es
 * exactamente como se venden las impresiones ahora. Es la única salida honesta:
 * apuntar a `/shop/<slug>` sería prometer páginas que darían 404.
 *
 * El día que la tienda exista, esta función es lo único que cambia:
 *   return `/shop/${category.slug}`;
 */
export function shopHref(category: ShopCategory): string {
  const subject = `Shop — ${category.label}`;
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}`;
}
