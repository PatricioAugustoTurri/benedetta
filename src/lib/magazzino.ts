import { query } from "@/lib/db";

/**
 * Il magazzino di lei: quante stampe ha nel cassetto, formato per formato.
 *
 * È un quaderno e basta. Il sito non lo legge e niente qui cambia quello che
 * si vende: una stampa a zero resta in vendita, perché si stampa su
 * ordinazione. Le copie che il sito conta davvero —i quaderni— sono un'altra
 * cosa e vivono in `prodotti.scorte`.
 */

/** Per ogni prodotto, le copie di ogni formato contato: { 12: { A4: 3 } }. */
export type Giacenze = Record<number, Record<string, number>>;

export async function listGiacenze(): Promise<Giacenze> {
  const rows = await query<{ prodotto_id: number; formato: string; copie: number }>(
    `SELECT prodotto_id, formato, copie FROM magazzino`,
  );
  const giacenze: Giacenze = {};
  for (const r of rows) {
    (giacenze[Number(r.prodotto_id)] ??= {})[r.formato] = Number(r.copie);
  }
  return giacenze;
}

/** Le copie di un formato; null per smettere di contarlo. */
export async function fissaGiacenza(prodottoId: number, formato: string, copie: number | null): Promise<void> {
  if (copie === null) {
    await query(`DELETE FROM magazzino WHERE prodotto_id = $1 AND formato = $2`, [prodottoId, formato]);
    return;
  }
  await query(
    `INSERT INTO magazzino (prodotto_id, formato, copie) VALUES ($1, $2, $3)
     ON CONFLICT (prodotto_id, formato) DO UPDATE SET copie = EXCLUDED.copie, updated_at = now()`,
    [prodottoId, formato, copie],
  );
}
