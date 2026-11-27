import { query } from "@/lib/db";
import { prodottiPerSlug, type Prodotto } from "@/lib/prodotti";

/**
 * Le recensioni di chi ha comprato.
 *
 * Senza account: la porta è la chiave dell'ordine, nel link
 * /recensione/<chiave> che arriva solo a chi ha pagato —nella mail di
 * spedizione, o in quella che lei manda dall'ordine—. Si recensiscono i
 * prodotti di quell'ordine, e solo quando il pacco è partito o è stato
 * ritirato: prima non c'è niente da raccontare.
 *
 * Il link vale per un invio solo: quello che si lascia vuoto quella volta
 * non si recensisce più (vedi la 021).
 *
 * Chi ha comprato fuori dal sito —al mercato, in negozio— non ha un ordine:
 * lei gli dà un invito, un QR che apre la stessa pagina su un prodotto solo
 * e vale anche lui per un invio (vedi la 023). La chiave ha la stessa forma
 * di quella di un ordine, e la pagina cerca prima fra gli ordini.
 *
 * Le opere dell'archivio non si recensiscono: non si comprano.
 *
 * Escono subito nella pagina del prodotto. Lei le può cancellare dall'admin,
 * non riscriverle.
 */

export const MAX_RECENSIONE = { testo: 1200, autore: 60 } as const;

export type Recensione = {
  id: number;
  prodotto: number;
  voto: number;
  testo: string;
  autore: string;
  creata: Date;
};

export type Riepilogo = { media: number; numero: number };

/** Un prodotto dell'ordine, con la recensione se l'ha già lasciata. */
export type ProdottoDaRecensire = {
  prodotto: Prodotto;
  recensione: Recensione | null;
};

export type OrdineDaRecensire =
  | { stato: "nessuno" }
  /** Pagato ma non ancora partito o ritirato. */
  | { stato: "presto"; id: number; nome: string | null }
  | { stato: "rimborsato"; id: number }
  | {
      stato: "aperto";
      /** L'ordine, o l'invito quando `dalVivo`. */
      id: number;
      nome: string | null;
      prodotti: ProdottoDaRecensire[];
      /** Il link è già stato usato: non si scrive più niente. */
      usata: boolean;
      /** Un invito dato a mano, non un ordine del sito: un prodotto, nessun nome. */
      dalVivo: boolean;
    };

function hydrate(r: Record<string, unknown>): Recensione {
  return {
    id: Number(r.id),
    prodotto: Number(r.prodotto),
    voto: Number(r.voto),
    testo: String(r.testo),
    autore: String(r.autore),
    creata: new Date(String(r.created_at)),
  };
}

/** La chiave è esadecimale e di 32 caratteri: tutto il resto non arriva nemmeno al database. */
const chiaveValida = (c: string) => /^[0-9a-f]{32}$/.test(c);

/** Il nome di battesimo, per salutare e per proporre l'autore. */
export const nomeProprio = (nome: string | null) => nome?.trim().split(/\s+/)[0] || null;

/* ------------------------------------------------------------- per chi compra */

export async function ordinePerChiave(chiave: string): Promise<OrdineDaRecensire> {
  if (!chiaveValida(chiave)) return { stato: "nessuno" };
  const rows = await query<Record<string, unknown>>(
    `SELECT id, nome, stato, righe, recensione_usata_at FROM ordini WHERE recensione_chiave = $1`,
    [chiave],
  );
  const o = rows[0];
  if (!o) return invitoPerChiave(chiave);
  const id = Number(o.id);
  const nome = o.nome ? String(o.nome) : null;
  if (o.stato === "rimborsato") return { stato: "rimborsato", id };
  if (o.stato !== "spedito") return { stato: "presto", id, nome };

  // Gli slug delle righe, senza ripetizioni: due formati della stessa stampa
  // sono un prodotto solo da recensire. Un prodotto tolto dallo Shop non ha
  // più una pagina dove la recensione possa uscire, e quindi non si propone.
  const righe = Array.isArray(o.righe) ? (o.righe as { slug?: unknown }[]) : [];
  const slugs = [...new Set(righe.map((r) => String(r.slug ?? "")).filter(Boolean))];
  const [prodotti, fatte] = await Promise.all([
    prodottiPerSlug(slugs),
    query<Record<string, unknown>>(
      `SELECT id, prodotto, voto, testo, autore, created_at FROM recensioni WHERE ordine = $1`,
      [id],
    ),
  ]);
  const perProdotto = new Map(fatte.map(hydrate).map((r) => [r.prodotto, r]));
  const inOrdine = slugs
    .map((s) => prodotti.find((p) => p.slug === s))
    .filter((p): p is Prodotto => Boolean(p));

  return {
    stato: "aperto",
    id,
    nome,
    prodotti: inOrdine.map((p) => ({ prodotto: p, recensione: perProdotto.get(p.id) ?? null })),
    usata: o.recensione_usata_at != null,
    dalVivo: false,
  };
}

