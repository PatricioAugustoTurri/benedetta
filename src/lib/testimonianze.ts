import type { ServizioSlug } from "@/data/shop";
import { query } from "@/lib/db";

/**
 * Le parole di chi ha commissionato un ritratto o un'illustrazione, nella
 * pagina del servizio. Arrivano in due modi:
 *
 * - le copia lei dall'admin da quello che le hanno scritto (mail, messaggi):
 *   senza stelle, perché nessuno le ha date;
 * - le scrive chi ha commissionato, dal QR che lei gli dà alla consegna
 *   (cliente, 2026-11-27, migrazione 024): stelle, testo, nome e, se vuole,
 *   una riga di dettaglio.
 *
 * Il sito non ne inventa e non ne mostra se non ce ne sono. Lei le può
 * cancellare, non riscrivere.
 */
export type Testimonianza = {
  id: number;
  servizio: ServizioSlug;
  testo: string;
  autore: string;
  dettaglio: string | null;
  /** Le stelle, solo per quelle arrivate dal QR. */
  voto: number | null;
  /** Arrivata dal QR, non copiata a mano. */
  dalQr: boolean;
};

export const MAX_TESTIMONIANZA = { testo: 800, autore: 60, dettaglio: 80 } as const;

function hydrate(r: Record<string, unknown>): Testimonianza {
  return {
    id: Number(r.id),
    servizio: String(r.servizio) as ServizioSlug,
    testo: String(r.testo),
    autore: String(r.autore),
    dettaglio: r.dettaglio ? String(r.dettaglio) : null,
    voto: r.voto == null ? null : Number(r.voto),
    dalQr: r.invito != null,
  };
}

/*
  Prima della 024 le colonne `voto` e `invito` non ci sono: la lettura
  ripiega sulle colonne di sempre, così la pagina del servizio non perde le
  testimonianze nei minuti fra il deploy e la migrazione.
*/
const COLONNE = `id, servizio, testo, autore, dettaglio, voto, invito`;
const COLONNE_VECCHIE = `id, servizio, testo, autore, dettaglio`;

/** Le testimonianze di un servizio, dalla più recente. Senza tabella (prima della 008), nessuna. */
export async function listTestimonianze(servizio: ServizioSlug): Promise<Testimonianza[]> {
  const leggi = (colonne: string) =>
    query<Record<string, unknown>>(
      `SELECT ${colonne} FROM testimonianze WHERE servizio = $1 ORDER BY created_at DESC`,
      [servizio],
    );
  const rows = await leggi(COLONNE)
    .catch(() => leggi(COLONNE_VECCHIE))
    .catch(() => []);
  return rows.map(hydrate);
}

export async function aggiungiTestimonianza(
  t: Omit<Testimonianza, "id" | "voto" | "dalQr">,
): Promise<void> {
  await query(
    `INSERT INTO testimonianze (servizio, testo, autore, dettaglio) VALUES ($1, $2, $3, $4)`,
    [t.servizio, t.testo, t.autore, t.dettaglio],
  );
}

export async function cancellaTestimonianza(id: number): Promise<void> {
  await query(`DELETE FROM testimonianze WHERE id = $1`, [id]);
}

/* ------------------------------------------------------------ gli inviti */

/** La chiave è esadecimale e di 32 caratteri, come quella degli ordini. */
const chiaveValida = (c: string) => /^[0-9a-f]{32}$/.test(c);

/** Quanti inviti si possono fare in una volta: un foglio A4 ne porta quattro. */
export const MAX_INVITI_SERVIZIO = 4;

/** Crea `quanti` inviti per un servizio e ne restituisce le chiavi. */
export async function creaInvitiServizio(servizio: ServizioSlug, quanti: number): Promise<string[]> {
  const n = Math.max(1, Math.min(MAX_INVITI_SERVIZIO, Math.floor(quanti)));
  const rows = await query<{ chiave: string }>(
    `INSERT INTO inviti_testimonianza (servizio)
     SELECT $1 FROM generate_series(1, $2)
     RETURNING chiave`,
    [servizio, n],
  );
  return rows.map((r) => r.chiave);
}

