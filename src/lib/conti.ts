import { query } from "@/lib/db";

/**
 * I conti di lei, mese per mese: quello che entra —in contanti, con bonifico,
 * dal sito— e quello che spende.
 *
 * Contanti, bonifici e spese li scrive lei a mano (tabella `movimenti`). Le
 * vendite del sito no: si leggono dagli ordini pagati, così non c'è niente da
 * ricopiare e niente che possa non tornare. Un ordine rimborsato non conta.
 * Come tutto il negozio, in centesimi e con l'ora italiana.
 */

export type Canale = "contanti" | "bonifico";

export type Movimento = {
  id: number;
  /** «2026-11-19». */
  giorno: string;
  tipo: "vendita" | "spesa";
  /** Solo per le vendite. */
  canale: Canale | null;
  importo: number;
  nota: string | null;
};

export type MovimentoInput = Omit<Movimento, "id">;

/** Le cifre di un mese, in centesimi. */
export type ContoMese = {
  /** 1–12. */
  mese: number;
  contanti: number;
  bonifico: number;
  sito: number;
  /** Quanti ordini del sito. */
  ordini: number;
  spese: number;
};

export const venditeDi = (c: ContoMese) => c.contanti + c.bonifico + c.sito;
export const nettoDi = (c: ContoMese) => venditeDi(c) - c.spese;

/** Le dodici righe di un anno, anche quelle vuote. */
export async function contiAnno(anno: number): Promise<ContoMese[]> {
  const [movimenti, ordini] = await Promise.all([
    query<{ mese: number; tipo: string; canale: string | null; somma: string }>(
      `SELECT extract(month FROM giorno)::int AS mese, tipo, canale, sum(importo)::bigint AS somma
         FROM movimenti
        WHERE giorno >= make_date($1, 1, 1) AND giorno < make_date($1 + 1, 1, 1)
        GROUP BY 1, 2, 3`,
      [anno],
    ),
    query<{ mese: number; somma: string; n: number }>(
      `SELECT extract(month FROM created_at AT TIME ZONE 'Europe/Rome')::int AS mese,
              sum(totale)::bigint AS somma, count(*)::int AS n
         FROM ordini
        WHERE stato <> 'rimborsato'
          AND created_at AT TIME ZONE 'Europe/Rome' >= make_date($1, 1, 1)
          AND created_at AT TIME ZONE 'Europe/Rome' < make_date($1 + 1, 1, 1)
        GROUP BY 1`,
      [anno],
    ),
  ]);

  const mesi: ContoMese[] = Array.from({ length: 12 }, (_, i) => ({
    mese: i + 1,
    contanti: 0,
    bonifico: 0,
    sito: 0,
    ordini: 0,
    spese: 0,
  }));
  for (const r of movimenti) {
    const m = mesi[Number(r.mese) - 1];
    const somma = Number(r.somma);
    if (r.tipo === "spesa") m.spese += somma;
    else if (r.canale === "contanti") m.contanti += somma;
    else if (r.canale === "bonifico") m.bonifico += somma;
  }
  for (const r of ordini) {
    const m = mesi[Number(r.mese) - 1];
    m.sito = Number(r.somma);
    m.ordini = Number(r.n);
  }
  return mesi;
}

/** I movimenti scritti a mano in un mese, dal giorno più recente. */
export async function listMovimenti(anno: number, mese: number): Promise<Movimento[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, giorno::text AS giorno, tipo, canale, importo, nota
       FROM movimenti
      WHERE giorno >= make_date($1, $2, 1) AND giorno < make_date($1, $2, 1) + interval '1 month'
      ORDER BY giorno DESC, id DESC`,
    [anno, mese],
  );
  return rows.map((r) => ({
    id: Number(r.id),
    giorno: String(r.giorno),
    tipo: r.tipo === "spesa" ? "spesa" : "vendita",
    canale: r.canale === "contanti" || r.canale === "bonifico" ? r.canale : null,
    importo: Number(r.importo),
    nota: r.nota ? String(r.nota) : null,
  }));
}

export async function aggiungiMovimento(m: MovimentoInput): Promise<void> {
  await query(`INSERT INTO movimenti (giorno, tipo, canale, importo, nota) VALUES ($1, $2, $3, $4, $5)`, [
    m.giorno,
    m.tipo,
    m.tipo === "spesa" ? null : m.canale,
    m.importo,
    m.nota,
  ]);
}

export async function cancellaMovimento(id: number): Promise<void> {
  await query(`DELETE FROM movimenti WHERE id = $1`, [id]);
}

/**
 * Un importo come lo scrive una persona —«12», «12,50», «1.250», «€ 8.5»— in
 * centesimi. Null se non è un importo.
 *
 * Il punto seguito da tre cifre è delle migliaia, all'italiana; con una o due
 * cifre è dei decimali, perché è così che lo scrive chi è abituato al
 * telefono.
 */
export function leggiImporto(crudo: string): number | null {
  let s = crudo.replace(/[€\s]/g, "");
  if (!s) return null;
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const centesimi = Math.round(Number(s) * 100);
  return centesimi > 0 && centesimi <= 100_000_000 ? centesimi : null;
}
