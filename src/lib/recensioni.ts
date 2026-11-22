import { query } from "@/lib/db";
import { prodottiPerSlug, type Prodotto } from "@/lib/prodotti";

/**
 * Le recensioni di chi ha comprato.
 *
 * Senza account: la porta è la chiave dell'ordine, nel link
 * /recensione/<chiave> che arriva solo a chi ha pagato —nella mail di
 * spedizione, o in quella che lei manda dall'ordine—. Si recensiscono i
 * prodotti di quell'ordine, uno per uno e una volta sola, e solo quando il
 * pacco è partito o è stato ritirato: prima non c'è niente da raccontare.
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
  | { stato: "aperto"; id: number; nome: string | null; prodotti: ProdottoDaRecensire[] };

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
    `SELECT id, nome, stato, righe FROM ordini WHERE recensione_chiave = $1`,
    [chiave],
  );
  const o = rows[0];
  if (!o) return { stato: "nessuno" };
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
  };
}

export type VoceRecensione = { prodotto: number; voto: number; testo: string };

export type EsitoScrittura =
  | { ok: true; scritte: number }
  | { ok: false; motivo: "chiave" | "presto" | "rimborsato" | "niente" };

/**
 * Scrive le recensioni di un ordine. La chiave si ricontrolla qui, non solo
 * nella pagina: un'azione si può chiamare anche senza passare dal modulo.
 * Un prodotto che non è nell'ordine si ignora, e uno già recensito non si
 * riscrive (ON CONFLICT): così un doppio invio non fa due recensioni.
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

  const ammessi = new Set(ordine.prodotti.filter((p) => !p.recensione).map((p) => p.prodotto.id));
  const valide = voci.filter((v) => ammessi.has(v.prodotto));
  if (valide.length === 0) return { ok: false, motivo: "niente" };

  const rows = await query<{ id: number }>(
    `INSERT INTO recensioni (ordine, prodotto, voto, testo, autore)
     SELECT $1, v.prodotto, v.voto, v.testo, $2
       FROM jsonb_to_recordset($3::jsonb) AS v(prodotto integer, voto smallint, testo text)
     ON CONFLICT (ordine, prodotto) DO NOTHING
     RETURNING id`,
    [ordine.id, autore, JSON.stringify(valide)],
  );
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

export type RecensioneAdmin = Recensione & { ordine: number; titolo: string };

export async function listRecensioni(): Promise<RecensioneAdmin[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT r.id, r.prodotto, r.voto, r.testo, r.autore, r.created_at, r.ordine, p.title AS titolo
       FROM recensioni r JOIN prodotti p ON p.id = r.prodotto
      ORDER BY r.created_at DESC`,
  ).catch(() => []);
  return rows.map((r) => ({ ...hydrate(r), ordine: Number(r.ordine), titolo: String(r.titolo) }));
}

export async function cancellaRecensione(id: number): Promise<void> {
  await query(`DELETE FROM recensioni WHERE id = $1`, [id]);
}

/** Per ogni ordine: la chiave, quando lei ha chiesto la recensione e quante ne ha lasciate. */
export type StatoRecensioneOrdine = { chiave: string; chiesta: Date | null; lasciate: number };

export async function statoRecensioniOrdini(): Promise<Map<number, StatoRecensioneOrdine>> {
  const rows = await query<Record<string, unknown>>(
    `SELECT o.id, o.recensione_chiave, o.recensione_chiesta_at,
            (SELECT count(*) FROM recensioni r WHERE r.ordine = o.id)::int AS lasciate
       FROM ordini o`,
  ).catch(() => []);
  return new Map(
    rows.map((r) => [
      Number(r.id),
      {
        chiave: String(r.recensione_chiave),
        chiesta: r.recensione_chiesta_at ? new Date(String(r.recensione_chiesta_at)) : null,
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
 * chiesta, senza recensioni. Uno per persona —il più recente— perché chi ha
 * comprato tre volte non riceva tre mail uguali; `fratelli` sono gli altri
 * suoi ordini nella stessa situazione, da segnare come chiesti con lui.
 */
export type DaChiedere = { id: number; email: string; fratelli: number[] };

export async function ordiniDaChiedere(): Promise<DaChiedere[]> {
  const rows = await query<{ id: number; email: string }>(
    `SELECT o.id, lower(o.email) AS email FROM ordini o
      WHERE o.stato = 'spedito' AND o.recensione_chiesta_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM recensioni r WHERE r.ordine = o.id)
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
