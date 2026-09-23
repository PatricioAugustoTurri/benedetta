import { Pool } from "pg";

/**
 * Il pool di connessioni a PostgreSQL.
 *
 * Vive in un global e non in un modulo a sé per via del ricaricamento a caldo:
 * in sviluppo, Next.js rivaluta il modulo a ogni modifica di file, e un
 * `new Pool()` per valutazione lascia pool orfani con le loro connessioni
 * aperte finché Postgres rifiuta per `too many clients`. Il global sopravvive
 * al ricaricamento; il pool resta uno solo.
 *
 * In produzione il modulo si valuta una volta e il global non cambia niente.
 */
const globalForDb = globalThis as unknown as { pool?: Pool };

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // L'admin lo usa una persona sola: più di una manciata di connessioni non
    // aggiunge niente e lascia meno al resto della macchina.
    max: 5,
    idleTimeoutMillis: 30_000,
    // Senza questo, un database caduto lascia la richiesta appesa finché il
    // browser non si stanca. Dieci secondi e un errore che si può mostrare.
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

/** Una query con parametri. Mai interpolare valori nell'SQL. */
export async function query<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

/**
 * Il tipo della funzione che esegue query dentro una transazione. È la stessa
 * firma di `query`, ma legata al client che ha il BEGIN aperto.
 */
type Consulta = <T extends Record<string, unknown>>(
  text: string,
  params?: unknown[],
) => Promise<T[]>;

/**
 * Più query che entrano o non entrano insieme.
 *
 * Esiste perché riordinare l'archivio significa leggere quali opere ci sono e
 * riscrivere il posto di tutte, e fra queste due cose non può succedere
 * niente: se si legge la lista, si cancella un'opera da un'altra scheda e solo
 * dopo si scrivono i posti, l'archivio resta con un buco numerato e un vincolo
 * rotto.
 *
 * Prende un client proprio dal pool e lo restituisce qualunque cosa succeda.
 * Usare `query` dentro una di queste funzioni non servirebbe: `pool.query`
 * chiede un client qualsiasi, che può non essere questo, e la query cadrebbe
 * fuori dalla transazione senza avvisare. Per questo il `run` arriva come
 * parametro.
 */
export async function transaction<T>(fn: (run: Consulta) => Promise<T>): Promise<T> {
  const client = await pool.connect();

  const run: Consulta = async (text, params = []) => (await client.query(text, params)).rows;

  try {
    await client.query("BEGIN");
    const resultado = await fn(run);
    await client.query("COMMIT");
    return resultado;
  } catch (e) {
    // Il ROLLBACK si inghiotte il proprio errore di proposito: se fallisce è
    // perché la connessione si è già interrotta, e in quel caso quello da
    // raccontare è l'errore originale, non quello del tentativo di disfare.
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
