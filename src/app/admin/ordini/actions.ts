"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import {
  bigliettoDi,
  correggiBiglietto,
  creaBiglietto,
  erroreCodice,
  fissaScadenza,
  normalizzaCodice,
} from "@/lib/codici";
import { avvisaPronto, avvisaSpedizione, chiediRecensione, correoConfigurado } from "@/lib/correo";
import { site } from "@/data/site";
import {
  getOrdine,
  rimettiDaSpedire,
  segnaAvvisato,
  segnaPronto,
  segnaRimborsato,
  segnaRitirato,
  segnaSpedito,
  type Ordine,
} from "@/lib/prodotti";
import {
  cancellaRecensione,
  chiaveRecensione,
  linkRecensione,
  ordiniDaChiedere,
  segnaRecensioneChiesta,
  segnaRecensioniChieste,
} from "@/lib/recensioni";
import { applicaMigrazioni } from "@/lib/migrazioni";
import { rimborsaCheckout, sumupConfigurato } from "@/lib/sumup";

export type EsitoSpedizione = { error?: string; fatto?: string };

const pulisci = (v: FormDataEntryValue | null, max: number) => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  return s.length > 0 ? s : null;
};

/**
 * Segna un ordine come spedito e, se lei lo lascia spuntato, scrive a chi ha
 * comprato con il corriere e il numero per seguire il pacco. Il corriere è
 * obbligatorio: è la prima cosa che chiede chi aspetta un pacco.
 *
 * Se la mail non parte, l'ordine resta comunque spedito —il pacco è partito
 * davvero— e il messaggio lo dice, così lei può avvisare a mano.
 */
export async function spedisciOrdine(
  _previo: EsitoSpedizione,
  formData: FormData,
): Promise<EsitoSpedizione> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Ordine non valido." };

  const corriere = pulisci(formData.get("corriere"), 80);
  if (!corriere) return { error: "Scrivi con che corriere è partito." };

  const ordine = await segnaSpedito(id, {
    corriere,
    tracking: pulisci(formData.get("tracking"), 300),
  });
  revalidatePath("/admin", "layout");
  if (!ordine) return { error: "Questo ordine era già spedito o rimborsato." };
  // Il biglietto comincia a contare da oggi: 90 giorni, se lei non ha scelto.
  await fissaScadenza(id).catch((e) => console.error("Ordini: scadenza del biglietto non fissata.", e));

  if (formData.get("avvisa") !== "on") return { fatto: "Segnato come spedito." };
  // L'esito resta scritto nell'ordine: la riga passa fra gli spediti e dice
  // lì se il cliente è stato avvisato, con il modo di riprovare.
  await avvisa(ordine);
  revalidatePath("/admin/ordini");
  return { fatto: "Segnato come spedito." };
}

/**
 * Un ordine da ritirare è pronto: lo segna e, se lei lo lascia spuntato,
 * scrive a chi ha comprato che può passare. Come per la spedizione, se la
 * mail non parte l'ordine resta pronto e la riga lo dice, con il modo di
 * riprovare.
 */
export async function prontoAzione(_previo: EsitoSpedizione, formData: FormData): Promise<EsitoSpedizione> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Ordine non valido." };
  const ordine = await segnaPronto(id);
  revalidatePath("/admin", "layout");
  if (!ordine) return { error: "Questo ordine era già pronto, ritirato o rimborsato." };
  if (formData.get("avvisa") === "on") await avvisaRitiro(ordine);
  revalidatePath("/admin/ordini");
  return { fatto: "Segnato come pronto." };
}

/**
 * Chi ha comprato è passato a prenderlo. Non scrive a nessuno: l'ha in
 * mano, con il biglietto dentro. Il biglietto comincia a contare da oggi,
 * come da una spedizione.
 */
export async function ritiratoAzione(_previo: EsitoSpedizione, formData: FormData): Promise<EsitoSpedizione> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Ordine non valido." };
  const ordine = await segnaRitirato(id);
  revalidatePath("/admin", "layout");
  if (!ordine) return { error: "Questo ordine era già ritirato o rimborsato." };
  await fissaScadenza(id).catch((e) => console.error("Ordini: scadenza del biglietto non fissata.", e));
  return { fatto: "Segnato come ritirato." };
}

