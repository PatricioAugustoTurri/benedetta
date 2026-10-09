"use server";

import { origine } from "@/lib/origine";
import { redirect } from "next/navigation";
import type { VoceCarrello } from "@/components/carrello/store";
import { site } from "@/data/site";
import { prezzoScontato, scontoCodice } from "@/data/shop";
import { cercaCodice, normalizzaCodice, type Ricerca } from "@/lib/codici";
import { giornoLungo } from "@/lib/oggi";
import { stampePerSlug } from "@/lib/prodotti";
import { scontiInCorso } from "@/lib/sconti";
import { stripe, stripeConfigurato, tariffeSpedizione, type Zona } from "@/lib/stripe";
import { immagineFerma } from "@/lib/video";

// Lo stesso tetto del carrello (store.ts), ripetuto perché quello è un modulo client.
const MAX_QUANTITA = 10;
const MAX_RIGHE = 30;

/** Quello che il browser dice di avere nel carrello. Solo questo si legge: il resto si ricalcola. */
type Richiesta = { slug: string; formato: string; quantita: number };

/*
  Il carrello arriva dal browser, quindi da qualsiasi parte: si controlla la
  forma prima di guardare il contenuto, e si buttano le righe che non hanno
  senso invece di fallire tutto per una.
*/
function leggiRichiesta(crudo: unknown): Richiesta[] {
  if (!Array.isArray(crudo)) return [];
  return crudo
    .slice(0, MAX_RIGHE)
    .filter(
      (r): r is Richiesta =>
        typeof r === "object" &&
        r !== null &&
        typeof (r as Richiesta).slug === "string" &&
        typeof (r as Richiesta).formato === "string" &&
        Number.isInteger((r as Richiesta).quantita) &&
        (r as Richiesta).quantita > 0,
    )
    .map((r) => ({ ...r, quantita: Math.min(r.quantita, MAX_QUANTITA) }));
}

/**
 * Le righe del carrello, rifatte contro la tabella: titolo, prezzo e
 * copertina sono quelli di adesso, non quelli di quando si è aggiunto. Una
 * stampa che non c'è più —tolta, tornata bozza, senza quel formato— esce.
 */
async function rifai(richiesta: Richiesta[]): Promise<VoceCarrello[]> {
  const [stampe, sconti] = await Promise.all([
    stampePerSlug([...new Set(richiesta.map((r) => r.slug))]),
    // Lo sconto si applica qui, e solo qui: è la stessa funzione che prepara
    // il carrello e il pagamento, quindi il prezzo scontato che si vede è
    // quello che Stripe addebita.
    scontiInCorso().catch(() => new Map()),
  ]);
  const voci: VoceCarrello[] = [];
  for (const r of richiesta) {
    const p = stampe.find((s) => s.slug === r.slug);
    const f = p?.formati.find((x) => x.formato === r.formato);
    if (!p || !f) continue;
    const portada = p.image[0];
    voci.push({
      slug: p.slug,
      formato: f.formato,
      quantita: r.quantita,
      title: p.title,
      prezzo: prezzoScontato(f.prezzo, sconti.get(p.id)?.percentuale),
      scontata: sconti.has(p.id),
      immagine: portada
        ? { url: immagineFerma(portada), width: portada.width, height: portada.height, alt: portada.alt }
        : undefined,
    });
  }
  return voci;
}

/**
 * La conferma del carrello, che la pagina chiede appena si apre.
 *
 * Dice anche cosa è cambiato, perché sparire in silenzio è peggio che
 * sparire: chi aveva messo una stampa a 15 € e la ritrova a 18 € deve
 * saperlo prima di pagare, non dopo.
 */
export async function verificaCarrello(
  richiesta: Richiesta[],
): Promise<{ voci: VoceCarrello[]; tolte: number; prezziCambiati: boolean }> {
  const lette = leggiRichiesta(richiesta);
  const voci = await rifai(lette);
  const prima = new Map(
    (richiesta as Partial<VoceCarrello>[]).map((r) => [`${r.slug}|${r.formato}`, r.prezzo]),
  );
  return {
    voci,
    tolte: lette.length - voci.length,
    prezziCambiati: voci.some((v) => {
      const p = prima.get(`${v.slug}|${v.formato}`);
      return typeof p === "number" && p !== v.prezzo;
    }),
  };
}

export type EsitoCodice =
  | { ok: true; codice: string; percentuale: number }
  | { ok: false; error: string };

/**
 * Il codice sconto che si scrive nel carrello. Dice solo se esiste e quanto
 * toglie: il conto in euro lo fa il carrello con `scontoCodice`, e il
 * pagamento lo rifà da capo con la stessa funzione.
 */
export async function verificaCodice(crudo: string): Promise<EsitoCodice> {
  const scritto = normalizzaCodice(String(crudo ?? ""));
  if (scritto.length === 0) return { ok: false, error: "Scrivi il codice." };
  try {
    const r = await cercaCodice(scritto);
    return r.stato === "valido"
      ? { ok: true, codice: r.codice, percentuale: r.percentuale }
      : { ok: false, error: motivo(r) };
  } catch {
    return { ok: false, error: "Non riesco a controllare il codice adesso. Riprova tra un momento." };
  }
}

/** Perché un codice non vale, detto a chi ha il biglietto in mano. */
function motivo(r: Exclude<Ricerca, { stato: "valido" }>): string {
  switch (r.stato) {
    case "usato":
      return `Il codice ${r.codice} è già stato usato: vale per un ordine solo.`;
    case "scaduto":
      return `Il codice ${r.codice} è scaduto il ${giornoLungo(r.scade)}.`;
    default:
      return `«${r.codice}» non è un codice valido. Controlla di averlo scritto bene.`;
  }
}

