import { randomUUID } from "node:crypto";
import { creaBiglietto, segnaUsato } from "@/lib/codici";
import { avvisaOrdine, confermaOrdine, correoConfigurado } from "@/lib/correo";
import { query } from "@/lib/db";
import { registraOrdine, type Ordine } from "@/lib/prodotti";
import { codiceEsercente, leggiCheckout } from "@/lib/sumup";

/**
 * Il viaggio di un ordine fino a SumUp e ritorno.
 *
 * SumUp riceve solo un importo, quindi tutto il resto —chi compra, dove
 * spedire, quali stampe, quale codice— resta qui, in una riga di
 * `pagamenti`, prima di mandare chi compra a pagare. Quando SumUp dice che il
 * pagamento è andato, l'ordine nasce da quella riga.
 *
 * **Si crede solo a SumUp.** L'avviso che SumUp manda al webhook non è
 * firmato: dice soltanto «il pagamento X è cambiato». Per questo nessuno dei
 * due ingressi —l'avviso e la pagina di ringraziamento— prende per buono
 * quello che riceve: tutti e due rileggono il pagamento dall'API di SumUp e
 * controllano che importo, valuta, esercente e riferimento siano quelli di
 * questa riga.
 */

/** L'ordine com'è prima di essere pagato: quello che diventerà la riga di `ordini`. */
export type Bozza = Omit<
  Ordine,
  "id" | "pagamento" | "transazione" | "stato" | "creato" | "spedito" | "corriere" | "tracking" | "avvisato"
>;

/** Quanti giorni resta una bozza. Dopo, chi è tornato è tornato, e i dati di chi non ha pagato non servono più. */
const GIORNI = 7;

/**
 * Salva la bozza e restituisce il riferimento da dare a SumUp. Approfitta
 * per buttare le bozze vecchie: un indirizzo e un telefono di chi non ha
 * comprato non devono restare in giro.
 */
export async function apriPagamento(bozza: Bozza): Promise<string> {
  const riferimento = randomUUID();
  await query(`INSERT INTO pagamenti (riferimento, bozza, totale) VALUES ($1, $2::jsonb, $3)`, [
    riferimento,
    JSON.stringify(bozza),
    bozza.totale,
  ]);
  await query(`DELETE FROM pagamenti WHERE created_at < now() - make_interval(days => $1)`, [GIORNI]).catch(
    (e) => console.error("Pagamenti: pulizia non riuscita", e),
  );
  return riferimento;
}

/** Lega la bozza al pagamento che SumUp ha appena creato. */
export async function legaCheckout(riferimento: string, checkout: string): Promise<void> {
  await query(`UPDATE pagamenti SET checkout = $2 WHERE riferimento = $1`, [riferimento, checkout]);
}

/** Il riferimento di un pagamento SumUp, o null se non è partito da qui. */
export async function riferimentoDi(checkout: string): Promise<string | null> {
  const rows = await query<{ riferimento: string }>(
    `SELECT riferimento FROM pagamenti WHERE checkout = $1`,
    [checkout],
  );
  return rows[0]?.riferimento ?? null;
}

export type Esito =
  | { stato: "pagato"; email: string; errore?: unknown }
  | { stato: "in_attesa" }
  | { stato: "non_pagato" }
  | { stato: "sconosciuto" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Chiede a SumUp com'è andato e, se è pagato, scrive l'ordine.
 *
 * Si può chiamare quante volte si vuole: l'ordine nasce una volta sola
 * (`ON CONFLICT` su `pagamento`), e le mail partono solo da chi l'ha fatto
 * nascere.
 *
 * Se SumUp dice pagato ma l'ordine non si scrive, l'esito resta «pagato»
 * —chi ha pagato ha pagato— con l'errore accanto: il webhook risponde 500
 * perché SumUp riprovi, la pagina ringrazia lo stesso.
 */
export async function confermaPagamento(riferimento: string): Promise<Esito> {
  if (!UUID.test(riferimento)) return { stato: "sconosciuto" };

  const rows = await query<{ checkout: string | null; bozza: Bozza; totale: number }>(
    `SELECT checkout, bozza, totale FROM pagamenti WHERE riferimento = $1`,
    [riferimento],
  );
  const riga = rows[0];
  if (!riga?.checkout) return { stato: "sconosciuto" };

  const c = await leggiCheckout(riga.checkout);
  if (c.status === "PENDING") return { stato: "in_attesa" };
  if (c.status !== "PAID") return { stato: "non_pagato" };

  if (
    c.checkout_reference !== riferimento ||
    c.merchant_code !== codiceEsercente() ||
    c.currency !== "EUR" ||
    Math.round(c.amount * 100) !== Number(riga.totale)
  ) {
    console.error("Pagamento: SumUp non coincide con la bozza", riferimento, c);
    return { stato: "sconosciuto" };
  }

  const bozza = riga.bozza;
  try {
    const ordine = await registraOrdine({
      ...bozza,
      pagamento: c.id,
      transazione: c.transaction_code ?? null,
    });
    // Già registrato: dall'altro ingresso, e le mail sono già partite.
    if (ordine) await dopoOrdine(ordine);
  } catch (errore) {
    console.error("Pagamento: pagato ma l'ordine non si è scritto", riferimento, errore);
    return { stato: "pagato", email: bozza.email, errore };
  }
  return { stato: "pagato", email: bozza.email };
}

/**
 * I codici e le mail, dopo l'ordine e senza farlo fallire: l'ordine è la
 * cosa che non si può perdere. Un biglietto che non nasce qui si crea dalla
 * pagina degli ordini; un codice monouso non segnato è al peggio un secondo
 * uso; una mail che non parte la recupera lei, che vede l'ordine in
 * /admin/ordini comunque.
 */
async function dopoOrdine(ordine: Ordine) {
  try {
    if (ordine.codice) await segnaUsato(ordine.codice, ordine.id);
    await creaBiglietto(ordine.id);
  } catch (e) {
    console.error("Pagamento: codici dell'ordine non aggiornati", ordine.id, e);
  }

  if (!correoConfigurado()) return;
  const esiti = await Promise.allSettled([avvisaOrdine(ordine), confermaOrdine(ordine)]);
  for (const e of esiti) {
    if (e.status === "rejected") console.error("Pagamento: mail dell'ordine non partita", e.reason);
  }
}
