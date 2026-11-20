"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import {
  aggiornaVendita,
  aggiungiSpesa,
  cancellaSpesa,
  cancellaVendita,
  creaVendita,
  eCanale,
  getVendita,
  leggiImporto,
  segnaVendita,
  type DaTogliere,
  type VenditaInput,
} from "@/lib/conti";
import { oggiInItalia } from "@/lib/oggi";

/*
  Ogni azione ricontrolla la sessione, come tutte quelle dell'admin: una
  Server Action si può chiamare senza passare da nessuna pagina.
*/

export type EsitoVendita = { error?: string; ok?: boolean; scritta?: string };

const eGiorno = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
const pulito = (v: FormDataEntryValue | null) => String(v ?? "").replace(/\s+/g, " ").trim();

function rivalida() {
  revalidatePath("/admin/conti", "layout");
}

/**
 * Scrive o corregge una vendita in contanti, con bonifico o con SumUp.
 *
 * «Pagata» e «consegnata» arrivano come una spunta e un giorno: senza giorno
 * vale quello della vendita, che è il caso di tutti i giorni —al mercato si
 * paga e si porta via nello stesso momento—.
 */
export async function salvaVenditaAzione(_previo: EsitoVendita, formData: FormData): Promise<EsitoVendita> {
  await requireSession();

  const idCrudo = String(formData.get("id") ?? "");
  const id = idCrudo ? Number(idCrudo) : null;
  if (id !== null && !Number.isInteger(id)) return { error: "Non ho capito quale vendita." };

  const giorno = String(formData.get("giorno") ?? "");
  const nome = pulito(formData.get("nome"));
  const email = pulito(formData.get("email")).toLowerCase();
  const telefono = pulito(formData.get("telefono"));
  const cosa = String(formData.get("cosa") ?? "").trim();
  const importo = leggiImporto(String(formData.get("importo") ?? ""));
  const canale = String(formData.get("canale") ?? "");
  const consegna = String(formData.get("consegna") ?? "");

  if (!eGiorno(giorno)) return { error: "Manca il giorno della vendita." };
  if (!nome) return { error: "Manca il nome di chi ha comprato." };
  if (nome.length > 120) return { error: "Il nome è troppo lungo." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "L’email non sembra giusta: controllala o lasciala vuota." };
  if (email.length > 200 || telefono.length > 40) return { error: "Email o telefono troppo lunghi." };
  if (!cosa) return { error: "Scrivi cosa ha comprato." };
  if (cosa.length > 500) return { error: "La descrizione è troppo lunga: al massimo 500 caratteri." };
  if (importo === null) return { error: "L’importo non si è capito: scrivilo così, 12,50." };
  if (!eCanale(canale)) return { error: "Scegli come ha pagato: contanti, bonifico o SumUp." };
  if (consegna !== "mano" && consegna !== "spedizione") return { error: "Scegli se va spedita o data a mano." };

  const quando = (spunta: string, campo: string) => {
    if (formData.get(spunta) !== "on") return null;
    const g = String(formData.get(campo) ?? "");
    return eGiorno(g) ? g : giorno;
  };

  const input: VenditaInput = {
    giorno,
    nome,
    email: email || null,
    telefono: telefono || null,
    cosa,
    importo,
    canale,
    pagatoIl: quando("pagata", "pagato_il"),
    consegna,
    consegnatoIl: quando("consegnata", "consegnato_il"),
  };

  let scritta: { id: number; numero: string };
  try {
    if (id === null) {
      const togliere = leggiMagazzino(String(formData.get("magazzino") ?? "[]"));
      if (typeof togliere === "string") return { error: togliere };
      const v = await creaVendita(input, togliere);
      scritta = { id: v.id, numero: v.numero };
      if (togliere.length > 0) revalidatePath("/admin/magazzino");
    } else {
      if (!(await aggiornaVendita(id, input))) return { error: "Questa vendita non c’è più." };
      scritta = { id, numero: "" };
    }
  } catch {
    return { error: "Il database non ha risposto. Riprova." };
  }

  rivalida();
  if (formData.get("dopo") === "altra") return { ok: true, scritta: scritta.numero };
  redirect(`/admin/conti?mese=${giorno.slice(0, 7)}#v${scritta.id}`);
}

/** Le copie da togliere, come le manda il modulo: [{ prodottoId, formato, copie }]. */
function leggiMagazzino(crudo: string): DaTogliere[] | string {
  let lista: unknown;
  try {
    lista = JSON.parse(crudo);
  } catch {
    return "Le copie da togliere dal magazzino sono arrivate male.";
  }
  if (!Array.isArray(lista)) return "Le copie da togliere dal magazzino sono arrivate male.";
  const righe: DaTogliere[] = [];
  for (const r of lista) {
    const prodottoId = Number(r?.prodottoId);
    const formato = typeof r?.formato === "string" ? r.formato : "";
    const copie = Number(r?.copie);
    // Una riga lasciata a metà non è un errore: semplicemente non toglie niente.
    if (!prodottoId || !formato) continue;
    if (!Number.isInteger(copie) || copie < 1 || copie > 999) return "Le copie da togliere vanno scritte come numero intero.";
    righe.push({ prodottoId, formato, copie });
  }
  return righe;
}

/** Il gesto veloce di una riga: «è arrivato il bonifico», «è partita», «l'ha ritirata». Vale oggi. */
export async function segnaVenditaAzione(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("id"));
  const cosa = formData.get("cosa") === "pagata" ? "pagata" : "consegnata";
  if (!Number.isInteger(id)) return;
  await segnaVendita(id, cosa, oggiInItalia());
  rivalida();
}

export async function cancellaVenditaAzione(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const v = await getVendita(id);
  await cancellaVendita(id);
  rivalida();
  if (v?.magazzino.some((s) => s.tolte > 0)) revalidatePath("/admin/magazzino");
  redirect(`/admin/conti${v ? `?mese=${v.giorno.slice(0, 7)}` : ""}`);
}

export type EsitoSpesa = { error?: string; ok?: boolean };

/** Una spesa: in cosa e quanto, e il giorno. */
export async function aggiungiSpesaAzione(_previo: EsitoSpesa, formData: FormData): Promise<EsitoSpesa> {
  await requireSession();
  const giorno = String(formData.get("giorno") ?? "");
  const descrizione = pulito(formData.get("descrizione"));
  const importo = leggiImporto(String(formData.get("importo") ?? ""));
  if (!eGiorno(giorno)) return { error: "Manca il giorno." };
  if (!descrizione) return { error: "Scrivi in cosa hai speso." };
  if (descrizione.length > 200) return { error: "La descrizione è troppo lunga: al massimo 200 caratteri." };
  if (importo === null) return { error: "L’importo non si è capito: scrivilo così, 12,50." };
  try {
    await aggiungiSpesa({ giorno, descrizione, importo });
  } catch {
    return { error: "Il database non ha risposto. Riprova." };
  }
  rivalida();
  return { ok: true };
}

export async function cancellaSpesaAzione(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await cancellaSpesa(id);
  rivalida();
}
