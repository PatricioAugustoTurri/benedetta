import { Resend } from "resend";
import { site } from "@/data/site";
import type { DatiContatto } from "@/lib/contacto";
import { prezzo } from "@/data/shop";
import type { Ordine } from "@/lib/prodotti";

/**
 * La posta che parte dal sito, via Resend.
 *
 * Due mail per ogni messaggio del modulo:
 *
 * - **A lei**, con tutto quello che serve per rispondere senza aprire il
 *   sito: chi scrive, a che indirizzo, di cosa, da quale opera arriva e
 *   quando. Il `replyTo` è quello del visitatore, quindi «Rispondi» nel suo
 *   programma di posta scrive direttamente a lui.
 * - **Al visitatore**, una conferma breve: il messaggio è arrivato e lei
 *   risponde appena può. Con una copia di quello che ha scritto, perché la
 *   conferma serva anche da ricevuta.
 *
 * **Configurazione** (vedi `.env.example`):
 *
 * - `RESEND_API_KEY` — senza questa, il modulo dice che non riesce a inviare
 *   e offre la mail diretta. Non finge di aver inviato.
 * - `CONTACTO_DESDE` — il mittente. Deve essere di un dominio verificato su
 *   Resend. Finché non c'è un dominio, vale `onboarding@resend.dev`, ma con
 *   quello Resend consegna **solo** all'indirizzo dell'account: la mail a lei
 *   arriva, la conferma al visitatore no.
 * - `CONTACTO_PARA` — dove arrivano i messaggi. Se manca, `site.email`.
 */

const DESDE_PREDEFINITO = `${site.name} <onboarding@resend.dev>`;

export function correoConfigurado(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function cliente(): Resend {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) throw new Error("RESEND_API_KEY non è configurata.");
  return new Resend(clave);
}

const desde = () => process.env.CONTACTO_DESDE || DESDE_PREDEFINITO;
const para = () => process.env.CONTACTO_PARA || site.email;

export type Contatto = DatiContatto & {
  /** L'opera da cui arriva, se il visitatore è entrato da «Chiedi info». */
  opera?: { title: string; slug: string } | null;
  ricevuto: Date;
};

/** La mail a lei. Se fallisce, il messaggio non è arrivato: l'errore sale. */
export async function inviaALei(c: Contatto): Promise<void> {
  const oggetto = c.oggetto.trim();
  const subject = unaRiga(
    oggetto ? `Nuovo messaggio: ${oggetto} — ${c.nome}` : `Nuovo messaggio da ${c.nome}`,
  );

  const { error } = await cliente().emails.send({
    from: desde(),
    to: para(),
    replyTo: `${unaRiga(c.nome)} <${c.email}>`,
    subject,
    html: htmlPerLei(c),
    text: testoPerLei(c),
  });
  if (error) throw new Error(`Resend (a lei): ${error.message}`);
}

/** La conferma al visitatore. */
export async function inviaConferma(c: Contatto): Promise<void> {
  const { error } = await cliente().emails.send({
    from: desde(),
    to: c.email,
    replyTo: para(),
    subject: `Ho ricevuto il tuo messaggio — ${site.name}`,
    html: htmlConferma(c),
    text: testoConferma(c),
  });
  if (error) throw new Error(`Resend (conferma): ${error.message}`);
}

/* ------------------------------------------------------------- contenuti */

const fecha = (d: Date) =>
  new Intl.DateTimeFormat("it-IT", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  }).format(d);

const urlOpera = (slug: string) => `${site.url}/opera/${slug}`;

function testoPerLei(c: Contatto): string {
  const righe = [
    "Nuovo messaggio dal modulo di contatto del sito.",
    "",
    `Nome:      ${c.nome}`,
    `Email:     ${c.email}`,
    `Oggetto:   ${c.oggetto.trim() || "(nessuno)"}`,
  ];
  if (c.opera) righe.push(`Opera:     ${c.opera.title} — ${urlOpera(c.opera.slug)}`);
  righe.push(`Ricevuto:  ${fecha(c.ricevuto)}`, "", "Messaggio", "---------", c.messaggio.trim(), "");
  righe.push(`Per rispondere basta usare «Rispondi»: la risposta va a ${c.email}.`);
  return righe.join("\n");
}