/** Per la scheda del servizio: quanti QR ha dato e quanti sono tornati. */
export async function contaInvitiServizio(servizio: ServizioSlug): Promise<{ dati: number; usati: number } | null> {
  const rows = await query<{ dati: number; usati: number }>(
    `SELECT count(*)::int AS dati, count(usato_at)::int AS usati
       FROM inviti_testimonianza WHERE servizio = $1`,
    [servizio],
  ).catch(() => null);
  return rows?.[0] ?? null;
}

export type InvitoServizio = {
  id: number;
  servizio: ServizioSlug;
  usato: boolean;
  /** Quella che ha lasciato, se l'ha già lasciata. */
  testimonianza: Testimonianza | null;
};

/**
 * L'invito di questa chiave, se è di un servizio. Null se la chiave non è
 * di un invito di servizio —o se la 024 non c'è ancora—: allora la pagina
 * dice che il link non è valido, come per qualunque altra chiave.
 */
export async function invitoServizioPerChiave(chiave: string): Promise<InvitoServizio | null> {
  if (!chiaveValida(chiave)) return null;
  const rows = await query<Record<string, unknown>>(
    `SELECT i.id, i.servizio, i.usato_at,
            t.id AS t_id, t.testo, t.autore, t.dettaglio, t.voto
       FROM inviti_testimonianza i
       LEFT JOIN testimonianze t ON t.invito = i.id
      WHERE i.chiave = $1`,
    [chiave],
  ).catch(() => []);
  const r = rows[0];
  if (!r) return null;
  const id = Number(r.id);
  const servizio = String(r.servizio) as ServizioSlug;
  return {
    id,
    servizio,
    usato: r.usato_at != null,
    testimonianza:
      r.t_id == null
        ? null
        : hydrate({ id: r.t_id, servizio, testo: r.testo, autore: r.autore, dettaglio: r.dettaglio, voto: r.voto, invito: id }),
  };
}

/** Se l'invito di servizio di questa chiave è già stato usato. Null se non è suo. */
export async function invitoServizioUsato(chiave: string): Promise<boolean | null> {
  if (!chiaveValida(chiave)) return null;
  const rows = await query<{ usato: boolean }>(
    `SELECT usato_at IS NOT NULL AS usato FROM inviti_testimonianza WHERE chiave = $1`,
    [chiave],
  ).catch(() => []);
  return rows[0]?.usato ?? null;
}

export type VoceTestimonianza = { voto: number; testo: string; autore: string; dettaglio: string | null };

/**
 * Scrive la testimonianza di un invito. Come per le recensioni dei
 * prodotti, segnare l'invito come usato e scrivere è una frase SQL sola:
 * due invii nello stesso istante —un doppio tocco— si mettono in fila sul
 * lock della riga, e il secondo trova l'invito già usato e non scrive.
 */
export async function scriviTestimonianza(
  chiave: string,
  v: VoceTestimonianza,
): Promise<{ ok: true; servizio: ServizioSlug } | { ok: false; motivo: "chiave" | "usata" }> {
  if (!chiaveValida(chiave)) return { ok: false, motivo: "chiave" };
  const rows = await query<{ servizio: string }>(
    `WITH presa AS (
       UPDATE inviti_testimonianza SET usato_at = now()
        WHERE chiave = $1 AND usato_at IS NULL
       RETURNING id, servizio
     )
     INSERT INTO testimonianze (servizio, testo, autore, dettaglio, voto, invito)
     SELECT presa.servizio, $2::text, $3::text, $4::text, $5::smallint, presa.id FROM presa
     ON CONFLICT (invito) DO NOTHING
     RETURNING servizio`,
    [chiave, v.testo, v.autore, v.dettaglio, v.voto],
  );
  if (rows.length > 0) return { ok: true, servizio: rows[0].servizio as ServizioSlug };
  // Niente scritto: o la chiave non è di nessun invito, o è già stata usata.
  return (await invitoServizioUsato(chiave)) === null ? { ok: false, motivo: "chiave" } : { ok: false, motivo: "usata" };
}
