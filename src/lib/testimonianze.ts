import type { ServizioSlug } from "@/data/shop";
import { query } from "@/lib/db";

/**
 * Le parole di chi ha commissionato un ritratto o un'illustrazione, nella
 * pagina del servizio. Le copia lei dall'admin da quello che le hanno scritto:
 * il sito non ne inventa e non ne mostra se non ce ne sono.
 */
export type Testimonianza = {
  id: number;
  servizio: ServizioSlug;
  testo: string;
  autore: string;
  dettaglio: string | null;
};

function hydrate(r: Record<string, unknown>): Testimonianza {
  return {
    id: Number(r.id),
    servizio: String(r.servizio) as ServizioSlug,
    testo: String(r.testo),
    autore: String(r.autore),
    dettaglio: r.dettaglio ? String(r.dettaglio) : null,
  };
}

/** Le testimonianze di un servizio, dalla più recente. Senza tabella (prima della 008), nessuna. */
export async function listTestimonianze(servizio: ServizioSlug): Promise<Testimonianza[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, servizio, testo, autore, dettaglio FROM testimonianze
      WHERE servizio = $1 ORDER BY created_at DESC`,
    [servizio],
  ).catch(() => []);
  return rows.map(hydrate);
}

export async function aggiungiTestimonianza(t: Omit<Testimonianza, "id">): Promise<void> {
  await query(
    `INSERT INTO testimonianze (servizio, testo, autore, dettaglio) VALUES ($1, $2, $3, $4)`,
    [t.servizio, t.testo, t.autore, t.dettaglio],
  );
}

export async function cancellaTestimonianza(id: number): Promise<void> {
  await query(`DELETE FROM testimonianze WHERE id = $1`, [id]);
}
