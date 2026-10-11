/**
 * SumUp, dal lato server e da nessun'altra parte.
 *
 * Lei incassa già con SumUp ai mercatini: il negozio online usa lo stesso
 * conto, così i soldi arrivano in un posto solo. Si usa la **Hosted
 * Checkout**: il sito crea un pagamento con l'importo, SumUp restituisce
 * l'indirizzo di una sua pagina, e lì si scrive la carta. Il sito non vede
 * né conserva mai un numero di carta.
 *
 * **SumUp sa solo quanto.** Un pagamento SumUp è un importo e una
 * descrizione: niente righe, niente indirizzo, niente codici sconto. Per
 * questo i dati di chi compra si scrivono nel carrello, e l'ordine intero si
 * salva nella tabella `pagamenti` prima di partire (vedi src/lib/pagamento.ts).
 *
 * Due chiamate, con `fetch` e senza libreria: creare un pagamento e
 * rileggerlo. La chiave segreta non esce mai di qui.
 *
 * **Modalità di prova.** Il conto di prova di SumUp (Developer Settings →
 * Sandboxes) ha un suo codice esercente e una sua chiave: passare a quello
 * vero è cambiare le variabili, non il codice. `SUMUP_PROVA` lo dice al
 * carrello e all'admin, perché la chiave non lo dice da sola.
 */

const API = "https://api.sumup.com/v0.1";

export function sumupConfigurato(): boolean {
  return Boolean(process.env.SUMUP_API_KEY && process.env.SUMUP_MERCHANT_CODE);
}

/** Se si sta usando il conto di prova: lo si dice nel carrello, per non confondere nessuno. */
export function sumupInProva(): boolean {
  return ["1", "true", "si", "sì"].includes((process.env.SUMUP_PROVA ?? "").trim().toLowerCase());
}

export function codiceEsercente(): string {
  const codice = process.env.SUMUP_MERCHANT_CODE;
  if (!codice) throw new Error("SUMUP_MERCHANT_CODE non è configurato.");
  return codice;
}

export type StatoCheckout = "PENDING" | "FAILED" | "PAID" | "EXPIRED";

/** Quello che si legge di un pagamento: solo i campi che servono qui. */
export type CheckoutSumUp = {
  id: string;
  status: StatoCheckout;
  checkout_reference: string;
  /** In euro, non in centesimi: 38.5 è 38,50 €. */
  amount: number;
  currency: string;
  merchant_code: string;
  /** Il codice che lei ritrova nell'app di SumUp, accanto all'incasso. */
  transaction_code?: string;
  hosted_checkout_url?: string;
};

async function chiama<T>(percorso: string, init?: RequestInit): Promise<T> {
  const chiave = process.env.SUMUP_API_KEY;
  if (!chiave) throw new Error("SUMUP_API_KEY non è configurata.");
  const r = await fetch(`${API}${percorso}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${chiave}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
    // SumUp che non risponde non deve lasciare il carrello appeso.
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) {
    const testo = await r.text().catch(() => "");
    throw new Error(`SumUp ${r.status} su ${percorso}: ${testo.slice(0, 500)}`);
  }
  return (await r.json()) as T;
}

/**
 * Crea il pagamento e restituisce l'indirizzo della pagina di SumUp.
 *
 * - `riferimento` è la riga di `pagamenti` che tiene l'ordine: torna con
 *   ogni lettura del pagamento, ed è quello che li lega.
 * - `avviso` è dove SumUp chiama quando il pagamento cambia stato (il
 *   webhook). Solo in https: in locale SumUp non può raggiungere il sito, e
 *   l'ordine lo registra la pagina di ringraziamento.
 * - `rientro` è dove SumUp riporta chi ha pagato.
 */
export async function creaCheckout(p: {
  riferimento: string;
  /** Centesimi. */
  totale: number;
  descrizione: string;
  avviso: string;
  rientro: string;
}): Promise<{ id: string; url: string }> {
  const c = await chiama<CheckoutSumUp>("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      checkout_reference: p.riferimento,
      amount: Number((p.totale / 100).toFixed(2)),
      currency: "EUR",
      merchant_code: codiceEsercente(),
      description: p.descrizione,
      ...(p.avviso.startsWith("https://") ? { return_url: p.avviso } : {}),
      redirect_url: p.rientro,
      hosted_checkout: { enabled: true },
    }),
  });
  if (!c.hosted_checkout_url) throw new Error(`SumUp non ha restituito la pagina per ${c.id}`);
  return { id: c.id, url: c.hosted_checkout_url };
}

/** Rilegge un pagamento: è l'unica fonte di verità su com'è andato. */
export async function leggiCheckout(id: string): Promise<CheckoutSumUp> {
  return chiama<CheckoutSumUp>(`/checkouts/${encodeURIComponent(id)}`);
}