/**
 * Lo sconto come lo vede Stripe: un buono a importo fisso, che Checkout
 * mostra come riga a sé («BENZIBET98 −15%») sopra il totale e nella
 * ricevuta. A importo fisso e non in percentuale perché la percentuale di
 * Stripe varrebbe su tutte le righe, anche su quelle già in sconto di
 * stagione; l'importo lo calcola `scontoCodice`, che le lascia fuori.
 *
 * L'id dice codice, percentuale e importo, così lo stesso buono serve a
 * tutti i carrelli con lo stesso sconto invece di nascerne uno per pagamento.
 * Si crea la prima volta che serve; se esiste già, si usa quello.
 */
async function buonoStripe(codice: string, percentuale: number, importo: number): Promise<string> {
  const id = `codice-${codice}-${percentuale}-${importo}`;
  try {
    await stripe().coupons.create({
      id,
      name: `${codice} −${percentuale}%`,
      amount_off: importo,
      currency: "eur",
      duration: "once",
    });
  } catch (e) {
    if ((e as { code?: string }).code !== "resource_already_exists") throw e;
  }
  return id;
}

export type EsitoPagamento = { error?: string };

/**
 * Il passaggio a Stripe.
 *
 * Il server rifà il carrello da zero con i prezzi della tabella e crea una
 * sessione di Checkout con quelle righe, una sola tariffa di spedizione —
 * quella della zona scelta— e solo i paesi di quella zona. Poi manda il
 * visitatore sulla pagina di Stripe. Da quel momento il sito non tocca più
 * niente fino al ritorno: la carta la vede solo Stripe.
 *
 * Ogni riga porta nei metadati del suo prodotto lo slug e il formato. È
 * quello che il webhook legge per scrivere l'ordine, invece di dover
 * indovinare la stampa dal nome.
 */
export async function vaiAlPagamento(
  _previo: EsitoPagamento,
  formData: FormData,
): Promise<EsitoPagamento> {
  if (!stripeConfigurato()) {
    return {
      error: `Il pagamento online non è ancora attivo. Scrivimi a ${site.email} e la ordiniamo insieme.`,
    };
  }

  const zona = String(formData.get("zona") ?? "") as Zona;
  const tariffa = tariffeSpedizione().find((t) => t.zona === zona);
  if (!tariffa) return { error: "Scegli dove spedire." };

  let richiesta: unknown;
  try {
    richiesta = JSON.parse(String(formData.get("voci") ?? "[]"));
  } catch {
    return { error: "Il carrello è arrivato male. Ricarica la pagina e riprova." };
  }

  const voci = await rifai(leggiRichiesta(richiesta));
  if (voci.length === 0) return { error: "Il carrello è vuoto." };

  /*
    Il codice si ricontrolla qui, non si crede al carrello: può essersi spento
    fra il momento in cui è stato scritto e adesso. Se non vale più si dice e
    ci si ferma, invece di far pagare in silenzio il prezzo pieno a chi
    aspettava lo sconto.
  */
  const scritto = normalizzaCodice(String(formData.get("codice") ?? ""));
  let codice: { codice: string; percentuale: number } | null = null;
  if (scritto) {
    let r: Ricerca;
    try {
      r = await cercaCodice(scritto);
    } catch {
      return { error: "Non riesco a controllare il codice adesso. Riprova tra un momento." };
    }
    if (r.stato !== "valido") return { error: `${motivo(r)} Toglilo per continuare.` };
    codice = { codice: r.codice, percentuale: r.percentuale };
  }
  const importoSconto = codice ? scontoCodice(voci, codice.percentuale) : 0;

  // L'indirizzo a cui Stripe riporta. In produzione è il dominio; in
  // sviluppo, quello da cui si sta navigando.
  const base = await origine();

  let url: string | null;
  try {
    const buono =
      codice && importoSconto > 0
        ? await buonoStripe(codice.codice, codice.percentuale, importoSconto)
        : null;
    const sessione = await stripe().checkout.sessions.create({
      mode: "payment",
      locale: "it",
      line_items: voci.map((v) => ({
        quantity: v.quantita,
        price_data: {
          currency: "eur",
          unit_amount: v.prezzo,
          product_data: {
            name: `${v.title} — ${v.formato}`,
            images: v.immagine ? [v.immagine.url] : undefined,
            metadata: { slug: v.slug, formato: v.formato, title: v.title },
          },
        },
      })),
      shipping_address_collection: {
        allowed_countries: tariffa.paesi as never,
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: `Spedizione — ${tariffa.etichetta}`,
            fixed_amount: { amount: tariffa.prezzo, currency: "eur" },
          },
        },
      ],
      discounts: buono ? [{ coupon: buono }] : undefined,
      phone_number_collection: { enabled: true },
      success_url: `${base}/carrello/grazie?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/carrello`,
      // Il webhook lo scrive nell'ordine: Stripe dice quanto, non con quale codice.
      metadata: { zona: tariffa.zona, ...(buono && codice ? { codice: codice.codice } : {}) },
    });
    url = sessione.url;
  } catch (e) {
    console.error("Stripe: non ho potuto creare la sessione", e);
    return { error: "Stripe non ha risposto. Riprova tra un momento." };
  }

  if (!url) return { error: "Stripe non ha restituito la pagina di pagamento. Riprova." };
  redirect(url);
}