function testoConferma(c: Contatto): string {
  return [
    `Ciao ${c.nome},`,
    "",
    "grazie per avermi scritto. Ho ricevuto il tuo messaggio e ti risponderò appena possibile.",
    "",
    "Benedetta",
    "",
    "—",
    "Il tuo messaggio:",
    "",
    c.oggetto.trim() ? `Oggetto: ${c.oggetto.trim()}\n` : "",
    c.messaggio.trim(),
    "",
    `${site.name} · ${site.role} · ${site.location}`,
    site.url,
  ].join("\n");
}

/*
  L'HTML delle mail non è l'HTML del sito. I programmi di posta ignorano i
  fogli di stile, i caratteri caricati e metà del CSS moderno, quindi qui c'è
  quello che funziona ovunque: tabelle, stili in linea e caratteri di sistema.
  I colori sono quelli del sito —carta, inchiostro, filetto, terracotta—
  perché la mail si riconosca come della stessa casa.
*/
const C = {
  paper: "#faf7f2",
  paperDeep: "#f2ece3",
  ink: "#1c1a16",
  inkSoft: "#55504a",
  inkFaint: "#6f6861",
  line: "#e2dad0",
  accent: "#b4552f",
};
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

function cornice(preheader: string, contenuto: string): string {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(site.name)}</title>
</head>
<body style="margin:0;padding:0;background:${C.paperDeep};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paperDeep};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.paper};border:1px solid ${C.line};">
<tr><td style="padding:28px 32px 20px;border-bottom:1px solid ${C.line};">
<div style="font-family:${SERIF};font-size:20px;color:${C.ink};">${esc(site.name)}</div>
<div style="font-family:${FONT};font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${C.inkFaint};margin-top:4px;">${esc(site.role)}</div>
</td></tr>
${contenuto}
<tr><td style="padding:20px 32px;border-top:1px solid ${C.line};font-family:${FONT};font-size:12px;line-height:1.6;color:${C.inkFaint};">
${esc(site.name)} · ${esc(site.location)}<br>
<a href="${esc(site.url)}" style="color:${C.inkFaint};">${esc(site.url.replace(/^https?:\/\//, ""))}</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function riga(etichetta: string, valore: string): string {
  return `<tr>
<td valign="top" style="padding:10px 16px 10px 0;border-bottom:1px solid ${C.line};font-family:${FONT};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${C.inkFaint};white-space:nowrap;width:1%;">${etichetta}</td>
<td valign="top" style="padding:10px 0;border-bottom:1px solid ${C.line};font-family:${FONT};font-size:15px;line-height:1.5;color:${C.ink};word-break:break-word;">${valore}</td>
</tr>`;
}

function corpo(testo: string): string {
  return `<div style="font-family:${FONT};font-size:15px;line-height:1.65;color:${C.ink};white-space:pre-wrap;word-break:break-word;">${esc(testo.trim()).replace(/\n/g, "<br>")}</div>`;
}

function htmlPerLei(c: Contatto): string {
  const oggetto = c.oggetto.trim();
  const link = (href: string, testo: string) =>
    `<a href="${esc(href)}" style="color:${C.accent};text-decoration:underline;">${esc(testo)}</a>`;

  const righe = [
    riga("Nome", esc(c.nome)),
    riga("Email", link(`mailto:${c.email}`, c.email)),
    riga("Oggetto", oggetto ? esc(oggetto) : `<span style="color:${C.inkFaint};">Nessuno</span>`),
    c.opera ? riga("Opera", link(urlOpera(c.opera.slug), c.opera.title)) : "",
    riga("Ricevuto", esc(fecha(c.ricevuto))),
  ].join("");

  const rispondi = `mailto:${c.email}?subject=${encodeURIComponent(
    `Re: ${oggetto || "il tuo messaggio"}`,
  )}`;

  return cornice(
    `${c.nome} ti ha scritto dal sito${oggetto ? `: ${oggetto}` : ""}.`,
    `<tr><td style="padding:28px 32px 8px;">
<div style="font-family:${FONT};font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${C.accent};">Nuovo messaggio dal sito</div>
<h1 style="margin:10px 0 0;font-family:${SERIF};font-weight:normal;font-size:24px;line-height:1.3;color:${C.ink};">${esc(c.nome)} ti ha scritto</h1>
</td></tr>
<tr><td style="padding:16px 32px 8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line};">${righe}</table>
</td></tr>
<tr><td style="padding:24px 32px 8px;">
<div style="font-family:${FONT};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${C.inkFaint};margin-bottom:10px;">Messaggio</div>
<div style="background:${C.paperDeep};border-left:2px solid ${C.accent};padding:16px 18px;">${corpo(c.messaggio)}</div>
</td></tr>
<tr><td style="padding:24px 32px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border:1px solid ${C.accent};border-radius:6px;">
<a href="${esc(rispondi)}" style="display:inline-block;padding:11px 22px;font-family:${FONT};font-size:14px;color:${C.accent};text-decoration:none;">Rispondi a ${esc(c.nome)}</a>
</td></tr></table>
<p style="margin:14px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.inkFaint};">Oppure usa «Rispondi» nel tuo programma di posta: la risposta va direttamente a ${esc(c.email)}.</p>
</td></tr>`,
  );
}

function htmlConferma(c: Contatto): string {
  const oggetto = c.oggetto.trim();
  return cornice(
    "Ho ricevuto il tuo messaggio e ti risponderò appena possibile.",
    `<tr><td style="padding:32px 32px 8px;">
<h1 style="margin:0;font-family:${SERIF};font-weight:normal;font-size:24px;line-height:1.3;color:${C.ink};">Ciao ${esc(c.nome)},</h1>
<p style="margin:16px 0 0;font-family:${FONT};font-size:16px;line-height:1.65;color:${C.inkSoft};">grazie per avermi scritto. Ho ricevuto il tuo messaggio e ti risponderò appena possibile.</p>
<p style="margin:20px 0 0;font-family:${SERIF};font-size:18px;color:${C.ink};">Benedetta</p>
</td></tr>
<tr><td style="padding:28px 32px 32px;">
<div style="border-top:1px solid ${C.line};padding-top:20px;">
<div style="font-family:${FONT};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${C.inkFaint};margin-bottom:10px;">Il tuo messaggio</div>
${oggetto ? `<div style="font-family:${FONT};font-size:14px;color:${C.ink};margin-bottom:8px;"><strong style="font-weight:600;">${esc(oggetto)}</strong></div>` : ""}
<div style="background:${C.paperDeep};padding:16px 18px;">${corpo(c.messaggio)}</div>
</div>
</td></tr>`,
  );
}

/* --------------------------------------------------------------- ordini */

/**
 * L'avviso a lei di un ordine pagato. Porta tutto quello che serve per
 * spedire senza aprire Stripe: cosa, quante copie, a chi e dove.
 */
export async function avvisaOrdine(o: Ordine): Promise<void> {
  const { error } = await cliente().emails.send({
    from: desde(),
    to: para(),
    replyTo: o.nome ? `${unaRiga(o.nome)} <${o.email}>` : o.email,
    subject: unaRiga(`Nuovo ordine #${o.id} — ${prezzo(o.totale)}${o.nome ? ` — ${o.nome}` : ""}`),
    html: htmlOrdine(o, "lei"),
    text: testoOrdine(o, "lei"),
  });
  if (error) throw new Error(`Resend (ordine a lei): ${error.message}`);
}

/** La conferma a chi ha comprato: cosa ha pagato e dove arriverà. */
export async function confermaOrdine(o: Ordine): Promise<void> {
  const { error } = await cliente().emails.send({
    from: desde(),
    to: o.email,
    replyTo: para(),
    subject: `Il tuo ordine #${o.id} — ${site.name}`,
    html: htmlOrdine(o, "cliente"),
    text: testoOrdine(o, "cliente"),
  });
  if (error) throw new Error(`Resend (conferma ordine): ${error.message}`);
}

function indirizzoInRighe(o: Ordine): string[] {
  const a = o.indirizzo;
  return [
    o.nome ?? "",
    a.line1 ?? "",
    a.line2 ?? "",
    [a.postal_code, a.city, a.state].filter(Boolean).join(" "),
    a.country ?? "",
  ].filter((r) => r.trim().length > 0);
}

function testoOrdine(o: Ordine, per: "lei" | "cliente"): string {
  const righe = [
    per === "lei"
      ? `Nuovo ordine #${o.id}, pagato il ${fecha(o.creato)}.`
      : `Ciao${o.nome ? ` ${o.nome}` : ""},\n\ngrazie! Il tuo ordine #${o.id} è arrivato e il pagamento è andato a buon fine.`,
    "",
    ...o.righe.map(
      (r) => `${r.quantita} × ${r.title} — ${r.formato}  ${prezzo(r.prezzo * r.quantita)}`,
    ),
    "",
    `Subtotale:   ${prezzo(o.subtotale)}`,
    `Spedizione:  ${prezzo(o.spedizione)}`,
    `Totale:      ${prezzo(o.totale)}`,
    "",
    "Spedizione a:",
    ...indirizzoInRighe(o),
  ];
  if (per === "lei") righe.push("", `Email: ${o.email}`, `Stripe: ${o.stripeSessionId}`);
  else righe.push("", "Per qualsiasi domanda basta rispondere a questa mail.", "", "Benedetta");
  return righe.join("\n");
}

function htmlOrdine(o: Ordine, per: "lei" | "cliente"): string {
  const voci = o.righe
    .map((r) =>
      riga(
        `${r.quantita} ×`,
        `${esc(r.title)} <span style="color:${C.inkFaint};">— ${esc(r.formato)}</span><span style="float:right;">${esc(prezzo(r.prezzo * r.quantita))}</span>`,
      ),
    )
    .join("");
  const conti = [
    riga("Subtotale", `<span style="float:right;">${esc(prezzo(o.subtotale))}</span>`),
    riga("Spedizione", `<span style="float:right;">${esc(prezzo(o.spedizione))}</span>`),
    riga("Totale", `<strong style="float:right;font-weight:600;">${esc(prezzo(o.totale))}</strong>`),
  ].join("");

  const apertura =
    per === "lei"
      ? `<div style="font-family:${FONT};font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${C.accent};">Nuovo ordine</div>
<h1 style="margin:10px 0 0;font-family:${SERIF};font-weight:normal;font-size:24px;line-height:1.3;color:${C.ink};">Ordine #${o.id} · ${esc(prezzo(o.totale))}</h1>
<p style="margin:10px 0 0;font-family:${FONT};font-size:14px;color:${C.inkSoft};">Pagato il ${esc(fecha(o.creato))} da <a href="mailto:${esc(o.email)}" style="color:${C.accent};">${esc(o.email)}</a>.</p>`
      : `<h1 style="margin:0;font-family:${SERIF};font-weight:normal;font-size:24px;line-height:1.3;color:${C.ink};">Grazie${o.nome ? `, ${esc(o.nome)}` : ""}!</h1>
<p style="margin:16px 0 0;font-family:${FONT};font-size:16px;line-height:1.65;color:${C.inkSoft};">Il tuo ordine #${o.id} è arrivato e il pagamento è andato a buon fine.</p>`;

  return cornice(
    per === "lei" ? `Ordine #${o.id}: ${prezzo(o.totale)}` : `Il tuo ordine #${o.id} è arrivato.`,
    `<tr><td style="padding:28px 32px 8px;">${apertura}</td></tr>
<tr><td style="padding:16px 32px 8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line};">${voci}${conti}</table>
</td></tr>
<tr><td style="padding:24px 32px 32px;">
<div style="font-family:${FONT};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${C.inkFaint};margin-bottom:10px;">Spedizione a</div>
<div style="font-family:${FONT};font-size:15px;line-height:1.6;color:${C.ink};">${indirizzoInRighe(o).map(esc).join("<br>")}</div>
${per === "cliente" ? `<p style="margin:24px 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:${C.inkSoft};">Per qualsiasi domanda basta rispondere a questa mail.</p><p style="margin:16px 0 0;font-family:${SERIF};font-size:18px;color:${C.ink};">Benedetta</p>` : ""}
</td></tr>`,
  );
}

/* ------------------------------------------------------------- utilità */

/** Tutto quello che scrive il visitatore passa di qui prima di entrare nell'HTML. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Un oggetto o un nome con a capo dentro romperebbe l'intestazione della mail. */
function unaRiga(s: string): string {
  return s.replace(/[\r\n]+/g, " ").trim();
}
