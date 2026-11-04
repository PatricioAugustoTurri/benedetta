import { cache } from "react";
import { CATEGORIE_BASE, esServizio, type ShopCategory } from "@/data/shop";
import { query, transaction } from "@/lib/db";

/**
 * Le categorie dello Shop, dalla tabella `categorie`. Le crea lei da
 * /admin/shop; le due di servizio e Stampe c'erano già.
 *
 * Una categoria che non è di servizio è come Stampe: una lista di prodotti
 * con formati, prezzo e carrello. Non c'è un terzo tipo.
 */

/** Una categoria come la vede l'admin: con il numero di prodotti dentro. */
export type CategoriaAdmin = ShopCategory & { prodotti: number; bozze: number };

function hydrate(row: Record<string, unknown>): ShopCategory {
  return {
    slug: String(row.slug),
    label: String(row.label),
    vendita: row.tipo === "prodotti",
    visibile: Boolean(row.visibile),
  };
}

/**
 * Tutte, nell'ordine del menu, nascoste comprese. Se la tabella non c'è
 * ancora —la migrazione 013 va dopo il deploy— risponde con le tre di
 * sempre, così il menu non resta vuoto nel frattempo.
 *
 * `cache` perché in una pagina la chiedono il menu, il footer e la pagina
 * stessa: una query sola per richiesta.
 */
export const listCategorie = cache(async (): Promise<ShopCategory[]> => {
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT slug, label, tipo, visibile FROM categorie ORDER BY position`,
    );
    return rows.map(hydrate);
  } catch {
    return CATEGORIE_BASE;
  }
});

/** Quelle che si vedono nel sito: menu, footer, porte di /shop, sitemap. */
export async function listCategorieVisibili(): Promise<ShopCategory[]> {
  return (await listCategorie()).filter((c) => c.visibile);
}

/**
 * Una categoria per il suo slug, nascosta compresa: la sua pagina risponde
 * lo stesso, perché lei la guardi prima di accenderla. Non la trova nessuno
 * che non abbia l'indirizzo, e non entra nella sitemap.
 */
export async function getCategoria(slug: string): Promise<ShopCategory | null> {
  return (await listCategorie()).find((c) => c.slug === slug) ?? null;
}

/** Per /admin/shop: ogni categoria con quanti prodotti ha, e quante bozze. */
export async function listCategorieAdmin(): Promise<CategoriaAdmin[]> {
  const [categorie, conti] = await Promise.all([
    listCategorie(),
    query<{ categoria: string; tutti: number; bozze: number }>(
      `SELECT categoria, count(*)::int AS tutti, count(*) FILTER (WHERE NOT pubblicato)::int AS bozze
         FROM prodotti GROUP BY categoria`,
    ),
  ]);
  const per = new Map(conti.map((c) => [c.categoria, c]));
  return categorie.map((c) => ({
    ...c,
    prodotti: per.get(c.slug)?.tutti ?? 0,
    bozze: per.get(c.slug)?.bozze ?? 0,
  }));
}

/**
 * Stampe e i due servizi non si cancellano: il sito li nomina per nome in
 * più posti —la newsletter, gli sconti, «Disponibile come stampa»—.
 */
export function categoriaFissa(slug: string): boolean {
  return slug === "stampe" || esServizio(slug);
}

/** Una categoria nuova va in fondo al menu, e nasce nascosta. */
export async function creaCategoria(input: { slug: string; label: string }): Promise<ShopCategory> {
  return transaction(async (run) => {
    await run(`LOCK TABLE categorie IN SHARE ROW EXCLUSIVE MODE`);
    const rows = await run<Record<string, unknown>>(
      `INSERT INTO categorie (slug, label, tipo, visibile, position)
            VALUES ($1, $2, 'prodotti', false, (SELECT COALESCE(MAX(position), 0) + 1 FROM categorie))
         RETURNING slug, label, tipo, visibile`,
      [input.slug, input.label],
    );
    return hydrate(rows[0]);
  });
}

/** Nome e visibilità. Lo slug no: è nell'indirizzo di tutto quello che contiene. */
export async function aggiornaCategoria(slug: string, input: { label: string; visibile: boolean }): Promise<void> {
  await query(`UPDATE categorie SET label = $2, visibile = $3 WHERE slug = $1`, [slug, input.label, input.visibile]);
}

/**
 * Sposta una categoria di un posto, su o giù, scambiandola con la vicina.
 * Sono poche e si leggono in colonna: due frecce bastano.
 */
export async function spostaCategoria(slug: string, verso: "su" | "giu"): Promise<void> {
  await transaction(async (run) => {
    const righe = await run<{ slug: string; position: number }>(
      `SELECT slug, position FROM categorie ORDER BY position FOR UPDATE`,
    );
    const i = righe.findIndex((r) => r.slug === slug);
    const j = verso === "su" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= righe.length) return;
    // Il vincolo sui posti è differito: lo scambio passa per un momento in
    // cui due righe hanno lo stesso numero.
    await run(`UPDATE categorie SET position = $2 WHERE slug = $1`, [righe[i].slug, righe[j].position]);
    await run(`UPDATE categorie SET position = $2 WHERE slug = $1`, [righe[j].slug, righe[i].position]);
  });
}

/**
 * Cancella una categoria vuota. Restituisce false se dentro c'è ancora un
 * prodotto, anche una bozza: quei prodotti resterebbero senza casa. Il
 * database lo rifiuterebbe comunque; qui si controlla prima per dirlo in
 * parole.
 */
export async function cancellaCategoria(slug: string): Promise<boolean> {
  if (categoriaFissa(slug)) return false;
  return transaction(async (run) => {
    const dentro = await run<{ n: number }>(`SELECT count(*)::int AS n FROM prodotti WHERE categoria = $1`, [slug]);
    if (dentro[0].n > 0) return false;
    await run(`DELETE FROM categorie WHERE slug = $1`, [slug]);
    return true;
  });
}
