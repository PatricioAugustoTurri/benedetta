import { transaction } from "@/lib/db";

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

export async function applicaMigrazioni(): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  try {
    await transaction(async (run) => {
      for (const sql of RECENSIONI) await run(sql);
    });
  } catch (e) {
    // Il sito parte lo stesso: senza la tabella le recensioni semplicemente
    // non si vedono, e al prossimo avvio si riprova.
    console.error("Migrazioni: la 020 (recensioni) non è stata applicata.", e);
  }
}
