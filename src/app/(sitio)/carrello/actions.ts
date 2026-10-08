"use server";

import { origine } from "@/lib/origine";
import { redirect } from "next/navigation";
import type { VoceCarrello } from "@/components/carrello/store";
import { site } from "@/data/site";
import { stampePerSlug } from "@/lib/prodotti";
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
  const stampe = await stampePerSlug([...new Set(richiesta.map((r) => r.slug))]);
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
      prezzo: f.prezzo,
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

  // L'indirizzo a cui Stripe riporta. In produzione è il dominio; in
  // sviluppo, quello da cui si sta navigando.
  const base = await origine();

  let url: string | null;
  try {
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
      phone_number_collection: { enabled: true },
      success_url: `${base}/carrello/grazie?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/carrello`,
      metadata: { zona: tariffa.zona },
    });
    url = sessione.url;
  } catch (e) {
    console.error("Stripe: non ho potuto creare la sessione", e);
    return { error: "Stripe non ha risposto. Riprova tra un momento." };
  }

  if (!url) return { error: "Stripe non ha restituito la pagina di pagamento. Riprova." };
  redirect(url);
}
