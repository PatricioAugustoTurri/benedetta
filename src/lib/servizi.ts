import type { ServizioSlug } from "@/data/shop";
import { query } from "@/lib/db";
import type { WorkImage } from "@/lib/works";

/**
 * Uno dei due lavori su commissione: Illustrazioni Personalizzate o Ritratti
 * Illustrati.
 *
 * Non sono prodotti. Sono due, sempre gli stessi, e non si aggiungono né si
 * cancellano: la tabella `servizi` ha esattamente due righe e l'admin può
 * solo modificarle. Quello che cambia nel tempo è il testo e le immagini con
 * cui lei li mostra.
 */
export type Servizio = {
  slug: ServizioSlug;
  title: string;
  description: string | null;
  image: WorkImage[];
};

function hydrate(row: Record<string, unknown>): Servizio {
  return {
    slug: String(row.slug) as ServizioSlug,
    title: String(row.title),
    description: row.description === null ? null : String(row.description),
    image: Array.isArray(row.image) ? (row.image as WorkImage[]) : [],
  };
}

/** I due servizi, nell'ordine delle categorie dello Shop. */
export async function listServizi(): Promise<Servizio[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT slug, title, description, image FROM servizi
      ORDER BY array_position(ARRAY['illustrazioni-personalizzate', 'ritratti-illustrati'], slug)`,
  );
  return rows.map(hydrate);
}

export async function getServizio(slug: string): Promise<Servizio | null> {
  const rows = await query<Record<string, unknown>>(
    `SELECT slug, title, description, image FROM servizi WHERE slug = $1`,
    [slug],
  );
  return rows[0] ? hydrate(rows[0]) : null;
}

export async function updateServizio(
  slug: ServizioSlug,
  input: Omit<Servizio, "slug">,
): Promise<Servizio | null> {
  const rows = await query<Record<string, unknown>>(
    `UPDATE servizi SET title = $2, description = $3, image = $4::jsonb
      WHERE slug = $1
  RETURNING slug, title, description, image`,
    [slug, input.title, input.description, JSON.stringify(input.image)],
  );
  return rows[0] ? hydrate(rows[0]) : null;
}