/** Manda la mail «è pronto» e, se parte, lo segna nell'ordine. */
async function avvisaRitiro(ordine: Ordine): Promise<boolean> {
  if (!correoConfigurado()) return false;
  try {
    await avvisaPronto(ordine);
    await segnaAvvisato(ordine.id);
    return true;
  } catch (e) {
    console.error("Ordini: la mail «pronto da ritirare» non è partita.", e);
    return false;
  }
}

/** Manda la mail di spedizione e, se parte, lo segna nell'ordine. */
async function avvisa(ordine: Ordine): Promise<boolean> {
  if (!correoConfigurado()) return false;
  try {
    // Il codice del biglietto va anche nella mail, se vale ancora: un
    // biglietto si perde, una mail si ritrova.
    const [biglietto, chiave] = await Promise.all([
      bigliettoDi(ordine.id).catch(() => null),
      chiaveRecensione(ordine.id),
    ]);
    // E il link della recensione, per quando arriva. Senza la 020, niente.
    await avvisaSpedizione(ordine, biglietto, chiave ? linkRecensione(site.url, chiave) : null);
    await segnaAvvisato(ordine.id);
    return true;
  } catch (e) {
    console.error("Ordini: la mail di spedizione non è partita.", e);
    return false;
  }
}

/** Riprova la mail di spedizione di un ordine già spedito, o quella «è pronto» di un ritiro pronto. */
export async function riavvisaAzione(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const ordine = await getOrdine(id);
  if (!ordine) return;
  if (ordine.consegna === "ritiro") {
    if (ordine.stato === "pagato" && ordine.pronto) await avvisaRitiro(ordine);
  } else if (ordine.stato === "spedito") {
    await avvisa(ordine);
  }
  revalidatePath("/admin/ordini");
}

/** Rimette un ordine fra quelli da spedire. Non scrive a nessuno. */
export async function rimettiDaSpedireAzione(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await rimettiDaSpedire(id);
  revalidatePath("/admin", "layout");
}

export type EsitoRimborso = {
  error?: string;
  /** SumUp non ce l'ha fatta: lei può rimborsare dall'app e poi segnarlo qui. */
  soloSegna?: boolean;
};

/**
 * Restituisce i soldi di un ordine, per intero, con SumUp, e lo mette fra i
 * rimborsati. Non scrive al cliente: il rimborso gli arriva sulla carta.
 *
 * Con `modo=segna` non chiama SumUp: è per quando lei ha già rimborsato
 * dall'app —un rimborso a metà, un ordine di prova di Stripe— e qui va solo
 * scritto.
 */
export async function rimborsaOrdine(_previo: EsitoRimborso, formData: FormData): Promise<EsitoRimborso> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Ordine non valido." };
  const ordine = await getOrdine(id);
  if (!ordine) return { error: "Quest'ordine non c'è più." };
  if (ordine.stato === "rimborsato") return { error: "Quest'ordine era già rimborsato." };

  if (formData.get("modo") !== "segna") {
    if (!sumupConfigurato()) {
      return { error: "SumUp non è collegato, quindi da qui non parte nessun rimborso.", soloSegna: true };
    }
    try {
      await rimborsaCheckout(ordine.pagamento);
    } catch (e) {
      console.error(`Ordini: rimborso dell'ordine ${id} non riuscito.`, e);
      return {
        error: "SumUp non ha fatto il rimborso e non si è mosso nessun euro. Riprova, o fallo dall'app di SumUp.",
        soloSegna: true,
      };
    }
  }

  await segnaRimborsato(id);
  revalidatePath("/admin", "layout");
  return {};
}

export type EsitoBiglietto = { error?: string; fatto?: number };

/**
 * Il biglietto corretto da lei prima di spedire: un codice suo («GIULIA15»),
 * un'altra percentuale, un'altra scadenza. La scadenza vuota vuol dire «90
 * giorni dalla spedizione» finché il pacco non parte.
 */