/**
 * Un invito: il prodotto per cui è stato fatto, se è ancora nello Shop, e la
 * recensione se l'ha già lasciata. Prima della 023 la tabella non c'è, e
 * nessuna chiave porta da nessuna parte.
 */
async function invitoPerChiave(chiave: string): Promise<OrdineDaRecensire> {
  const rows = await query<Record<string, unknown>>(
    `SELECT i.id, i.usato_at, p.slug
       FROM inviti_recensione i JOIN prodotti p ON p.id = i.prodotto
      WHERE i.chiave = $1`,
    [chiave],
  ).catch(() => []);
  const i = rows[0];
  if (!i) return { stato: "nessuno" };
  const id = Number(i.id);
  const [prodotti, fatte] = await Promise.all([
    prodottiPerSlug([String(i.slug)]),
    query<Record<string, unknown>>(
      `SELECT id, prodotto, voto, testo, autore, created_at FROM recensioni WHERE invito = $1`,
      [id],
    ),
  ]);
  const fatta = fatte[0] ? hydrate(fatte[0]) : null;
  return {
    stato: "aperto",
    id,
    nome: null,
    prodotti: prodotti.map((p) => ({ prodotto: p, recensione: fatta?.prodotto === p.id ? fatta : null })),
    usata: i.usato_at != null,
    dalVivo: true,
  };
}

export type VoceRecensione = { prodotto: number; voto: number; testo: string };

export type EsitoScrittura =
  | { ok: true; scritte: number }
  | { ok: false; motivo: "chiave" | "presto" | "rimborsato" | "usata" | "niente" };

/**
 * Scrive le recensioni di un ordine. La chiave si ricontrolla qui, non solo
 * nella pagina: un'azione si può chiamare anche senza passare dal modulo.
 * Un prodotto che non è nell'ordine si ignora.
 *
 * Segnare il link come usato e scrivere le recensioni è una frase SQL sola:
 * l'UPDATE prende la riga dell'ordine solo se il link è ancora libero, e
 * l'INSERT scrive solo se l'UPDATE l'ha presa. Due invii nello stesso
 * istante —due schede, un doppio clic— si mettono in fila sul lock della
 * riga, e il secondo trova il link già usato e non scrive niente.
 */
