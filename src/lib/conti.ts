import { variante } from "@/data/shop";
import { query, transaction } from "@/lib/db";
import { listOrdini, type Ordine } from "@/lib/prodotti";

export { importoScritto, leggiImporto } from "@/lib/importi";

/**
 * I conti di lei: il registro di tutto quello che vende e quello che spende.
 *
 * Le vendite entrano da due parti. Contanti, bonifici, PayPal e SumUp al banco li
 * scrive lei, con il cliente, cosa ha comprato, se ha pagato e se l'ha
 * ricevuto (tabella `vendite`). Quelle del sito no: si leggono dagli ordini
 * pagati, con gli stessi campi, così il registro è uno solo e non c'è niente
 * da ricopiare. Un ordine rimborsato non conta.
 *
 * Il sito incassa con SumUp, e nei conti un ordine è una vendita SumUp come
 * quelle del lettore al banco (cliente, 2026-11-20): i canali sono come sono
 * arrivati i soldi, non da dove. Da dove lo dice `origine`. Le spese sono in cosa e quanto (`spese`).
 *
 * Come tutto il negozio, in centesimi e con l'ora italiana.
 */

export type Canale = "contanti" | "bonifico" | "sumup" | "paypal";
export const CANALI: Canale[] = ["contanti", "bonifico", "sumup", "paypal"];
export const NOME_CANALE: Record<Canale, string> = { contanti: "Contanti", bonifico: "Bonifico", sumup: "SumUp", paypal: "PayPal" };
export const eCanale = (c: string): c is Canale => (CANALI as string[]).includes(c);

/** Una copia tolta dal magazzino con una vendita. `tolte` è quante c'erano davvero da togliere. */
export type Scalata = { prodottoId: number; titolo: string; formato: string; copie: number; tolte: number };

/** Una riga del registro: scritta a mano o arrivata dal sito. */
export type Vendita = {
  /** «v12» o «o34»: unica fra le due origini, per le `key` e le ancore. */
  chiave: string;
  origine: "mano" | "sito";
  /** L'id della vendita o dell'ordine. */
  id: number;
  /** «V-2026-014» per quelle a mano, «Ordine #34» per quelle del sito. */
  numero: string;
  /** «2026-11-19». */
  giorno: string;
  nome: string;
  email: string | null;
  telefono: string | null;
  cosa: string;
  importo: number;
  canale: Canale;
  /** Quando è arrivato il denaro; null, da incassare. Un ordine del sito è pagato per definizione. */
  pagatoIl: string | null;
  consegna: "mano" | "spedizione";
  /** Quando è partita o è stata data in mano; null, ancora da fare. */
  consegnatoIl: string | null;
  magazzino: Scalata[];
};

export type VenditaInput = {
  giorno: string;
  nome: string;
  email: string | null;
  telefono: string | null;
  cosa: string;
  importo: number;
  canale: Canale;
  pagatoIl: string | null;
  consegna: "mano" | "spedizione";
  consegnatoIl: string | null;
};

export type Spesa = { id: number; giorno: string; descrizione: string; importo: number };

/** Le cifre di un mese, in centesimi. */
export type ContoMese = {
  /** 1–12. */
  mese: number;
  contanti: number;
  bonifico: number;
  /** Il lettore al banco e gli ordini del sito. */
  sumup: number;
  /** Senza commissione: nei conti PayPal non trattiene niente, per ora. */
  paypal: number;
  spese: number;
  /** Quello che SumUp trattiene sulle vendite SumUp del mese. */
  commissioni: number;
};

export const venditeDi = (c: ContoMese) => c.contanti + c.bonifico + c.sumup + c.paypal;
export const nettoDi = (c: ContoMese) => venditeDi(c) - c.spese - c.commissioni;

/**
 * Quello che SumUp trattiene su ogni incasso, al banco e sul sito: il 2,5 %,
 * senza quota fissa —su 20 € ne tiene 0,50— (cliente, 2026-11-20). Non si
 * scrive da nessuna parte: si calcola vendita per vendita, arrotondato al
 * centesimo come fa SumUp. Se cambia la tariffa, cambia qui, e cambiano anche
 * i mesi passati.
 */
