"use server";

import { origine } from "@/lib/origine";
import type { VoceCarrello } from "@/components/carrello/store";
import { site } from "@/data/site";
import { prezzoScontato, scontoCodice } from "@/data/shop";
import { cercaCodice, normalizzaCodice, type Ricerca } from "@/lib/codici";
import { giornoLungo } from "@/lib/oggi";
import { stampePerSlug } from "@/lib/prodotti";
import { scontiInCorso } from "@/lib/sconti";
import { apriPagamento, legaCheckout } from "@/lib/pagamento";
import { pulisci, tariffaPer, validaSpedizione, type DatiSpedizione, type ErroriSpedizione } from "@/lib/spedizione";
import { creaCheckout, sumupConfigurato } from "@/lib/sumup";
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
    // quello che SumUp addebita.
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

export type RichiestaPagamento = {
  /** Quello che il browser dice di avere nel carrello: si rifà da capo. */
  voci: unknown;
  /** Il codice già applicato nel carrello, o vuoto: si ricontrolla. */
  codice: string;
  /** Quello che chi compra ha scritto nel modulo: si ricontrolla. */
  dati: DatiSpedizione;
};

export type EsitoPagamento = { url: string } | { error: string; errori?: ErroriSpedizione };

/**
 * Il passaggio a SumUp.
 *
 * Il server non crede a niente di quello che arriva: rifà il carrello con i
 * prezzi della tabella, ricontrolla il codice, ricontrolla i dati e calcola
 * la spedizione dal paese dell'indirizzo. Poi salva l'ordine intero come
 * bozza (`pagamenti`), crea su SumUp un pagamento per il totale e
 * restituisce l'indirizzo della pagina di SumUp. Da quel momento il sito
 * non tocca più niente fino al ritorno: la carta la vede solo SumUp.
 *
 * Restituisce l'indirizzo invece di fare `redirect`: il carrello chiama
 * l'azione a mano —per non perdere quello che si è scritto se qualcosa va
 * storto— e ci va lui.
 */
export async function vaiAlPagamento(r: RichiestaPagamento): Promise<EsitoPagamento> {
  if (!sumupConfigurato()) {
    return {
      error: `Il pagamento online non è ancora attivo. Scrivimi a ${site.email} e la ordiniamo insieme.`,
    };
  }

  const crudi = (r?.dati ?? {}) as DatiSpedizione;
  const errori = validaSpedizione(crudi);
  if (Object.keys(errori).length > 0) {
    return { error: "Controlla i dati segnati qui sopra.", errori };
  }
  const dati = pulisci(crudi);
  // Validato: il paese è in una delle due zone.
  const tariffa = tariffaPer(dati.paese)!;

  const voci = await rifai(leggiRichiesta(r?.voci));
  if (voci.length === 0) return { error: "Il carrello è vuoto." };

  /*
    Il codice si ricontrolla qui, non si crede al carrello: può essersi spento
    fra il momento in cui è stato scritto e adesso. Se non vale più si dice e
    ci si ferma, invece di far pagare in silenzio il prezzo pieno a chi
    aspettava lo sconto.
  */
  const scritto = normalizzaCodice(String(r?.codice ?? ""));
  let codice: { codice: string; percentuale: number } | null = null;
  if (scritto) {
    let c: Ricerca;
    try {
      c = await cercaCodice(scritto);
    } catch {
      return { error: "Non riesco a controllare il codice adesso. Riprova tra un momento." };
    }
    if (c.stato !== "valido") return { error: `${motivo(c)} Toglilo per continuare.` };
    codice = { codice: c.codice, percentuale: c.percentuale };
  }

  const subtotale = voci.reduce((n, v) => n + v.prezzo * v.quantita, 0);
  const sconto = codice ? scontoCodice(voci, codice.percentuale) : 0;
  const totale = subtotale - sconto + tariffa.prezzo;
  const copie = voci.reduce((n, v) => n + v.quantita, 0);

  // Dove SumUp riporta e dove avvisa. In produzione è il dominio; in
  // sviluppo, quello da cui si sta navigando.
  const base = await origine();

  try {
    const riferimento = await apriPagamento({
      nome: dati.nome,
      email: dati.email,
      telefono: dati.telefono,
      codiceFiscale: dati.codiceFiscale || null,
      indirizzo: {
        line1: dati.indirizzo,
        line2: dati.interno || null,
        city: dati.citta,
        postal_code: dati.cap,
        state: dati.provincia || null,
        country: dati.paese,
      },
      righe: voci.map((v) => ({
        slug: v.slug,
        title: v.title,
        formato: v.formato,
        prezzo: v.prezzo,
        quantita: v.quantita,
      })),
      subtotale,
      // Il codice si scrive solo se ha tolto qualcosa: uno che non tocca
      // niente —tutte stampe già in sconto— non è stato usato.
      sconto,
      codice: codice && sconto > 0 ? codice.codice : null,
      spedizione: tariffa.prezzo,
      totale,
    });
    const checkout = await creaCheckout({
      riferimento,
      totale,
      descrizione: `${site.name} — ${copie === 1 ? "1 stampa" : `${copie} stampe`}`,
      avviso: `${base}/api/sumup/webhook`,
      rientro: `${base}/carrello/grazie?r=${riferimento}`,
    });
    await legaCheckout(riferimento, checkout.id);
    return { url: checkout.url };
  } catch (e) {
    console.error("SumUp: non ho potuto creare il pagamento", e);
    return { error: "SumUp non ha risposto. Riprova tra un momento." };
  }
}