export async function scriviRecensioni(
  chiave: string,
  autore: string,
  voci: VoceRecensione[],
): Promise<EsitoScrittura> {
  const ordine = await ordinePerChiave(chiave);
  if (ordine.stato === "nessuno") return { ok: false, motivo: "chiave" };
  if (ordine.stato === "presto") return { ok: false, motivo: "presto" };
  if (ordine.stato === "rimborsato") return { ok: false, motivo: "rimborsato" };
  if (ordine.usata) return { ok: false, motivo: "usata" };

  const ammessi = new Set(ordine.prodotti.filter((p) => !p.recensione).map((p) => p.prodotto.id));
  const valide = voci.filter((v) => ammessi.has(v.prodotto));
  if (valide.length === 0) return { ok: false, motivo: "niente" };

  // Lo stesso, per un invito: un prodotto solo, nessun ordine.
  if (ordine.dalVivo) {
    const [v] = valide;
    const scritte = await query<{ id: number }>(
      `WITH presa AS (
         UPDATE inviti_recensione SET usato_at = now()
          WHERE id = $1 AND usato_at IS NULL
         RETURNING id, prodotto
       )
       INSERT INTO recensioni (invito, prodotto, voto, testo, autore)
       SELECT presa.id, presa.prodotto, $2::smallint, $3::text, $4::text FROM presa
       ON CONFLICT (invito) DO NOTHING
       RETURNING id`,
      [ordine.id, v.voto, v.testo, autore],
    );
    if (scritte.length === 0) return { ok: false, motivo: "usata" };
    return { ok: true, scritte: scritte.length };
  }

  const rows = await query<{ id: number }>(
    `WITH presa AS (
       UPDATE ordini SET recensione_usata_at = now()
        WHERE id = $1 AND recensione_usata_at IS NULL
       RETURNING id
     )
     INSERT INTO recensioni (ordine, prodotto, voto, testo, autore)
     SELECT presa.id, v.prodotto, v.voto, v.testo, $2
       FROM presa, jsonb_to_recordset($3::jsonb) AS v(prodotto integer, voto smallint, testo text)
     ON CONFLICT (ordine, prodotto) DO NOTHING
     RETURNING id`,
    [ordine.id, autore, JSON.stringify(valide)],
  );
  if (rows.length === 0) return { ok: false, motivo: "usata" };
  return { ok: true, scritte: rows.length };
}

/* ---------------------------------------------------------------- sul sito */

/**
 * Le recensioni di un prodotto, dalla più recente. Senza tabella —prima
 * della 020— o con il database giù, nessuna: la pagina del prodotto non
 * deve cadere per questo.
 */
export async function recensioniDelProdotto(prodotto: number): Promise<Recensione[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, prodotto, voto, testo, autore, created_at FROM recensioni
      WHERE prodotto = $1 ORDER BY created_at DESC`,
    [prodotto],
  ).catch(() => []);
  return rows.map(hydrate);
}

export function riepilogo(lista: { voto: number }[]): Riepilogo {
  if (lista.length === 0) return { media: 0, numero: 0 };
  return { media: lista.reduce((s, r) => s + r.voto, 0) / lista.length, numero: lista.length };
}

/* ----------------------------------------------------------------- l'admin */

/** `ordine` è vuoto per una recensione lasciata con un invito: chi l'ha scritta ha comprato fuori dal sito. */
export type RecensioneAdmin = Recensione & { ordine: number | null; titolo: string };

export async function listRecensioni(): Promise<RecensioneAdmin[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT r.id, r.prodotto, r.voto, r.testo, r.autore, r.created_at, r.ordine, p.title AS titolo
       FROM recensioni r JOIN prodotti p ON p.id = r.prodotto
      ORDER BY r.created_at DESC`,
  ).catch(() => []);
  return rows.map((r) => ({
    ...hydrate(r),
    ordine: r.ordine == null ? null : Number(r.ordine),
    titolo: String(r.titolo),
  }));
}

export async function cancellaRecensione(id: number): Promise<void> {
  await query(`DELETE FROM recensioni WHERE id = $1`, [id]);
}

/**
 * Per ogni ordine: la chiave, quando lei ha chiesto la recensione, se il link
 * è già stato usato e quante recensioni ne sono uscite.
 */
export type StatoRecensioneOrdine = { chiave: string; chiesta: Date | null; usata: boolean; lasciate: number };

export async function statoRecensioniOrdini(): Promise<Map<number, StatoRecensioneOrdine>> {
  const rows = await query<Record<string, unknown>>(
    `SELECT o.id, o.recensione_chiave, o.recensione_chiesta_at, o.recensione_usata_at,
            (SELECT count(*) FROM recensioni r WHERE r.ordine = o.id)::int AS lasciate
       FROM ordini o`,
  ).catch(() => []);
  return new Map(
    rows.map((r) => [
      Number(r.id),
      {
        chiave: String(r.recensione_chiave),
        chiesta: r.recensione_chiesta_at ? new Date(String(r.recensione_chiesta_at)) : null,
        usata: r.recensione_usata_at != null,
        lasciate: Number(r.lasciate),
      },
    ]),
  );
}