export const COMMISSIONE_SUMUP = 0.025;
export const commissioneDi = (v: { canale: Canale; importo: number }) =>
  v.canale === "sumup" ? Math.round(v.importo * COMMISSIONE_SUMUP) : 0;

export const numeroVendita = (anno: number, numero: number) => `V-${anno}-${String(numero).padStart(3, "0")}`;

const giornoItaliano = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(d);

/* -------------------------------------------------------------- vendite */

const COLONNE_VENDITA = `v.id, v.anno, v.numero, v.giorno::text AS giorno, v.nome, v.email, v.telefono, v.cosa, v.importo,
  v.canale, v.pagato_il::text AS pagato_il, v.consegna, v.consegnato_il::text AS consegnato_il,
  COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
             'prodottoId', (s ->> 'prodotto_id')::int,
             'titolo', COALESCE(p.title, s ->> 'titolo'),
             'formato', s ->> 'formato',
             'copie', (s ->> 'copie')::int,
             'tolte', (s ->> 'tolte')::int))
      FROM jsonb_array_elements(v.magazzino) s
      LEFT JOIN prodotti p ON p.id = (s ->> 'prodotto_id')::int
  ), '[]'::jsonb) AS magazzino`;

function daRiga(r: Record<string, unknown>): Vendita {
  return {
    chiave: `v${r.id}`,
    origine: "mano",
    id: Number(r.id),
    numero: numeroVendita(Number(r.anno), Number(r.numero)),
    giorno: String(r.giorno),
    nome: String(r.nome),
    email: r.email ? String(r.email) : null,
    telefono: r.telefono ? String(r.telefono) : null,
    cosa: String(r.cosa),
    importo: Number(r.importo),
    canale: eCanale(String(r.canale)) ? String(r.canale) as Canale : "contanti",
    pagatoIl: r.pagato_il ? String(r.pagato_il) : null,
    consegna: r.consegna === "spedizione" ? "spedizione" : "mano",
    consegnatoIl: r.consegnato_il ? String(r.consegnato_il) : null,
    magazzino: Array.isArray(r.magazzino) ? (r.magazzino as Scalata[]) : [],
  };
}

/** Un ordine del sito, con la forma di una riga del registro. */
function daOrdine(o: Ordine): Vendita {
  const giorno = giornoItaliano(o.creato);
  return {
    chiave: `o${o.id}`,
    origine: "sito",
    id: o.id,
    numero: `Ordine #${o.id}`,
    giorno,
    nome: o.nome ?? o.email,
    email: o.email,
    telefono: o.telefono,
    cosa: o.righe.map((r) => `${r.quantita > 1 ? `${r.quantita} × ` : ""}${r.title} (${variante(r)})`).join(", "),
    importo: o.totale,
    // Il sito incassa con SumUp.
    canale: "sumup",
    pagatoIl: giorno,
    // Il ritiro in negozio è una consegna a mano; «spedito» vuol dire consegnato anche lì.
    consegna: o.consegna === "ritiro" ? "mano" : "spedizione",
    consegnatoIl: o.stato === "spedito" && o.spedito ? giornoItaliano(o.spedito) : null,
    magazzino: [],
  };
}

const piuRecenti = (a: Vendita, b: Vendita) =>
  a.giorno === b.giorno ? b.chiave.localeCompare(a.chiave, undefined, { numeric: true }) : b.giorno.localeCompare(a.giorno);

async function ordiniValidi(): Promise<Ordine[]> {
  return (await listOrdini()).filter((o) => o.stato !== "rimborsato");
}

/** Le vendite di un mese, dalle tre parti, dalla più recente. */
export async function venditeDelMese(anno: number, mese: number): Promise<Vendita[]> {
  const chiave = `${anno}-${String(mese).padStart(2, "0")}`;
  const [mano, ordini] = await Promise.all([
    query<Record<string, unknown>>(
      `SELECT ${COLONNE_VENDITA} FROM vendite v
        WHERE v.giorno >= make_date($1, $2, 1) AND v.giorno < make_date($1, $2, 1) + interval '1 month'`,
      [anno, mese],
    ),
    ordiniValidi(),
  ]);
  return [...mano.map(daRiga), ...ordini.map(daOrdine).filter((v) => v.giorno.startsWith(chiave))].sort(piuRecenti);
}

