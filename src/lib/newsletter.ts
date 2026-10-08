import { randomBytes } from "node:crypto";
import { query, transaction } from "@/lib/db";
import { listPubblicati, type Prodotto } from "@/lib/prodotti";
import { listWorks, type Work } from "@/lib/works";

/**
 * La newsletter: chi è iscritto, cosa c'è di nuovo da annunciare e cosa è già
 * partito. La posta vera la manda `src/lib/correo.ts`.
 *
 * L'iscrizione ha due passi (doppio opt-in): il modulo del piè di pagina crea
 * la riga in attesa e manda un link; solo «Conferma» su quella pagina mette la
 * persona nella lista. È il modo di poter dimostrare il consenso, e impedisce
 * che qualcuno iscriva l'indirizzo di un altro.
 */

export type StatoIscritto = "in attesa" | "iscritto" | "disiscritto";

export type Iscritto = {
  id: number;
  email: string;
  /** Facoltativo: la newsletter comincia con «Ciao <nome>,». */
  nome: string | null;
  token: string;
  stato: StatoIscritto;
  creato: Date;
  confermato: Date | null;
};

function hydrate(row: Record<string, unknown>): Iscritto {
  const confermato = row.confermato_at ? new Date(String(row.confermato_at)) : null;
  return {
    id: Number(row.id),
    email: String(row.email),
    nome: row.nome ? String(row.nome) : null,
    token: String(row.token),
    stato: row.disiscritto_at ? "disiscritto" : confermato ? "iscritto" : "in attesa",
    creato: new Date(String(row.created_at)),
    confermato,
  };
}

const COLONNE = `id, email, nome, token, confermato_at, disiscritto_at, created_at`;

const nuovoToken = () => randomBytes(24).toString("base64url");

/**
 * Il nome come entra nella lista: una riga sola, senza caratteri di
 * controllo, al massimo 80 caratteri. Vuoto vale come nessun nome.
 */
export function pulisciNome(grezzo: string): string | null {
  const nome = grezzo.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  return nome.length > 0 ? nome : null;
}

