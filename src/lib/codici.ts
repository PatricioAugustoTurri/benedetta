import { randomInt } from "node:crypto";
import { query } from "@/lib/db";
import { oggiInItalia } from "@/lib/oggi";

/**
 * I codici sconto: una parola che si scrive nel carrello prima di pagare.
 * Due tipi nella stessa tabella:
 *
 * - **Generali**, come BENZIBET98: uguali per tutti, valgono quante volte si
 *   vuole finché sono accesi.
 * - **Personali**, uno per ordine: nascono quando l'ordine è pagato, lei li
 *   scrive a mano sul biglietto del pacco, valgono una volta sola e scadono
 *   90 giorni dopo la spedizione. Codice, percentuale e scadenza si
 *   correggono dall'ordine prima di spedire (cliente, 2026-10-09).
 *
 * **Non si sommano agli sconti di stagione.** La percentuale si calcola solo
 * sulle stampe che non sono già scontate (vedi `scontoCodice`), e mai sulla
 * spedizione: lei non vende mai sotto il prezzo che ha scelto per uno sconto.
 */
export type Codice = {
  id: number;
  codice: string;
  percentuale: number;
  attivo: boolean;
  /** L'ultimo giorno in cui vale, compreso, «2027-01-07». Null: sempre. */
  scade: string | null;
  /** Vale per un ordine solo. */
  monouso: boolean;
  /** Il biglietto di quale ordine: null per i codici fatti a mano. */
  ordineId: number | null;
  /** Dove è stato speso, se è monouso e già usato. */
  usatoOrdineId: number | null;
  /** Gli ordini pagati con questo codice. */
  usi: number;
};

/** Quello che vale per i biglietti nuovi. */
export const PERSONALE = { percentuale: 15, giorni: 90 } as const;

/**
 * Come lo scrive chi compra e come lo salva lei: maiuscolo e senza spazi.
 * «benzibet 98» e «BENZIBET98» sono lo stesso codice.
 */
export function normalizzaCodice(crudo: string): string {
  return crudo.replace(/\s+/g, "").toUpperCase();
}

/** La stessa forma del CHECK della tabella. */
export const FORMA_CODICE = /^[A-Z0-9-]{3,30}$/;

/**
 * Il controllo di quello che lei scrive nell'admin, nel modulo del codice e
 * nel biglietto di un ordine: lo stesso messaggio nei due posti.
 */
export function erroreCodice(codice: string, percentuale: number, scade: string | null): string | null {
  if (!codice) return "Scrivi il codice.";
  if (!FORMA_CODICE.test(codice)) {
    return "Il codice va da 3 a 30 caratteri, solo lettere, numeri e trattini.";
  }
  if (!Number.isInteger(percentuale) || percentuale < 1 || percentuale > 90) {
    return "Lo sconto va da 1 a 90 per cento.";
  }
  if (scade !== null && !/^\d{4}-\d{2}-\d{2}$/.test(scade)) return "La data di scadenza non si è capita.";
  return null;
}

const data = (v: unknown) => (v === null || v === undefined ? null : String(v).slice(0, 10));

function hydrate(r: Record<string, unknown>): Codice {
  return {
    id: Number(r.id),
    codice: String(r.codice),
    percentuale: Number(r.percentuale),
    attivo: Boolean(r.attivo),
    scade: data(r.scade),
    monouso: Boolean(r.monouso),
    ordineId: r.ordine_id === null ? null : Number(r.ordine_id),
    usatoOrdineId: r.usato_ordine_id === null ? null : Number(r.usato_ordine_id),
    usi: Number(r.usi ?? 0),
  };
}

// La data esce come testo, così il fuso del server non la sposta di un giorno.
const COLONNE = `c.id, c.codice, c.percentuale, c.attivo, c.scade::text AS scade, c.monouso,
  c.ordine_id, c.usato_ordine_id,
  (SELECT count(*) FROM ordini o WHERE o.codice = c.codice) AS usi`;

/**
 * Quelli fatti a mano, prima quelli che valgono, e fra loro i generali. Per la pagina dello Shop: i
 * biglietti degli ordini vivono nei loro ordini, qui si contano soltanto.
 * Senza tabella (prima della 010), nessuno.
 */