export async function correggiBigliettoAzione(
  _previo: EsitoBiglietto,
  formData: FormData,
): Promise<EsitoBiglietto> {
  await requireSession();
  const ordine = Number(formData.get("ordine"));
  if (!Number.isInteger(ordine)) return { error: "Ordine non valido." };
  const codice = normalizzaCodice(String(formData.get("codice") ?? ""));
  const percentuale = Number(formData.get("percentuale"));
  const scade = String(formData.get("scade") ?? "").trim() || null;

  const errore = erroreCodice(codice, percentuale, scade);
  if (errore) return { error: errore };

  try {
    await correggiBiglietto(ordine, { codice, percentuale, scade });
  } catch (e) {
    if (e instanceof Error && e.message.includes("codici_codice_key")) {
      return { error: `Il codice «${codice}» c’è già. Scegline un altro.` };
    }
    console.error("Ordini: biglietto non salvato.", e);
    return { error: "Il database ha rifiutato il biglietto. Riprova." };
  }
  revalidatePath("/admin/ordini");
  revalidatePath("/admin/shop");
  return { fatto: Date.now() };
}

/** Il biglietto di un ordine: non nasce col pagamento, lo crea lei da qui quando vuole darne uno. */
export async function creaBigliettoAzione(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("ordine"));
  if (!Number.isInteger(id)) return;
  const ordine = await getOrdine(id);
  if (!ordine) return;
  await creaBiglietto(id);
  if (ordine.stato === "spedito") await fissaScadenza(id);
  revalidatePath("/admin/ordini");
}

export type EsitoRichiesta = { error?: string; fatto?: string };

/**
 * Chiede la recensione per mail a chi ha comprato. Solo per un ordine
 * consegnato —spedito o ritirato—: prima non c'è niente da raccontare.
 */
export async function chiediRecensioneAzione(_previo: EsitoRichiesta, formData: FormData): Promise<EsitoRichiesta> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Ordine non valido." };
  if (!correoConfigurado()) return { error: "La posta non è configurata: copia il link e mandalo tu." };
  const [ordine, chiave] = await Promise.all([getOrdine(id), chiaveRecensione(id)]);
  if (!ordine || !chiave) return { error: "Quest'ordine non c'è più." };
  if (ordine.stato !== "spedito") return { error: "Si chiede quando l'ordine è consegnato." };
  try {
    await chiediRecensione(ordine, linkRecensione(site.url, chiave));
    await segnaRecensioneChiesta(id);
  } catch (e) {
    console.error(`Ordini: la mail della recensione dell'ordine ${id} non è partita.`, e);
    return { error: "La mail non è partita. Riprova, o copia il link e mandalo tu." };
  }
  revalidatePath("/admin/ordini");
  return { fatto: `Mail partita a ${ordine.email}.` };
}

/** Toglie una recensione dallo Shop. Non si riscrive: è di chi l'ha lasciata. */
export async function cancellaRecensioneAzione(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await cancellaRecensione(id);
  revalidatePath("/admin/ordini");
  revalidatePath("/shop", "layout");
}

export type EsitoAttivazione = { error?: string };

/** Riprova a preparare il database per le recensioni, e dice perché se non riesce. */
export async function attivaRecensioniAzione(): Promise<EsitoAttivazione> {
  await requireSession();
  const errore = await applicaMigrazioni();
  revalidatePath("/admin/ordini");
  return errore ? { error: errore } : {};
}

export type EsitoATutti = { error?: string; inviate?: number; fallite?: number };

/**
 * Chiede la recensione a chi ha già ricevuto un ordine e non l'ha ancora
 * lasciata né ricevuto la richiesta: gli ordini arrivati prima che ci fosse
 * il QR nel pacco (cliente, 2026-11-22). Una mail per persona, una dopo
 * l'altra con una pausa —Resend accetta poche mail al secondo—, e ognuna
 * segnata appena parte: se il giro si interrompe, ripremere manda solo
 * quelle che mancano.
 */
export async function chiediATuttiAzione(): Promise<EsitoATutti> {
  await requireSession();
  if (!correoConfigurado()) return { error: "La posta non è configurata: da qui non parte nessuna mail." };
  const lista = await ordiniDaChiedere();
  let inviate = 0;
  let fallite = 0;
  for (const d of lista) {
    try {
      const [ordine, chiave] = await Promise.all([getOrdine(d.id), chiaveRecensione(d.id)]);
      if (!ordine || !chiave || ordine.stato !== "spedito") continue;
      await chiediRecensione(ordine, linkRecensione(site.url, chiave));
      await segnaRecensioniChieste([d.id, ...d.fratelli]);
      inviate++;
    } catch (e) {
      console.error(`Ordini: la richiesta di recensione dell'ordine ${d.id} non è partita.`, e);
      fallite++;
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  revalidatePath("/admin/ordini");
  return { inviate, fallite };
}