/**
 * Quello che aspetta qualcosa, di qualunque mese: un bonifico che non è
 * arrivato, un pacco da spedire, una stampa da dare in mano. Un bonifico di
 * ottobre non pagato non smette di contare perché è cominciato novembre.
 */
export async function venditeDaFare(): Promise<Vendita[]> {
  const [mano, ordini] = await Promise.all([
    query<Record<string, unknown>>(
      `SELECT ${COLONNE_VENDITA} FROM vendite v WHERE v.pagato_il IS NULL OR v.consegnato_il IS NULL`,
    ),
    ordiniValidi(),
  ]);
  return [...mano.map(daRiga), ...ordini.filter((o) => o.stato === "pagato").map(daOrdine)].sort(piuRecenti);
}

export const daFare = (v: Vendita) => v.pagatoIl === null || v.consegnatoIl === null;

export async function getVendita(id: number): Promise<Vendita | null> {
  const rows = await query<Record<string, unknown>>(`SELECT ${COLONNE_VENDITA} FROM vendite v WHERE v.id = $1`, [id]);
  return rows[0] ? daRiga(rows[0]) : null;
}

/** Una copia da togliere, come la chiede il modulo. */
export type DaTogliere = { prodottoId: number; formato: string; copie: number };

/**
 * Scrive una vendita e toglie dal magazzino le copie che lei ha indicato.
 *
 * Tutto in una transazione: il numero dell'anno si prende sotto un lucchetto
 * —due vendite nello stesso istante non si prendono lo stesso— e le copie si
 * tolgono con la vendita, o niente. Un formato che lei non conta resta com'è:
 * si segna che non c'era niente da togliere, e cancellando la vendita non si
 * rimette niente.
 */
