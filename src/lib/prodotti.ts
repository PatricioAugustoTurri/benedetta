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
  /**
   * La stampa appesa in una stanza. Nella griglia dello Shop prende il posto
   * della copertina quando il mouse si ferma sopra; senza, la copertina resta.
   */
  mockup: WorkImage | null;
  pubblicato: boolean;
};

export type ProdottoInput = Omit<Prodotto, "id">;

const COLONNE = `id, categoria, slug, title, description, image, formati, opera_slug, mockup, pubblicato`;

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
    mockup:
      row.mockup && typeof row.mockup === "object" ? (row.mockup as WorkImage) : null,
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
      `INSERT INTO prodotti (categoria, slug, title, description, image, formati, opera_slug, pubblicato, mockup, position)
            VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9::jsonb,
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
        input.mockup ? JSON.stringify(input.mockup) : null,
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
              formati = $7::jsonb, opera_slug = $8, pubblicato = $9, mockup = $10::jsonb,
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
        input.mockup ? JSON.stringify(input.mockup) : null,
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
  /** Quanto ha tolto un codice sconto, in centesimi; 0 senza codice. */
  sconto: number;
  /** Il codice usato, così come valeva quel giorno. */
  codice: string | null;
  spedizione: number;
  totale: number;
  stato: "pagato" | "spedito";
  creato: Date;
  /** Quando è partito, con chi e con che numero: arriva per mail a chi ha comprato. */
  spedito: Date | null;
  corriere: string | null;
  tracking: string | null;
  /** Quando è partita la mail di spedizione al cliente. */
  avvisato: Date | null;
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
    sconto: Number(row.sconto ?? 0),
    codice: row.codice ? String(row.codice) : null,
    spedizione: Number(row.spedizione),
    totale: Number(row.totale),
    stato: row.stato === "spedito" ? "spedito" : "pagato",
    creato: new Date(String(row.created_at)),
    spedito: row.spedito_at ? new Date(String(row.spedito_at)) : null,
    corriere: row.corriere ? String(row.corriere) : null,
    tracking: row.tracking ? String(row.tracking) : null,
    avvisato: row.cliente_avvisato_at ? new Date(String(row.cliente_avvisato_at)) : null,
  };
}

const COLONNE_ORDINE = `id, stripe_session_id, nome, email, indirizzo, righe, subtotale, sconto, codice, spedizione, totale, stato, created_at, spedito_at, corriere, tracking, cliente_avvisato_at`;

/**
 * Scrive un ordine pagato. Restituisce null se c'era già: Stripe ripete gli
 * eventi quando non riceve risposta in tempo, e la seconda volta non deve
 * nascere un secondo ordine né partire un secondo avviso.
 */
export async function registraOrdine(
  o: Omit<Ordine, "id" | "stato" | "creato" | "spedito" | "corriere" | "tracking" | "avvisato">,
): Promise<Ordine | null> {
  const rows = await query<Record<string, unknown>>(
    `INSERT INTO ordini (stripe_session_id, nome, email, indirizzo, righe, subtotale, spedizione, totale, sconto, codice)
          VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, $9, $10)
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
      o.sconto,
      o.codice,
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

export async function getOrdine(id: number): Promise<Ordine | null> {
  const rows = await query<Record<string, unknown>>(
    `SELECT ${COLONNE_ORDINE} FROM ordini WHERE id = $1`,
    [id],
  );
  return rows[0] ? hydrateOrdine(rows[0]) : null;
}

/**
 * Segna un ordine come spedito, con il corriere e il numero se ci sono.
 * Restituisce l'ordine aggiornato, o null se era già spedito: la mail al
 * cliente parte una volta sola anche se il modulo arriva due volte.
 */
export async function segnaSpedito(
  id: number,
  spedizione: { corriere: string | null; tracking: string | null },
): Promise<Ordine | null> {
  const rows = await query<Record<string, unknown>>(
    `UPDATE ordini SET stato = 'spedito', spedito_at = now(), corriere = $2, tracking = $3
      WHERE id = $1 AND stato <> 'spedito'
  RETURNING ${COLONNE_ORDINE}`,
    [id, spedizione.corriere, spedizione.tracking],
  );
  return rows[0] ? hydrateOrdine(rows[0]) : null;
}

export async function segnaAvvisato(id: number): Promise<void> {
  await query(`UPDATE ordini SET cliente_avvisato_at = now() WHERE id = $1`, [id]);
}

/** Rimette un ordine fra quelli da spedire, per un errore di clic. Corriere e numero restano scritti. */
export async function rimettiDaSpedire(id: number): Promise<void> {
  await query(`UPDATE ordini SET stato = 'pagato', spedito_at = NULL WHERE id = $1`, [id]);
}

/** L'ultimo corriere usato, per proporlo già scritto nel prossimo ordine. */
export async function ultimoCorriere(): Promise<string | null> {
  const rows = await query<{ corriere: string }>(
    `SELECT corriere FROM ordini WHERE corriere IS NOT NULL ORDER BY spedito_at DESC NULLS LAST LIMIT 1`,
  );
  return rows[0]?.corriere ?? null;
}