/** La chiave di un ordine, per il link della mail. Null prima della 020. */
export async function chiaveRecensione(ordine: number): Promise<string | null> {
  const rows = await query<{ recensione_chiave: string }>(
    `SELECT recensione_chiave FROM ordini WHERE id = $1`,
    [ordine],
  ).catch(() => []);
  return rows[0]?.recensione_chiave ?? null;
}

export async function segnaRecensioneChiesta(ordine: number): Promise<void> {
  await query(`UPDATE ordini SET recensione_chiesta_at = now() WHERE id = $1`, [ordine]);
}

/**
 * Gli ordini a cui chiedere la recensione tutti insieme: consegnati, mai
 * chiesta, con il link ancora da usare. Uno per persona —il più recente— perché chi ha
 * comprato tre volte non riceva tre mail uguali; `fratelli` sono gli altri
 * suoi ordini nella stessa situazione, da segnare come chiesti con lui.
 */
export type DaChiedere = { id: number; email: string; fratelli: number[] };

export async function ordiniDaChiedere(): Promise<DaChiedere[]> {
  const rows = await query<{ id: number; email: string }>(
    `SELECT o.id, lower(o.email) AS email FROM ordini o
      WHERE o.stato = 'spedito' AND o.recensione_chiesta_at IS NULL
        AND o.recensione_usata_at IS NULL
      ORDER BY o.created_at DESC`,
  ).catch(() => []);
  const perEmail = new Map<string, DaChiedere>();
  for (const r of rows) {
    const c = perEmail.get(r.email);
    if (c) c.fratelli.push(Number(r.id));
    else perEmail.set(r.email, { id: Number(r.id), email: r.email, fratelli: [] });
  }
  return [...perEmail.values()];
}

export async function segnaRecensioniChieste(ordini: number[]): Promise<void> {
  await query(`UPDATE ordini SET recensione_chiesta_at = now() WHERE id = ANY($1::int[])`, [ordini]);
}

export const linkRecensione = (origine: string, chiave: string) => `${origine}/recensione/${chiave}`;

/* ----------------------------------------------------------- gli inviti */

/** Quanti inviti si possono fare in una volta: un foglio A4 ne porta quattro. */
export const MAX_INVITI = 4;

/** Crea `quanti` inviti per un prodotto e ne restituisce le chiavi. */
export async function creaInviti(prodotto: number, quanti: number): Promise<string[]> {
  const n = Math.max(1, Math.min(MAX_INVITI, Math.floor(quanti)));
  const rows = await query<{ chiave: string }>(
    `INSERT INTO inviti_recensione (prodotto)
     SELECT $1 FROM generate_series(1, $2)
     RETURNING chiave`,
    [prodotto, n],
  );
  return rows.map((r) => r.chiave);
}

/** Per la scheda del prodotto: quanti QR ha dato e quanti sono tornati come recensione. */
export type ContoInviti = { dati: number; usati: number };

export async function contaInviti(prodotto: number): Promise<ContoInviti | null> {
  const rows = await query<{ dati: number; usati: number }>(
    `SELECT count(*)::int AS dati, count(usato_at)::int AS usati
       FROM inviti_recensione WHERE prodotto = $1`,
    [prodotto],
  ).catch(() => null);
  return rows?.[0] ?? null;
}

/** Se l'invito di questa chiave è già stato usato. Null se la chiave non è di un invito. */
export async function invitoUsato(chiave: string): Promise<boolean | null> {
  if (!chiaveValida(chiave)) return null;
  const rows = await query<{ usato: boolean }>(
    `SELECT usato_at IS NOT NULL AS usato FROM inviti_recensione WHERE chiave = $1`,
    [chiave],
  ).catch(() => []);
  return rows[0]?.usato ?? null;
}
