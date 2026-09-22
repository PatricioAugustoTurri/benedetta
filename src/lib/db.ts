import { Pool } from "pg";

/**
 * El pool de conexiones a PostgreSQL.
 *
 * Vive en un global y no en un módulo suelto por el recargado en caliente: en
 * desarrollo, Next.js vuelve a evaluar el módulo en cada cambio de archivo, y
 * un `new Pool()` por evaluación deja pools huérfanos con sus conexiones
 * abiertas hasta que Postgres rechaza por `too many clients`. El global
 * sobrevive al recargado; el pool, uno solo.
 *
 * En producción el módulo se evalúa una vez y el global no cambia nada.
 */
const globalForDb = globalThis as unknown as { pool?: Pool };

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // El admin lo usa una sola persona: más de un puñado de conexiones no
    // agrega nada y deja menos para el resto de la máquina.
    max: 5,
    idleTimeoutMillis: 30_000,
    // Sin esto, una base caída deja la petición colgada hasta que el navegador
    // se aburre. Diez segundos y un error que se puede mostrar.
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

/** Una consulta con parámetros. Nunca interpolar valores en el SQL. */
export async function query<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

/**
 * El tipo de la función que corre consultas dentro de una transacción. Es la
 * misma firma que `query`, pero atada al cliente que tiene el BEGIN abierto.
 */
type Consulta = <T extends Record<string, unknown>>(
  text: string,
  params?: unknown[],
) => Promise<T[]>;

/**
 * Varias consultas que entran o no entran juntas.
 *
 * Existe porque reordenar el archivo es leer qué obras hay y reescribir el
 * lugar de todas, y entre esas dos cosas no puede pasar nada: si se lee la
 * lista, se borra una obra desde otra pestaña y recién después se escriben
 * los lugares, el archivo queda con un hueco numerado y una restricción rota.
 *
 * Toma un cliente propio del pool y lo devuelve pase lo que pase. Usar
 * `query` adentro de una de estas funciones no serviría: `pool.query` pide
 * un cliente cualquiera, que puede no ser éste, y la consulta caería fuera
 * de la transacción sin avisar. Por eso el `run` llega por parámetro.
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
    // El ROLLBACK se traga su propio error a propósito: si falla es porque la
    // conexión ya se cortó, y en ese caso lo que hay que contar es el error
    // original, no el del intento de deshacer.
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
