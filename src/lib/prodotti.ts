import type { Formato, ShopCategoria } from "@/data/shop";
import { query, transaction } from "@/lib/db";
import type { WorkImage } from "@/lib/works";

/**
 * Una stampa dello Shop: una riga della tabella `prodotti`. Ritratti e
 * illustrazioni non sono prodotti ma servizi: vedi `src/lib/servizi.ts`.
 *
 * Le immagini hanno la stessa forma di quelle delle opere —stesso Cloudinary,
 * stesso modulo di caricamento— e per questo il tipo è lo stesso.
 */
export type Prodotto = {
  id: number;
  categoria: ShopCategoria;
  slug: string;
  title: string;
  description: string | null;
  image: WorkImage[];
  /** Almeno uno: lo garantisce il database. */
  formati: Formato[];
  operaSlug: string | null;
  pubblicato: boolean;
};

export type ProdottoInput = Omit<Prodotto, "id">;

const COLONNE = `id, categoria, slug, title, description, image, formati, opera_slug, pubblicato`;

function hydrate(row: Record<string, unknown>): Prodotto {
  return {
    id: Number(row.id),
    categoria: String(row.categoria) as ShopCategoria,
    slug: String(row.slug),
    title: String(row.title),
    description: row.description === null ? null : String(row.description),
    image: Array.isArray(row.image) ? (row.image as WorkImage[]) : [],
    formati: Array.isArray(row.formati) ? (row.formati as Formato[]) : [],
    operaSlug: row.opera_slug === null ? null : String(row.opera_slug),
    pubblicato: Boolean(row.pubblicato),
  };
}

/**
 * Tutti i prodotti, bozze comprese, nell'ordine di ogni categoria. Per
 * l'admin: il sito pubblico usa `listPubblicati`.
 */
export async function listProdotti(): Promise<Prodotto[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT ${COLONNE} FROM prodotti ORDER BY categoria, position ASC, id DESC`,
  );
  return rows.map(hydrate);
}

/**
 * Quello che si vede nello Shop. Le bozze non escono da qui in nessun caso:
 * il filtro vive nella query e non nella pagina, così nessuna pagina nuova
 * può dimenticarselo.
 */
export async function listPubblicati(categoria?: ShopCategoria): Promise<Prodotto[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT ${COLONNE} FROM prodotti
      WHERE pubblicato AND ($1::text IS NULL OR categoria = $1)
      ORDER BY categoria, position ASC, id DESC`,
    [categoria ?? null],
  );
  return rows.map(hydrate);
}

/** Un prodotto pubblicato per il suo slug. Una bozza risponde come se non esistesse. */
export async function getPubblicato(slug: string): Promise<Prodotto | null> {
  const rows = await query<Record<string, unknown>>(
    `SELECT ${COLONNE} FROM prodotti WHERE slug = $1 AND pubblicato`,
    [slug],
  );
  return rows[0] ? hydrate(rows[0]) : null;
}

export async function getProdottoById(id: number): Promise<Prodotto | null> {
  const rows = await query<Record<string, unknown>>(
    `SELECT ${COLONNE} FROM prodotti WHERE id = $1`,
    [id],
  );
  return rows[0] ? hydrate(rows[0]) : null;
}

