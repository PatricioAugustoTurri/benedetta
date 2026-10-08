"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import {
  correoConfigurado,
  inviaNewsletter,
  inviaProvaNewsletter,
  type ContenutoNewsletter,
} from "@/lib/correo";
import {
  apriInvio,
  cancellaIscritto,
  chiudiInvio,
  listDestinatari,
  listNovita,
  segnaAnnunciate,
} from "@/lib/newsletter";
import { vociNewsletter } from "@/lib/newsletterVoci";
import { origine } from "@/lib/origine";

export type EsitoNewsletter = { error?: string; fatto?: string };

/**
 * Un solo punto d'entrata per i tre pulsanti del modulo —inviare a tutti,
 * mandarsi una prova, togliere dalla lista— perché lavorano sulla stessa
 * scelta di voci.
 *
 * Le voci arrivano come id, ma il contenuto lo legge il server dal database:
 * titolo, immagine e link sono quelli della tabella, e una voce che non è più
 * da annunciare non entra.
 */
export async function newsletterAzione(
  _previo: EsitoNewsletter,
  formData: FormData,
): Promise<EsitoNewsletter> {
  await requireSession();

  const modo = String(formData.get("modo") ?? "");
  const ids = (k: string) =>
    formData.getAll(k).map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const scelteOpere = new Set(ids("opera"));
  const scelteStampe = new Set(ids("stampa"));

  const novita = await listNovita();
  const opere = novita.opere.filter((w) => scelteOpere.has(w.id));
  const stampe = novita.stampe.filter((p) => scelteStampe.has(p.id));
  if (opere.length + stampe.length === 0) return { error: "Scegli almeno una novità." };

  if (modo === "togli") {
    await segnaAnnunciate(
      opere.map((w) => w.id),
      stampe.map((p) => p.id),
    );
    revalidatePath("/admin/newsletter");
    const n = opere.length + stampe.length;
    return { fatto: n === 1 ? "Tolta dalla lista." : `Tolte dalla lista: ${n}.` };
  }

  const oggetto = String(formData.get("oggetto") ?? "").trim();
  const testo = String(formData.get("testo") ?? "").trim() || null;
  if (oggetto.length === 0) return { error: "Manca l’oggetto della mail." };
  if (oggetto.length > 150) return { error: "L’oggetto è troppo lungo." };
  if (testo && testo.length > 3000) return { error: "Il messaggio è troppo lungo." };

  if (!correoConfigurado()) return { error: "Manca la chiave di Resend: la posta non può partire." };

  const base = await origine();
  const voci = vociNewsletter(opere, stampe, base);
  const contenuto: ContenutoNewsletter = { oggetto, testo, voci };

  if (modo === "prova") {
    try {
      await inviaProvaNewsletter(contenuto);
    } catch (e) {
      console.error("Newsletter: la prova non è partita.", e);
      return { error: "La prova non è partita. Riprova tra poco." };
    }
    return { fatto: "Ti ho mandato una prova. Guardala e poi inviala a tutti." };
  }

  if (modo !== "invia") return { error: "Non ho capito cosa fare." };

  const destinatari = await listDestinatari();
  if (destinatari.length === 0) return { error: "Non c’è ancora nessun iscritto confermato." };

  const invio = await apriInvio({
    oggetto,
    testo,
    opere: opere.map((w) => w.id),
    stampe: stampe.map((p) => p.id),
    contenuto: voci.map(({ tipo, id, title, url }) => ({ tipo, id, title, url })),
    destinatari: destinatari.length,
  });
  if (!invio) return { error: "Queste novità sono già state inviate." };

  let consegnati = 0;
  try {
    consegnati = await inviaNewsletter(
      contenuto,
      destinatari.map((d) => ({
        email: d.email,
        nome: d.nome,
        disiscrivi: `${base}/newsletter/disiscriviti/${d.token}`,
        disiscriviSubito: `${base}/api/newsletter/disiscriviti/${d.token}`,
      })),
      `newsletter-${invio.id}`,
    );
  } catch (e) {
    console.error("Newsletter: invio fallito.", e);
  }
  await chiudiInvio(invio, consegnati, {
    opere: opere.map((w) => w.id),
    stampe: stampe.map((p) => p.id),
  });
  revalidatePath("/admin", "layout");

  if (consegnati === 0) {
    return { error: "La newsletter non è partita. Le novità restano in lista: riprova tra poco." };
  }
  if (consegnati < destinatari.length) {
    return {
      fatto: `Partita a ${consegnati} iscritti su ${destinatari.length}. Gli altri non l’hanno ricevuta: Resend ha rifiutato un pacchetto.`,
    };
  }
  return { fatto: consegnati === 1 ? "Partita a 1 iscritto." : `Partita a ${consegnati} iscritti.` };
}

/** Toglie una persona dalla lista, del tutto. */
export async function cancellaIscrittoAzione(formData: FormData): Promise<void> {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await cancellaIscritto(id);
  revalidatePath("/admin/newsletter");
}