export async function listCodici(): Promise<Codice[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT ${COLONNE} FROM codici c WHERE c.ordine_id IS NULL
      ORDER BY (c.attivo AND c.usato_ordine_id IS NULL AND (c.scade IS NULL OR c.scade >= CURRENT_DATE)) DESC,
               c.monouso, c.created_at DESC`,
  ).catch(() => []);
  return rows.map(hydrate);
}

/** Quanti biglietti sono stati dati con gli ordini, e quanti sono tornati come ordine nuovo. */
export async function contaBiglietti(): Promise<{ dati: number; usati: number }> {
  const rows = await query<{ dati: string; usati: string }>(
    `SELECT count(*) AS dati, count(usato_ordine_id) AS usati FROM codici WHERE ordine_id IS NOT NULL`,
  ).catch(() => []);
  return { dati: Number(rows[0]?.dati ?? 0), usati: Number(rows[0]?.usati ?? 0) };
}

/** I biglietti degli ordini, per ordine. */
export async function bigliettiPerOrdine(): Promise<Map<number, Codice>> {
  const rows = await query<Record<string, unknown>>(
    `SELECT ${COLONNE} FROM codici c WHERE c.ordine_id IS NOT NULL`,
  ).catch(() => []);
  return new Map(rows.map(hydrate).map((c) => [c.ordineId!, c]));
}

export async function bigliettoDi(ordineId: number): Promise<Codice | null> {
  const rows = await query<Record<string, unknown>>(`SELECT ${COLONNE} FROM codici c WHERE c.ordine_id = $1`, [
    ordineId,
  ]);
  return rows[0] ? hydrate(rows[0]) : null;
}

export async function getCodice(id: number): Promise<Codice | null> {
  const rows = await query<Record<string, unknown>>(`SELECT ${COLONNE} FROM codici c WHERE c.id = $1`, [id]);
  return rows[0] ? hydrate(rows[0]) : null;
}

export type Ricerca =
  | { stato: "valido"; codice: string; percentuale: number }
  | { stato: "usato"; codice: string }
  | { stato: "scaduto"; codice: string; scade: string }
  | { stato: "inesistente"; codice: string };

/**
 * Cosa dire di un codice scritto nel carrello. Un codice spento è come uno
 * che non esiste; uno scaduto o già usato lo dice, perché chi ha il biglietto
 * in mano deve capire perché non va invece di pensare di averlo scritto male.
 */
export async function cercaCodice(crudo: string): Promise<Ricerca> {
  const codice = normalizzaCodice(crudo);
  if (!FORMA_CODICE.test(codice)) return { stato: "inesistente", codice };
  const rows = await query<Record<string, unknown>>(
    `SELECT codice, percentuale, attivo, scade::text AS scade, monouso, usato_ordine_id
       FROM codici WHERE codice = $1`,
    [codice],
  );
  const r = rows[0];
  if (!r || !r.attivo) return { stato: "inesistente", codice };
  if (r.monouso && r.usato_ordine_id !== null) return { stato: "usato", codice };
  const scade = data(r.scade);
  if (scade && scade < oggiInItalia()) return { stato: "scaduto", codice, scade };
  return { stato: "valido", codice, percentuale: Number(r.percentuale) };
}

export async function salvaCodice(input: {
  id?: number;
  codice: string;
  percentuale: number;
  attivo: boolean;
  scade: string | null;
  monouso: boolean;
}): Promise<void> {
  if (input.id) {
    await query(
      `UPDATE codici SET codice = $2, percentuale = $3, attivo = $4, scade = $5, monouso = $6 WHERE id = $1`,
      [input.id, input.codice, input.percentuale, input.attivo, input.scade, input.monouso],
    );
  } else {
    await query(`INSERT INTO codici (codice, percentuale, attivo, scade, monouso) VALUES ($1, $2, $3, $4, $5)`, [
      input.codice,
      input.percentuale,
      input.attivo,
      input.scade,
      input.monouso,
    ]);
  }
}

/** Cancella il codice. Gli ordini pagati con lui lo ricordano lo stesso. */
export async function cancellaCodice(id: number): Promise<void> {
  await query(`DELETE FROM codici WHERE id = $1`, [id]);
}

/* ------------------------------------------------------- i biglietti */

/*
  Le lettere di un biglietto scritto a mano: niente O e 0, I, L e 1, che sulla
  carta si confondono. 31 segni su quattro posti fanno quasi un milione di
  codici: uno a caso non si indovina.
*/
const SEGNI = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const nuovoCodice = () => `BEN-${Array.from({ length: 4 }, () => SEGNI[randomInt(SEGNI.length)]).join("")}`;

/**
 * Il biglietto di un ordine appena pagato. Se c'è già non ne fa un altro: il
 * webhook può arrivare due volte. Se il codice estratto esiste già, ne
 * estrae un altro.
 */
export async function creaBiglietto(ordineId: number): Promise<Codice | null> {
  for (let tentativo = 0; tentativo < 6; tentativo++) {
    try {
      await query(
        `INSERT INTO codici (codice, percentuale, monouso, ordine_id) VALUES ($1, $2, true, $3)
         ON CONFLICT (ordine_id) DO NOTHING`,
        [nuovoCodice(), PERSONALE.percentuale, ordineId],
      );
      return bigliettoDi(ordineId);
    } catch (e) {
      if (!(e instanceof Error && e.message.includes("codici_codice_key"))) throw e;
    }
  }
  throw new Error(`Nessun codice libero per l'ordine ${ordineId}`);
}

/** Il biglietto corretto da lei nell'ordine: codice, percentuale e scadenza. */
export async function correggiBiglietto(
  ordineId: number,
  input: { codice: string; percentuale: number; scade: string | null },
): Promise<void> {
  await query(`UPDATE codici SET codice = $2, percentuale = $3, scade = $4 WHERE ordine_id = $1`, [
    ordineId,
    input.codice,
    input.percentuale,
    input.scade,
  ]);
}

/**
 * Il pacco è partito: il biglietto scade fra 90 giorni, contati da oggi in
 * Italia. Solo se lei non ha già scelto una data.
 */
export async function fissaScadenza(ordineId: number): Promise<void> {
  await query(
    `UPDATE codici SET scade = $2::date + $3::int WHERE ordine_id = $1 AND scade IS NULL`,
    [ordineId, oggiInItalia(), PERSONALE.giorni],
  );
}

/** Un codice monouso speso: resta, con l'ordine in cui è servito, e non vale più. */
export async function segnaUsato(codice: string, ordineId: number): Promise<void> {
  await query(
    `UPDATE codici SET usato_ordine_id = $2 WHERE codice = $1 AND monouso AND usato_ordine_id IS NULL`,
    [codice, ordineId],
  );
}
