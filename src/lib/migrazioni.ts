import { query, transaction } from "@/lib/db";

/**
 * Le migrazioni che il sito applica da solo quando parte.
 *
 * Di regola una migrazione si corre a mano con psql (vedi db/README.md). La
 * 020 no: chi pubblica lo fa dal telefono, dove un terminale non c'è
 * (2026-11-22). Per questo il sito, all'avvio, si assicura che la tabella
 * delle recensioni esista. È lo stesso SQL di db/migrations/020-recensioni.sql
 * e, come quello, si può ripetere quante volte si vuole: con tutto già al
 * suo posto non cambia niente.
 *
 * Il lock evita che due istanze che partono insieme facciano lo stesso
 * lavoro nello stesso momento.
 */
const RECENSIONI = [
  `SELECT pg_advisory_xact_lock(hashtext('migrazione-020-recensioni'))`,
  `ALTER TABLE ordini
     ADD COLUMN IF NOT EXISTS recensione_chiave text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', '')
       CONSTRAINT ordini_recensione_chiave_key UNIQUE`,
  `ALTER TABLE ordini ADD COLUMN IF NOT EXISTS recensione_chiesta_at timestamptz`,
  `CREATE TABLE IF NOT EXISTS recensioni (
     id         integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     ordine     integer     NOT NULL REFERENCES ordini (id) ON DELETE CASCADE,
     prodotto   integer     NOT NULL REFERENCES prodotti (id) ON DELETE CASCADE,
     voto       smallint    NOT NULL CONSTRAINT recensioni_voto_valido CHECK (voto BETWEEN 1 AND 5),
     testo      text        NOT NULL CONSTRAINT recensioni_testo_misura CHECK (length(trim(testo)) BETWEEN 1 AND 1200),
     autore     text        NOT NULL CONSTRAINT recensioni_autore_misura CHECK (length(trim(autore)) BETWEEN 1 AND 60),
     created_at timestamptz NOT NULL DEFAULT now(),
     CONSTRAINT recensioni_una_per_prodotto UNIQUE (ordine, prodotto)
   )`,
  `CREATE INDEX IF NOT EXISTS recensioni_prodotto ON recensioni (prodotto, created_at DESC)`,
];

/**
 * L'ultimo errore, per mostrarlo nell'admin a chi non legge i log. In un
 * global perché l'avvio e le pagine possono caricare copie diverse di
 * questo modulo.
 */
const stato = globalThis as unknown as { erroreMigrazione020?: string | null };

/** Applica la 020. Restituisce il messaggio d'errore, o null se è andata. */
export async function applicaMigrazioni(): Promise<string | null> {
  if (!process.env.DATABASE_URL) return "Manca DATABASE_URL.";
  try {
    await transaction(async (run) => {
      for (const sql of RECENSIONI) await run(sql);
    });
    stato.erroreMigrazione020 = null;
  } catch (e) {
    // Il sito parte lo stesso: senza la tabella le recensioni semplicemente
    // non si vedono. Si riprova al prossimo avvio, o dall'admin.
    console.error("Migrazioni: la 020 (recensioni) non è stata applicata.", e);
    stato.erroreMigrazione020 = e instanceof Error ? e.message : String(e);
  }
  return stato.erroreMigrazione020 ?? null;
}

/**
 * Se le recensioni sono pronte nel database: la tabella e la chiave degli
 * ordini. Con l'errore dell'ultimo tentativo, se non lo sono.
 */
export async function statoMigrazioneRecensioni(): Promise<{ pronte: boolean; errore: string | null }> {
  const rows = await query<{ tabella: string | null; colonna: number }>(
    `SELECT to_regclass('recensioni')::text AS tabella,
            (SELECT count(*)::int FROM information_schema.columns
              WHERE table_name = 'ordini' AND column_name = 'recensione_chiave') AS colonna`,
  ).catch(() => []);
  const r = rows[0];
  return { pronte: Boolean(r?.tabella) && r?.colonna === 1, errore: stato.erroreMigrazione020 ?? null };
}