/** Lo stesso controllo del modulo, ripetuto qui perché un'azione si chiama anche senza modulo. */
export function emailValida(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Registra una richiesta di iscrizione e dice se mandare la mail di conferma.
 *
 * - Indirizzo nuovo: riga in attesa, e la mail parte.
 * - In attesa o disiscritto: torna in attesa, e la mail parte di nuovo, ma
 *   non più di una volta ogni dieci minuti.
 * - Già iscritto: niente. Chi compila il modulo non lo sa —riceve la stessa
 *   risposta— così il modulo non diventa un modo per sapere chi è iscritto.
 *
 * Di passaggio cancella le richieste mai confermate più vecchie di trenta
 * giorni: un indirizzo che non ha detto di sì non si conserva.
 */
export async function richiediIscrizione(
  emailGrezza: string,
  nome: string | null,
): Promise<{ token: string; nome: string | null; inviaConferma: boolean }> {
  const email = emailGrezza.trim().toLowerCase();

  return transaction(async (run) => {
    await run(
      `DELETE FROM iscritti
        WHERE confermato_at IS NULL AND created_at < now() - interval '30 days'`,
    );

    const [riga] = await run<Record<string, unknown>>(
      // Un nome nuovo sostituisce il vecchio; un modulo senza nome non lo cancella.
      `INSERT INTO iscritti (email, token, nome) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET nome = COALESCE(EXCLUDED.nome, iscritti.nome)
       RETURNING ${COLONNE}, conferma_inviata_at`,
      [email, nuovoToken(), nome],
    );
    const iscritto = hydrate(riga);
    if (iscritto.stato === "iscritto") {
      return { token: iscritto.token, nome: iscritto.nome, inviaConferma: false };
    }

    // Torna in attesa (se era disiscritto) e segna l'invio, ma solo se
    // l'ultimo è abbastanza lontano. La condizione è nell'UPDATE stesso, così
    // due richieste insieme non mandano due mail.
    const aggiornate = await run(
      `UPDATE iscritti
          SET disiscritto_at = NULL, confermato_at = NULL, conferma_inviata_at = now()
        WHERE id = $1
          AND (conferma_inviata_at IS NULL OR conferma_inviata_at < now() - interval '10 minutes')
    RETURNING id`,
      [iscritto.id],
    );
    return { token: iscritto.token, nome: iscritto.nome, inviaConferma: aggiornate.length > 0 };
  });
}

export async function getIscrittoPerToken(token: string): Promise<Iscritto | null> {
  if (!token || token.length > 64) return null;
  const rows = await query<Record<string, unknown>>(
    `SELECT ${COLONNE} FROM iscritti WHERE token = $1`,
    [token],
  );
  return rows[0] ? hydrate(rows[0]) : null;
}

export async function confermaIscrizione(token: string): Promise<Iscritto | null> {
  const rows = await query<Record<string, unknown>>(
    `UPDATE iscritti SET confermato_at = COALESCE(confermato_at, now()), disiscritto_at = NULL
      WHERE token = $1
  RETURNING ${COLONNE}`,
    [token],
  );
  return rows[0] ? hydrate(rows[0]) : null;
}

export async function disiscrivi(token: string): Promise<Iscritto | null> {
  const rows = await query<Record<string, unknown>>(
    `UPDATE iscritti SET disiscritto_at = COALESCE(disiscritto_at, now())
      WHERE token = $1
  RETURNING ${COLONNE}`,
    [token],
  );
  return rows[0] ? hydrate(rows[0]) : null;
}

/** Tutti, i confermati prima e dal più recente. Per l'admin. */
export async function listIscritti(): Promise<Iscritto[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT ${COLONNE} FROM iscritti
      ORDER BY (disiscritto_at IS NULL AND confermato_at IS NOT NULL) DESC, created_at DESC`,
  );
  return rows.map(hydrate);
}

/** Chi riceve: confermati e non disiscritti. */
export async function listDestinatari(): Promise<Iscritto[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT ${COLONNE} FROM iscritti
      WHERE confermato_at IS NOT NULL AND disiscritto_at IS NULL
      ORDER BY id`,
  );
  return rows.map(hydrate);
}

/** Cancella una persona dalla lista, del tutto. Quando lo chiede lei, per esempio per mail. */
export async function cancellaIscritto(id: number): Promise<void> {
  await query(`DELETE FROM iscritti WHERE id = $1`, [id]);
}

/* -------------------------------------------------------------- novità */

export type Novita = { opere: Work[]; stampe: Prodotto[] };

/**
 * Quello che non è ancora stato annunciato: le opere nuove e le stampe
 * pubblicate. Una stampa in bozza non c'è finché non si pubblica.
 */
export async function listNovita(): Promise<Novita> {
  const [opereIds, stampeIds] = await Promise.all([
    query<{ id: number }>(`SELECT id FROM works WHERE annunciato_at IS NULL`),
    query<{ id: number }>(
      `SELECT id FROM prodotti WHERE annunciato_at IS NULL AND pubblicato AND categoria = 'stampe'`,
    ),
  ]);
  const io = new Set(opereIds.map((r) => Number(r.id)));
  const is = new Set(stampeIds.map((r) => Number(r.id)));
  if (io.size === 0 && is.size === 0) return { opere: [], stampe: [] };

  // Nell'ordine in cui escono nel sito.
  const [opere, stampe] = await Promise.all([listWorks(), listPubblicati("stampe")]);
  return { opere: opere.filter((w) => io.has(w.id)), stampe: stampe.filter((p) => is.has(p.id)) };
}