export async function creaVendita(input: VenditaInput, togliere: DaTogliere[]): Promise<Vendita> {
  const anno = Number(input.giorno.slice(0, 4));
  return transaction(async (run) => {
    await run(`SELECT pg_advisory_xact_lock(hashtext('vendite'), $1)`, [anno]);
    const [{ numero }] = await run<{ numero: number }>(
      `SELECT COALESCE(MAX(numero), 0) + 1 AS numero FROM vendite WHERE anno = $1`,
      [anno],
    );

    const scalate: { prodotto_id: number; titolo: string; formato: string; copie: number; tolte: number }[] = [];
    for (const t of togliere) {
      const [p] = await run<{ title: string }>(`SELECT title FROM prodotti WHERE id = $1`, [t.prodottoId]);
      if (!p) continue;
      const [riga] = await run<{ copie: number }>(
        `SELECT copie FROM magazzino WHERE prodotto_id = $1 AND formato = $2 FOR UPDATE`,
        [t.prodottoId, t.formato],
      );
      const tolte = riga ? Math.min(Number(riga.copie), t.copie) : 0;
      if (tolte > 0) {
        await run(
          `UPDATE magazzino SET copie = copie - $3, updated_at = now() WHERE prodotto_id = $1 AND formato = $2`,
          [t.prodottoId, t.formato, tolte],
        );
      }
      scalate.push({ prodotto_id: t.prodottoId, titolo: p.title, formato: t.formato, copie: t.copie, tolte });
    }

    const [r] = await run<{ id: number }>(
      `INSERT INTO vendite (anno, numero, giorno, nome, email, telefono, cosa, importo, canale, pagato_il, consegna, consegnato_il, magazzino)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        anno,
        Number(numero),
        input.giorno,
        input.nome,
        input.email,
        input.telefono,
        input.cosa,
        input.importo,
        input.canale,
        input.pagatoIl,
        input.consegna,
        input.consegnatoIl,
        JSON.stringify(scalate),
      ],
    );
    const [riga] = await run<Record<string, unknown>>(`SELECT ${COLONNE_VENDITA} FROM vendite v WHERE v.id = $1`, [r.id]);
    return daRiga(riga);
  });
}

/** Corregge una vendita. Numero e copie tolte restano quelli della prima volta. */
export async function aggiornaVendita(id: number, input: VenditaInput): Promise<boolean> {
  const rows = await query<{ id: number }>(
    `UPDATE vendite
        SET giorno = $2, nome = $3, email = $4, telefono = $5, cosa = $6, importo = $7, canale = $8,
            pagato_il = $9, consegna = $10, consegnato_il = $11
      WHERE id = $1
  RETURNING id`,
    [
      id,
      input.giorno,
      input.nome,
      input.email,
      input.telefono,
      input.cosa,
      input.importo,
      input.canale,
      input.pagatoIl,
      input.consegna,
      input.consegnatoIl,
    ],
  );
  return rows.length > 0;
}

/** Il gesto di una riga: «è arrivato il bonifico», «è partita». */
export async function segnaVendita(id: number, cosa: "pagata" | "consegnata", giorno: string): Promise<void> {
  const colonna = cosa === "pagata" ? "pagato_il" : "consegnato_il";
  await query(`UPDATE vendite SET ${colonna} = $2 WHERE id = $1 AND ${colonna} IS NULL`, [id, giorno]);
}

/** Cancella una vendita e rimette nel magazzino le copie che aveva tolto. */
export async function cancellaVendita(id: number): Promise<void> {
  await transaction(async (run) => {
    const [v] = await run<{ magazzino: unknown }>(`DELETE FROM vendite WHERE id = $1 RETURNING magazzino`, [id]);
    if (!v || !Array.isArray(v.magazzino)) return;
    for (const s of v.magazzino as { prodotto_id: number; formato: string; tolte: number }[]) {
      if (!(s.tolte > 0)) continue;
      await run(
        `UPDATE magazzino SET copie = copie + $3, updated_at = now() WHERE prodotto_id = $1 AND formato = $2`,
        [s.prodotto_id, s.formato, s.tolte],
      );
    }
  });
}

/** Le persone a cui ha già venduto, per non riscriverle: nome, email e telefono più recenti. */
export type Cliente = { nome: string; email: string | null; telefono: string | null };

export async function listClienti(): Promise<Cliente[]> {
  const [mano, ordini] = await Promise.all([
    query<{ nome: string; email: string | null; telefono: string | null }>(
      `SELECT DISTINCT ON (lower(nome)) nome, email, telefono FROM vendite ORDER BY lower(nome), giorno DESC, id DESC`,
    ),
    listOrdini(),
  ]);
  const visti = new Map<string, Cliente>();
  for (const c of mano) visti.set(c.nome.toLowerCase(), { nome: c.nome, email: c.email, telefono: c.telefono });
  for (const o of ordini) {
    if (!o.nome || visti.has(o.nome.toLowerCase())) continue;
    visti.set(o.nome.toLowerCase(), { nome: o.nome, email: o.email, telefono: o.telefono });
  }
  return [...visti.values()].sort((a, b) => a.nome.localeCompare(b.nome, "it"));
}

/* ---------------------------------------------------------------- spese */

export async function listSpese(anno: number, mese: number): Promise<Spesa[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, giorno::text AS giorno, descrizione, importo FROM spese
      WHERE giorno >= make_date($1, $2, 1) AND giorno < make_date($1, $2, 1) + interval '1 month'
      ORDER BY giorno DESC, id DESC`,
    [anno, mese],
  );
  return rows.map((r) => ({
    id: Number(r.id),
    giorno: String(r.giorno),
    descrizione: String(r.descrizione),
    importo: Number(r.importo),
  }));
}

export async function aggiungiSpesa(s: Omit<Spesa, "id">): Promise<void> {
  await query(`INSERT INTO spese (giorno, descrizione, importo) VALUES ($1, $2, $3)`, [s.giorno, s.descrizione, s.importo]);
}

export async function cancellaSpesa(id: number): Promise<void> {
  await query(`DELETE FROM spese WHERE id = $1`, [id]);
}

/* ----------------------------------------------------------------- anno */

/** Le dodici righe di un anno, anche quelle vuote. Una vendita conta nel mese in cui si è fatta, pagata o no. */
export async function contiAnno(anno: number): Promise<ContoMese[]> {
  const [vendite, ordini, spese] = await Promise.all([
    query<{ mese: number; canale: string; somma: string; commissioni: string }>(
      `SELECT extract(month FROM giorno)::int AS mese, canale, sum(importo)::bigint AS somma,
              sum(round(importo * $2::numeric))::bigint AS commissioni
         FROM vendite
        WHERE giorno >= make_date($1, 1, 1) AND giorno < make_date($1 + 1, 1, 1)
        GROUP BY 1, 2`,
      [anno, COMMISSIONE_SUMUP],
    ),
    query<{ mese: number; somma: string; commissioni: string }>(
      `SELECT extract(month FROM created_at AT TIME ZONE 'Europe/Rome')::int AS mese, sum(totale)::bigint AS somma,
              sum(round(totale * $2::numeric))::bigint AS commissioni
         FROM ordini
        WHERE stato <> 'rimborsato'
          AND created_at AT TIME ZONE 'Europe/Rome' >= make_date($1, 1, 1)
          AND created_at AT TIME ZONE 'Europe/Rome' < make_date($1 + 1, 1, 1)
        GROUP BY 1`,
      [anno, COMMISSIONE_SUMUP],
    ),
    query<{ mese: number; somma: string }>(
      `SELECT extract(month FROM giorno)::int AS mese, sum(importo)::bigint AS somma
         FROM spese
        WHERE giorno >= make_date($1, 1, 1) AND giorno < make_date($1 + 1, 1, 1)
        GROUP BY 1`,
      [anno],
    ),
  ]);

  const mesi: ContoMese[] = Array.from({ length: 12 }, (_, i) => ({ mese: i + 1, contanti: 0, bonifico: 0, sumup: 0, paypal: 0, spese: 0, commissioni: 0 }));
  for (const r of vendite) {
    const m = mesi[Number(r.mese) - 1];
    if (r.canale === "bonifico") m.bonifico += Number(r.somma);
    else if (r.canale === "paypal") m.paypal += Number(r.somma);
    else if (r.canale === "sumup") {
      m.sumup += Number(r.somma);
      m.commissioni += Number(r.commissioni);
    } else m.contanti += Number(r.somma);
  }
  // Il sito incassa con SumUp: paga la stessa commissione.
  for (const r of ordini) {
    const m = mesi[Number(r.mese) - 1];
    m.sumup += Number(r.somma);
    m.commissioni += Number(r.commissioni);
  }
  for (const r of spese) mesi[Number(r.mese) - 1].spese = Number(r.somma);
  return mesi;
}

/** Vendite e spese di un periodo, per il foglio del commercialista. */
export async function registroPeriodo(anno: number, mese: number | null): Promise<{ vendite: Vendita[]; spese: Spesa[] }> {
  const dal = `${anno}-${String(mese ?? 1).padStart(2, "0")}-01`;
  const durata = mese ? "1 month" : "1 year";
  const prefisso = mese ? `${anno}-${String(mese).padStart(2, "0")}` : `${anno}-`;
  const [mano, ordini, spese] = await Promise.all([
    query<Record<string, unknown>>(
      `SELECT ${COLONNE_VENDITA} FROM vendite v WHERE v.giorno >= $1::date AND v.giorno < $1::date + $2::interval`,
      [dal, durata],
    ),
    ordiniValidi(),
    query<Record<string, unknown>>(
      `SELECT id, giorno::text AS giorno, descrizione, importo FROM spese
        WHERE giorno >= $1::date AND giorno < $1::date + $2::interval`,
      [dal, durata],
    ),
  ]);
  const perData = <T extends { giorno: string }>(a: T, b: T) => a.giorno.localeCompare(b.giorno);
  return {
    vendite: [...mano.map(daRiga), ...ordini.map(daOrdine).filter((v) => v.giorno.startsWith(prefisso))].sort(perData),
    spese: spese
      .map((r) => ({ id: Number(r.id), giorno: String(r.giorno), descrizione: String(r.descrizione), importo: Number(r.importo) }))
      .sort(perData),
  };
}
