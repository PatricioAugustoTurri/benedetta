import { query, transaction } from "@/lib/db";
import { oggiInItalia } from "@/lib/oggi";
import { listPubblicati, type Prodotto } from "@/lib/prodotti";

/**
 * Gli sconti di stagione: un nome, una percentuale, due date e le stampe che
 * entrano. Lei li prepara dall'admin anche settimane prima; nel sito escono
 * —e valgono— solo fra il primo e l'ultimo giorno, con l'ora italiana.
 *
 * Lo sconto non è una scritta: `scontiInCorso` è quello che il carrello e il
 * pagamento usano per calcolare il prezzo. Quello che si vede è quello che si
 * paga.
 */
export type Sconto = {
  id: number;
  titolo: string;
  testo: string | null;
  percentuale: number;
  /** «2026-12-01», compreso. */
  dal: string;
  /** «2026-12-24», compreso. */
  al: string;
  attivo: boolean;
  /** Gli id delle stampe, nell'ordine in cui escono. */
  stampe: number[];
};

export type StatoSconto = "in corso" | "programmato" | "finito" | "spento";

export function statoSconto(s: Pick<Sconto, "dal" | "al" | "attivo">, oggi = oggiInItalia()): StatoSconto {
  if (!s.attivo) return "spento";
  if (oggi < s.dal) return "programmato";
  if (oggi > s.al) return "finito";
  return "in corso";
}

const data = (v: unknown) =>
  v instanceof Date
    ? `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`
    : String(v).slice(0, 10);

function hydrate(r: Record<string, unknown>): Sconto {
  return {
    id: Number(r.id),
    titolo: String(r.titolo),
    testo: r.testo ? String(r.testo) : null,
    percentuale: Number(r.percentuale),
    dal: data(r.dal),
    al: data(r.al),
    attivo: Boolean(r.attivo),
    stampe: Array.isArray(r.stampe) ? (r.stampe as unknown[]).map(Number).filter(Boolean) : [],
  };
}

// Le date escono come testo, così il fuso del server non le sposta di un giorno.
const COLONNE = `s.id, s.titolo, s.testo, s.percentuale, s.dal::text AS dal, s.al::text AS al, s.attivo,
  COALESCE((SELECT array_agg(ss.prodotto_id ORDER BY ss.posizione, ss.prodotto_id)
              FROM sconti_stampe ss WHERE ss.sconto_id = s.id), '{}') AS stampe`;

/** Tutti, dal più vicino a oggi. Per l'admin. Senza tabella (prima della 009), nessuno. */
export async function listSconti(): Promise<Sconto[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT ${COLONNE} FROM sconti s ORDER BY s.al DESC, s.id DESC`,
  ).catch(() => []);
  return rows.map(hydrate);
}

export async function getSconto(id: number): Promise<Sconto | null> {
  const rows = await query<Record<string, unknown>>(`SELECT ${COLONNE} FROM sconti s WHERE s.id = $1`, [id]);
  return rows[0] ? hydrate(rows[0]) : null;
}

/** Crea o aggiorna uno sconto, con le sue stampe nell'ordine dato. */
export async function salvaSconto(input: Omit<Sconto, "id"> & { id?: number }): Promise<number> {
  return transaction(async (run) => {
    let id = input.id;
    if (id) {
      await run(
        `UPDATE sconti SET titolo = $2, testo = $3, percentuale = $4, dal = $5, al = $6, attivo = $7 WHERE id = $1`,
        [id, input.titolo, input.testo, input.percentuale, input.dal, input.al, input.attivo],
      );
      await run(`DELETE FROM sconti_stampe WHERE sconto_id = $1`, [id]);
    } else {
      const [r] = await run<{ id: number }>(
        `INSERT INTO sconti (titolo, testo, percentuale, dal, al, attivo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [input.titolo, input.testo, input.percentuale, input.dal, input.al, input.attivo],
      );
      id = Number(r.id);
    }
    if (input.stampe.length > 0) {
      await run(
        `INSERT INTO sconti_stampe (sconto_id, prodotto_id, posizione)
         SELECT $1, p, ord FROM unnest($2::int[]) WITH ORDINALITY AS t(p, ord)
          WHERE EXISTS (SELECT 1 FROM prodotti WHERE id = p)`,
        [id, input.stampe],
      );
    }
    return id!;
  });
}

export async function cancellaSconto(id: number): Promise<void> {
  await query(`DELETE FROM sconti WHERE id = $1`, [id]);
}

/** Uno sconto in corso, con le sue stampe pubblicate già lette. */
export type ScontoInCorso = Sconto & { prodotti: Prodotto[] };

/**
 * Gli sconti che valgono oggi, con le stampe pubblicate che contengono.
 * Uno sconto rimasto senza stampe pubblicate non esce: sarebbe un titolo
 * sopra il vuoto.
 */
export async function scontiInCorsoConStampe(): Promise<ScontoInCorso[]> {
  const oggi = oggiInItalia();
  const tutti = (await listSconti()).filter((s) => statoSconto(s, oggi) === "in corso");
  if (tutti.length === 0) return [];
  const pubblicate = new Map((await listPubblicati("stampe")).map((p) => [p.id, p]));
  return tutti
    .map((s) => ({ ...s, prodotti: s.stampe.map((id) => pubblicate.get(id)).filter((p): p is Prodotto => !!p) }))
    .filter((s) => s.prodotti.length > 0)
    .sort((a, b) => (a.al < b.al ? -1 : 1));
}

/**
 * La percentuale di sconto di ogni stampa, oggi. Se una stampa è in due
 * sconti insieme, vale il più alto: a chi compra si dà il prezzo migliore.
 */
export type ScontoStampa = { percentuale: number; titolo: string; dal: string; al: string };

export async function scontiInCorso(): Promise<Map<number, ScontoStampa>> {
  const oggi = oggiInItalia();
  const mappa = new Map<number, ScontoStampa>();
  for (const s of await listSconti()) {
    if (statoSconto(s, oggi) !== "in corso") continue;
    for (const id of s.stampe) {
      const prima = mappa.get(id);
      if (!prima || s.percentuale > prima.percentuale) {
        mappa.set(id, { percentuale: s.percentuale, titolo: s.titolo, dal: s.dal, al: s.al });
      }
    }
  }
  return mappa;
}