/** Segna come annunciate senza mandare niente: è lei che decide che non ne vale la pena. */
export async function segnaAnnunciate(opere: number[], stampe: number[]): Promise<void> {
  await transaction(async (run) => {
    if (opere.length > 0) {
      await run(`UPDATE works SET annunciato_at = now() WHERE id = ANY($1::int[]) AND annunciato_at IS NULL`, [opere]);
    }
    if (stampe.length > 0) {
      await run(`UPDATE prodotti SET annunciato_at = now() WHERE id = ANY($1::int[]) AND annunciato_at IS NULL`, [stampe]);
    }
  });
}

/* --------------------------------------------------------------- invii */

export type VoceInvio = { tipo: "opera" | "stampa"; id: number; title: string; url: string };

export type Invio = {
  id: number;
  oggetto: string;
  contenuto: VoceInvio[];
  destinatari: number;
  consegnati: number;
  stato: "in corso" | "inviato" | "errore";
  creato: Date;
};

function hydrateInvio(row: Record<string, unknown>): Invio {
  return {
    id: Number(row.id),
    oggetto: String(row.oggetto),
    contenuto: Array.isArray(row.contenuto) ? (row.contenuto as VoceInvio[]) : [],
    destinatari: Number(row.destinatari),
    consegnati: Number(row.consegnati),
    stato: row.stato as Invio["stato"],
    creato: new Date(String(row.created_at)),
  };
}

/**
 * Apre un invio: segna le voci come annunciate e scrive la riga, tutto in una
 * transazione. Se due clic arrivano insieme, il secondo trova le voci già
 * prese e non parte niente: la stessa novità non arriva due volte.
 *
 * Restituisce null se nessuna delle voci era più da annunciare.
 */
export async function apriInvio(input: {
  oggetto: string;
  testo: string | null;
  opere: number[];
  stampe: number[];
  contenuto: VoceInvio[];
  destinatari: number;
}): Promise<Invio | null> {
  return transaction(async (run) => {
    const prese = [
      ...(input.opere.length > 0
        ? await run(
            `UPDATE works SET annunciato_at = now()
              WHERE id = ANY($1::int[]) AND annunciato_at IS NULL RETURNING id`,
            [input.opere],
          )
        : []),
      ...(input.stampe.length > 0
        ? await run(
            `UPDATE prodotti SET annunciato_at = now()
              WHERE id = ANY($1::int[]) AND annunciato_at IS NULL RETURNING id`,
            [input.stampe],
          )
        : []),
    ];
    if (prese.length === 0) return null;

    const [riga] = await run<Record<string, unknown>>(
      `INSERT INTO invii (oggetto, testo, contenuto, destinatari)
            VALUES ($1, $2, $3::jsonb, $4)
         RETURNING id, oggetto, contenuto, destinatari, consegnati, stato, created_at`,
      [input.oggetto, input.testo, JSON.stringify(input.contenuto), input.destinatari],
    );
    return hydrateInvio(riga);
  });
}

/**
 * Chiude un invio con quante mail sono partite. Se non ne è partita nessuna,
 * le voci tornano da annunciare: non sono state dette a nessuno.
 */
export async function chiudiInvio(
  invio: Invio,
  consegnati: number,
  voci: { opere: number[]; stampe: number[] },
): Promise<void> {
  await transaction(async (run) => {
    await run(`UPDATE invii SET consegnati = $2, stato = $3 WHERE id = $1`, [
      invio.id,
      consegnati,
      consegnati > 0 ? "inviato" : "errore",
    ]);
    if (consegnati === 0) {
      if (voci.opere.length > 0) {
        await run(`UPDATE works SET annunciato_at = NULL WHERE id = ANY($1::int[])`, [voci.opere]);
      }
      if (voci.stampe.length > 0) {
        await run(`UPDATE prodotti SET annunciato_at = NULL WHERE id = ANY($1::int[])`, [voci.stampe]);
      }
    }
  });
}

export async function listInvii(limite = 10): Promise<Invio[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, oggetto, contenuto, destinatari, consegnati, stato, created_at
       FROM invii ORDER BY created_at DESC LIMIT $1`,
    [limite],
  );
  return rows.map(hydrateInvio);
}
