/**
 * Lo slug di una categoria. Era un elenco chiuso di tre; da quando lei le crea
 * da /admin/shop (2026-11-01) è un testo, e quello che esiste lo dice la
 * tabella `categorie`. Vedi `src/lib/categorie.ts`.
 */
export type ShopCategoria = string;

/** I due lavori su commissione: ognuno è un servizio solo, non una lista. */
export type ServizioSlug = "illustrazioni-personalizzate" | "ritratti-illustrati";

export type ShopCategory = {
  slug: ShopCategoria;
  label: string;
  /**
   * Se in questa categoria si compra o si chiede.
   *
   * È la differenza che separa tutto il resto. **Stampe**, e ogni categoria
   * che lei crea, è una lista di prodotti che cresce: formati, prezzo,
   * carrello (tabella `prodotti`). **Illustrazioni Personalizzate** e
   * **Ritratti Illustrati** sono due servizi, uno ciascuno e sempre lo
   * stesso: una pagina che si legge e porta al modulo di contatto (tabella
   * `servizi`). Non si aggiungono, si aggiornano.
   */
  vendita: boolean;
  /**
   * Se esce nel menu, nel footer e fra le porte di /shop. Una categoria nuova
   * nasce nascosta, come una stampa nasce bozza.
   */
  visibile: boolean;
  /**
   * Una riga sul materiale o sul formato, se lei la scrive. Mai prezzo,
   * tiratura né disponibilità. Senza, la categoria esce col solo nome.
   */
  note?: string;
};

/**
 * Le tre categorie di sempre, come le ha date la cliente (2026-10-07).
 *
 * Non sono più la lista dello Shop: quella è la tabella `categorie`, che lei
 * allunga da /admin/shop. Restano qui come riserva, per il tempo fra il
 * deploy e la migrazione 013, perché il menu non resti vuoto.
 *
 * Nessuna ha la riga di nota: quelle di prima erano inventate, e PRODUCT.md è
 * esplicito sul fatto che quello che manca si chiede e non si inventa.
 */
export const CATEGORIE_BASE: ShopCategory[] = [
  { slug: "illustrazioni-personalizzate", label: "Illustrazioni Personalizzate", vendita: false, visibile: true },
  { slug: "ritratti-illustrati", label: "Ritratti Illustrati", vendita: false, visibile: true },
  { slug: "stampe", label: "Stampe", vendita: true, visibile: true },
];

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

/** La pagina di un prodotto. La categoria va nell'indirizzo perché si legga dove si è. */
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

/* -------------------------------------------------------------- colori */

/**
 * Un colore in cui si sceglie il prodotto: la copertina del calendario.
 *
 * Non cambia il prezzo —quello resta del formato— e per questo è una scelta
 * a parte e non un formato in più: «A4 verde» e «A4 rosso» costano uguale, e
 * chi sceglie deve vedere due domande, non dieci righe di listino.
 */
export type Colore = {
  /** Come si chiama, in italiano: «Verde». È quello che resta nell'ordine. */
  nome: string;
  /** Il campione che si vede nella scheda, in esadecimale: «#5c7a4a». */
  tinta: string;
};

/**
 * I cinque colori della copertina del Calendario 2027, come li ha dati la
 * cliente (2026-11-05): verde, rosso, celeste, viola, giallo.
 *
 * Le tinte sono una proposta, non quelle della stampa: lei le corregge dal
 * modulo del prodotto perché il campione somigli alla copertina vera.
 */
export const COLORI_CALENDARIO: Colore[] = [
  { nome: "Verde", tinta: "#5e7d4f" },
  { nome: "Rosso", tinta: "#b5402f" },
  { nome: "Celeste", tinta: "#8ec3dc" },
  { nome: "Viola", tinta: "#7b5d9c" },
  { nome: "Giallo", tinta: "#e4b93e" },
];

/**
 * Quello che si è scelto, in una riga: «Da muro A4 · Copertina: verde».
 * Lo usano carrello, cassa, mail e ordini, così si legge uguale ovunque.
 */
export function variante(v: { formato: string; colore?: string | null }): string {
  // «Copertina: giallo» e non «Copertina giallo»: copertina è femminile e il
  // nome del colore no, quindi l'etichetta con i due punti regge con tutti.
  return v.colore ? `${v.formato} · Copertina: ${v.colore.toLowerCase()}` : v.formato;
}

/** Per le `key` di React e per confrontare righe del carrello: «slug|formato|colore». */
export function chiaveVoce(k: { slug: string; formato: string; colore?: string | null }): string {
  return `${k.slug}|${k.formato}|${k.colore ?? ""}`;
}

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

/**
 * Un prezzo con lo sconto, in centesimi interi: 20 € con il 15% fanno 17 €.
 * L'arrotondamento è al centesimo, e sempre lo stesso ovunque —scheda,
 * carrello, pagamento— perché è questa funzione sola a farlo.
 */
export function prezzoScontato(centesimi: number, percentuale: number | null | undefined): number {
  if (!percentuale) return centesimi;
  return Math.round((centesimi * (100 - percentuale)) / 100);
}

/**
 * Quanto toglie un codice sconto, in centesimi. Lo calcolano tutti e due, il
 * carrello per mostrarlo e il server per farlo pagare, con questa funzione e
 * con un solo arrotondamento sul totale: così non possono non coincidere.
 *
 * Le stampe già in uno sconto di stagione restano fuori: il codice non si
 * somma (cliente, 2026-10-09). La spedizione non entra mai.
 */
export function scontoCodice(
  voci: { prezzo: number; quantita: number; scontata?: boolean }[],
  percentuale: number,
): number {
  const base = voci.reduce((n, v) => (v.scontata ? n : n + v.prezzo * v.quantita), 0);
  return Math.round((base * percentuale) / 100);
}

/** I formati di una stampa con lo sconto applicato; senza sconto, gli stessi. */
export function formatiScontati(formati: Formato[], percentuale: number | null | undefined): Formato[] {
  return percentuale ? formati.map((f) => ({ ...f, prezzo: prezzoScontato(f.prezzo, percentuale) })) : formati;
}

/** Il prezzo più basso di una stampa, per «da 10 €» nelle griglie. */
export function prezzoMinimo(formati: Formato[]): number | null {
  return formati.length === 0 ? null : Math.min(...formati.map((f) => f.prezzo));
}