/** Le stampe pubblicate che escono da un'opera, per «Disponibile come stampa». */
export async function stampeDellOpera(operaSlug: string): Promise<Prodotto[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT ${COLONNE} FROM prodotti
      WHERE pubblicato AND categoria = 'stampe' AND opera_slug = $1
      ORDER BY position ASC, id DESC`,
    [operaSlug],
  );
  return rows.map(hydrate);
}

/**
 * Le stampe pubblicate con questi slug, per il carrello e il pagamento.
 *
 * Il carrello vive nel browser e quello che dice si può riscrivere a mano:
 * prezzo, titolo, persino che un prodotto sia una stampa. Per questo chi
 * calcola un totale passa sempre di qui e prende tutto dalla tabella.
 */
export async function stampePerSlug(slugs: string[]): Promise<Prodotto[]> {
  if (slugs.length === 0) return [];
  const rows = await query<Record<string, unknown>>(
    `SELECT ${COLONNE} FROM prodotti
      WHERE pubblicato AND categoria = 'stampe' AND slug = ANY($1::text[])`,
    [slugs],
  );
  return rows.map(hydrate);
}

/**
 * Un prodotto nuovo entra primo nella sua categoria, come un'opera nuova apre
 * l'archivio. Il lock è lo stesso di `createWork` e per la stessa ragione: fra
 * leggere il minimo e scrivere non deve entrare nessun altro.
 */
export async function createProdotto(input: ProdottoInput): Promise<Prodotto> {
  return transaction(async (run) => {
    await run(`LOCK TABLE prodotti IN SHARE ROW EXCLUSIVE MODE`);
    const rows = await run<Record<string, unknown>>(
      `INSERT INTO prodotti (categoria, slug, title, description, image, formati, opera_slug, pubblicato, position)
            VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8,
                    (SELECT COALESCE(MIN(position), 1) - 1 FROM prodotti WHERE categoria = $1))
         RETURNING ${COLONNE}`,
      [
        input.categoria,
        input.slug,
        input.title,
        input.description,
        JSON.stringify(input.image),
        JSON.stringify(input.formati),
        input.operaSlug,
        input.pubblicato,
      ],
    );
    return hydrate(rows[0]);
  });
}

/**
 * Cambiare categoria sposta il prodotto in cima a quella nuova: il posto che
 * aveva vale solo fra i suoi vecchi vicini.
 */
export async function updateProdotto(id: number, input: ProdottoInput): Promise<Prodotto> {
  return transaction(async (run) => {
    await run(`LOCK TABLE prodotti IN SHARE ROW EXCLUSIVE MODE`);
    const rows = await run<Record<string, unknown>>(
      `UPDATE prodotti
          SET categoria = $2, slug = $3, title = $4, description = $5, image = $6::jsonb,
              formati = $7::jsonb, opera_slug = $8, pubblicato = $9,
              position = CASE WHEN categoria = $2 THEN position
                              ELSE (SELECT COALESCE(MIN(position), 1) - 1 FROM prodotti WHERE categoria = $2)
                         END
        WHERE id = $1
    RETURNING ${COLONNE}`,
      [
        id,
        input.categoria,
        input.slug,
        input.title,
        input.description,
        JSON.stringify(input.image),
        JSON.stringify(input.formati),
        input.operaSlug,
        input.pubblicato,
      ],
    );
    return hydrate(rows[0]);
  });
}

export async function deleteProdotto(id: number): Promise<Prodotto | null> {
  const rows = await query<Record<string, unknown>>(
    `DELETE FROM prodotti WHERE id = $1 RETURNING ${COLONNE}`,
    [id],
  );
  return rows[0] ? hydrate(rows[0]) : null;
}

/**
 * Scambia di posto un prodotto con il vicino sopra o sotto nella sua
 * categoria. Con poche righe per categoria, due frecce dicono tutto quello che
 * serve; il trascinamento della griglia d'opera resta là, dove le righe sono
 * tante e si giudicano a colpo d'occhio.
 */
export async function spostaProdotto(id: number, verso: -1 | 1): Promise<boolean> {
  return transaction(async (run) => {
    const [io] = await run<{ categoria: string; position: number }>(
      `SELECT categoria, position FROM prodotti WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (!io) return false;

    const [vicino] = await run<{ id: number; position: number }>(
      verso === -1
        ? `SELECT id, position FROM prodotti WHERE categoria = $1 AND position < $2
            ORDER BY position DESC LIMIT 1 FOR UPDATE`
        : `SELECT id, position FROM prodotti WHERE categoria = $1 AND position > $2
            ORDER BY position ASC LIMIT 1 FOR UPDATE`,
      [io.categoria, io.position],
    );
    if (!vicino) return false;

    // Il vincolo è differito: per un istante i due hanno lo stesso posto.
    await run(`UPDATE prodotti SET position = $2 WHERE id = $1`, [id, vicino.position]);
    await run(`UPDATE prodotti SET position = $2 WHERE id = $1`, [vicino.id, io.position]);
    return true;
  });
}

/* --------------------------------------------------------------- ordini */

export type RigaOrdine = {
  slug: string;
  title: string;
  formato: string;
  /** Centesimi, per unità. */
  prezzo: number;
  quantita: number;
};

export type Indirizzo = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  postal_code: string | null;
  state: string | null;
  country: string | null;
};

export type Ordine = {
  id: number;
  stripeSessionId: string;
  nome: string | null;
  email: string;
  indirizzo: Indirizzo;
  righe: RigaOrdine[];
  subtotale: number;
  spedizione: number;
  totale: number;
  stato: "pagato" | "spedito";
  creato: Date;
};

function hydrateOrdine(row: Record<string, unknown>): Ordine {
  return {
    id: Number(row.id),
    stripeSessionId: String(row.stripe_session_id),
    nome: row.nome === null ? null : String(row.nome),
    email: String(row.email),
    indirizzo: row.indirizzo as Indirizzo,
    righe: Array.isArray(row.righe) ? (row.righe as RigaOrdine[]) : [],
    subtotale: Number(row.subtotale),
    spedizione: Number(row.spedizione),
    totale: Number(row.totale),
    stato: row.stato === "spedito" ? "spedito" : "pagato",
    creato: new Date(String(row.created_at)),
  };
}

const COLONNE_ORDINE = `id, stripe_session_id, nome, email, indirizzo, righe, subtotale, spedizione, totale, stato, created_at`;

/**
 * Scrive un ordine pagato. Restituisce null se c'era già: Stripe ripete gli
 * eventi quando non riceve risposta in tempo, e la seconda volta non deve
 * nascere un secondo ordine né partire un secondo avviso.
 */
export async function registraOrdine(
  o: Omit<Ordine, "id" | "stato" | "creato">,
): Promise<Ordine | null> {
  const rows = await query<Record<string, unknown>>(
    `INSERT INTO ordini (stripe_session_id, nome, email, indirizzo, righe, subtotale, spedizione, totale)
          VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8)
     ON CONFLICT (stripe_session_id) DO NOTHING
       RETURNING ${COLONNE_ORDINE}`,
    [
      o.stripeSessionId,
      o.nome,
      o.email,
      JSON.stringify(o.indirizzo),
      JSON.stringify(o.righe),
      o.subtotale,
      o.spedizione,
      o.totale,
    ],
  );
  return rows[0] ? hydrateOrdine(rows[0]) : null;
}

export async function listOrdini(): Promise<Ordine[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT ${COLONNE_ORDINE} FROM ordini ORDER BY created_at DESC`,
  );
  return rows.map(hydrateOrdine);
}

export async function segnaOrdine(id: number, stato: Ordine["stato"]): Promise<void> {
  await query(`UPDATE ordini SET stato = $2 WHERE id = $1`, [id, stato]);
}
