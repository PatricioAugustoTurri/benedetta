import {
  esServizio,
  shopCategories,
  type ShopCategoria,
  type ShopCategory,
} from "@/data/shop";
import { query } from "@/lib/db";
import { listPubblicati } from "@/lib/prodotti";
import { listServizi } from "@/lib/servizi";
import type { WorkImage } from "@/lib/works";

/**
 * L'immagine di ogni categoria nella pagina /shop, quella che lei sceglie da
 * /admin/shop/copertine. Non è di un prodotto né di un servizio: è la porta
 * della categoria.
 *
 * Una categoria senza copertina semplicemente non c'è nella mappa.
 */
export type Copertine = Partial<Record<ShopCategoria, WorkImage>>;

/**
 * Tutte le copertine. Se la tabella non esiste ancora —la migrazione 005 va
 * dopo il deploy— risponde vuoto, e la pagina usa le immagini di riserva.
 */
export async function listCopertine(): Promise<Copertine> {
  const rows = await query<{ categoria: ShopCategoria; immagine: WorkImage }>(
    `SELECT categoria, immagine FROM copertine`,
  ).catch(() => []);
  return Object.fromEntries(rows.map((r) => [r.categoria, r.immagine]));
}

/** Mette, cambia o toglie la copertina di una categoria. */
export async function setCopertina(categoria: ShopCategoria, immagine: WorkImage | null): Promise<void> {
  if (immagine) {
    await query(
      `INSERT INTO copertine (categoria, immagine) VALUES ($1, $2::jsonb)
       ON CONFLICT (categoria) DO UPDATE SET immagine = EXCLUDED.immagine`,
      [categoria, JSON.stringify(immagine)],
    );
  } else {
    await query(`DELETE FROM copertine WHERE categoria = $1`, [categoria]);
  }
}

/** Una categoria come esce nella pagina /shop: la sua immagine e il nome. */
export type Porta = {
  categoria: ShopCategory;
  /** La copertina scelta, o quella di riserva. Null solo se non c'è nessuna immagine da nessuna parte. */
  immagine: WorkImage | null;
  /** Se l'immagine è stata scelta da lei o è quella di riserva. Per l'admin. */
  scelta: boolean;
};

/**
 * Le porte della pagina /shop, nell'ordine delle categorie.
 *
 * Senza copertina scelta si usa la prima immagine del servizio, o della prima
 * stampa pubblicata: la porta non resta mai vuota per una scelta non ancora
 * fatta.
 */
export async function listPorte(): Promise<Porta[]> {
  const [copertine, servizi, stampe] = await Promise.all([
    listCopertine(),
    listServizi(),
    listPubblicati("stampe"),
  ]);

  return shopCategories.map((c) => {
    const scelta = copertine[c.slug] ?? null;
    const riserva = esServizio(c.slug)
      ? (servizi.find((s) => s.slug === c.slug)?.image[0] ?? null)
      : (stampe[0]?.image[0] ?? null);
    return {
      categoria: c,
      immagine: scelta ?? riserva,
      scelta: scelta !== null,
    };
  });
}
