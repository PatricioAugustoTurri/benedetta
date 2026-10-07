export type ShopCategoria = "illustrazioni-personalizzate" | "ritratti-illustrati" | "stampe";

/** I due lavori su commissione: ognuno è un servizio solo, non una lista. */
export type ServizioSlug = Exclude<ShopCategoria, "stampe">;

export type ShopCategory = {
  slug: ShopCategoria;
  label: string;
  /**
   * Se in questa categoria si compra o si chiede.
   *
   * È la differenza che separa tutto il resto. **Stampe** è una lista di
   * prodotti che cresce: formati, prezzo, carrello (tabella `prodotti`).
   * **Illustrazioni Personalizzate** e **Ritratti Illustrati** sono due
   * servizi, uno ciascuno e sempre lo stesso: una pagina che si legge e porta
   * al modulo di contatto (tabella `servizi`). Non si aggiungono, si
   * aggiornano.
   */
  vendita: boolean;
  /**
   * Una riga sul materiale o sul formato, se lei la scrive. Mai prezzo,
   * tiratura né disponibilità. Senza, la categoria esce col solo nome.
   */
  note?: string;
};

/**
 * Le categorie del negozio, come le ha date la cliente (2026-10-07).
 *
 * Le prime due sono i due lavori che nomina la sua bio —«illustrazioni
 * personalizzate e ritratti»—: si commissionano, non si comprano, e ognuna è
 * una pagina sola che lei aggiorna da /admin/shop. La terza è l'unico
 * prodotto, e le stampe si aggiungono di continuo. Le categorie restano nel
 * codice perché il database le controlla con un CHECK e cambiarle è una
 * migrazione.
 *
 * Nessuna ha la riga di nota: quelle di prima erano inventate, e PRODUCT.md è
 * esplicito sul fatto che quello che manca si chiede e non si inventa. Se lei
 * manda una riga per categoria, entra in `note` e si disegna da sola.
 */
export const shopCategories: ShopCategory[] = [
  { slug: "illustrazioni-personalizzate", label: "Illustrazioni Personalizzate", vendita: false },
  { slug: "ritratti-illustrati", label: "Ritratti Illustrati", vendita: false },
  { slug: "stampe", label: "Stampe", vendita: true },
];

export function getShopCategory(slug: string): ShopCategory | null {
  return shopCategories.find((c) => c.slug === slug) ?? null;
}

export function esServizio(slug: string): slug is ServizioSlug {
  return slug === "illustrazioni-personalizzate" || slug === "ritratti-illustrati";
}

/** L'oggetto con cui arriva al modulo chi entra da una categoria. */
export function shopSubject(category: ShopCategory): string {
  return `Shop — ${category.label}`;
}

/**
 * La pagina di una categoria: per le stampe, la lista; per un servizio, la
 * pagina del servizio stesso.
 */
export function shopHref(category: ShopCategory): string {
  return `/shop/${category.slug}`;
}

/** La pagina di una stampa. La categoria va nell'indirizzo perché si legga dove si è. */
export function prodottoHref(p: { categoria: ShopCategoria; slug: string }): string {
  return `/shop/${p.categoria}/${p.slug}`;
}

/* ------------------------------------------------------------- formati */

export type Formato = {
  /** Come si chiama il formato: «A4». Testo libero, non un elenco chiuso. */
  formato: string;
  /** In centesimi: 1500 sono 15 €. */
  prezzo: number;
};

/**
 * Il listino di partenza di ogni stampa, come l'ha dato la cliente
 * (2026-10-07): A5 a 10 €, 20×20 cm a 15 €, A4 a 20 €, A3 a 30 €. In ordine di
 * prezzo e non di carta: il quadrato sta fra A5 e A4, e chi sceglie legge una
 * scala che sale.
 *
 * È il punto di partenza e non una regola: una stampa nuova arriva al modulo
 * con questi tre già scritti, e lei può cambiare un prezzo o togliere un
 * formato in quella stampa sola. Cambiare questi numeri qui non tocca le
 * stampe già salvate: ognuna conserva i suoi.
 */
export const FORMATI_BASE: Formato[] = [
  { formato: "A5", prezzo: 1000 },
  { formato: "20×20 cm", prezzo: 1500 },
  { formato: "A4", prezzo: 2000 },
  { formato: "A3", prezzo: 3000 },
];

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const euroTondo = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/**
 * Da centesimi a «15 €». I prezzi tondi escono senza «,00»: in un listino da
 * 10, 15 e 30 euro i decimali sono rumore. Quando un totale ha centesimi
 * veri, si vedono.
 */
export function prezzo(centesimi: number): string {
  return centesimi % 100 === 0 ? euroTondo.format(centesimi / 100) : euro.format(centesimi / 100);
}

/** Il prezzo più basso di una stampa, per «da 10 €» nelle griglie. */
export function prezzoMinimo(formati: Formato[]): number | null {
  return formati.length === 0 ? null : Math.min(...formati.map((f) => f.prezzo));
}
