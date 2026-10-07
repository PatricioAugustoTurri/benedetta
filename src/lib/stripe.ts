import Stripe from "stripe";

/**
 * Stripe, dal lato server e da nessun'altra parte.
 *
 * La chiave segreta non esce mai di qui: il browser non parla con Stripe se
 * non attraverso la pagina di Checkout che Stripe stesso serve. Il sito non
 * vede né conserva mai un numero di carta.
 *
 * **Modalità di prova.** Finché lei non ha un account, le chiavi sono quelle
 * di prova (cominciano con `sk_test_`): il pagamento si fa con le carte
 * finte di Stripe e non si muove denaro. Passare a quelle vere è cambiare le
 * due variabili, non il codice.
 */
export function stripeConfigurato(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

const globalForStripe = globalThis as unknown as { stripe?: Stripe };

export function stripe(): Stripe {
  const chiave = process.env.STRIPE_SECRET_KEY;
  if (!chiave) throw new Error("STRIPE_SECRET_KEY non è configurata.");
  // Uno solo, per la stessa ragione del pool del database: il ricaricamento a
  // caldo rivaluterebbe il modulo a ogni modifica.
  globalForStripe.stripe ??= new Stripe(chiave);
  return globalForStripe.stripe;
}

/** Se si sta usando la chiave di prova: lo si dice nel carrello, per non confondere nessuno. */
export function stripeInProva(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");
}

/* ----------------------------------------------------------- spedizione */

export type Zona = "italia" | "ue";

/** I paesi dell'Unione Europea, Italia esclusa: l'Italia è una zona a sé. */
const PAESI_UE = [
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR",
  "HU", "IE", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK",
] as const;

export type TariffaSpedizione = {
  zona: Zona;
  etichetta: string;
  /** Centesimi. */
  prezzo: number;
  paesi: readonly string[];
};

/**
 * Le due zone di spedizione, Italia e resto dell'Unione Europea.
 *
 * **Si sceglie la zona nel carrello, prima di pagare.** Checkout di Stripe
 * mostra tutte le tariffe che riceve a chiunque, senza guardare il paese: con
 * due tariffe, chi spedisce in Francia potrebbe scegliere quella italiana.
 * Scegliendo qui, a Stripe arriva una tariffa sola e solo i paesi di quella
 * zona, quindi l'indirizzo e il prezzo non possono non coincidere.
 *
 * Quanto costa spedire l'ha deciso la cliente (2026-10-07): 5 € in Italia,
 * 10 € nel resto dell'Unione Europea, a ordine e non a copia. Vive nel codice
 * come il listino delle stampe (FORMATI_BASE): prima stava in due variabili
 * d'ambiente perché la cifra non c'era ancora e il pagamento doveva restare
 * fermo finché lei non la dava.
 */
export function tariffeSpedizione(): TariffaSpedizione[] {
  return [
    {
      zona: "italia",
      etichetta: "Italia",
      prezzo: 500,
      paesi: ["IT"],
    },
    {
      zona: "ue",
      etichetta: "Unione Europea",
      prezzo: 1000,
      paesi: PAESI_UE,
    },
  ];
}
