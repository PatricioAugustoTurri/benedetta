import { Resend } from "resend";
import { site } from "@/data/site";
import type { DatiContatto } from "@/lib/contacto";
import { annuncioNovita } from "@/data/newsletter";
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
 *
 * La newsletter usa lo stesso mittente: vedi la sezione in fondo e
 * `src/lib/newsletter.ts`.
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

/* ----------------------------------------------------------- newsletter */

/*
  La newsletter e la sua conferma sono lettere di lei, non avvisi di un
  negozio: il logo scritto a mano in alto, «Ciao Giulia,», il suo messaggio in
  carattere da libro, le opere grandi una sotto l'altra, la firma e la foto di
  lei nei campi intorno a Foligno. Caprasimo, il carattere dei titoli del
  sito, arriva dove il programma di posta carica i caratteri (Apple Mail,
  iOS); altrove resta Georgia, che regge lo stesso tono.

  Il logo si serve dal dominio del sito e la foto da Cloudinary, sempre con
  indirizzi assoluti: una mail si apre giorni dopo, da qualsiasi parte, e
  deve trovarli.
*/
const DISPLAY = "'Caprasimo', Georgia, 'Times New Roman', serif";
const LOGO = `${site.url}/benedetta-zibetti-wordmark.png`;
const FOTO =
  "https://res.cloudinary.com/dvmsjdcqi/image/upload/q_auto,f_jpg,c_limit,w_1200/v1791461916/illustrando/studio/bebi-about-poster.jpg";
const INSTAGRAM = site.socials.find((s) => s.label === "Instagram")?.href;

/** «Ciao Giulia,» o, senza nome, «Ciao,». */
const saluto = (nome: string | null) => (nome ? `Ciao ${nome},` : "Ciao,");

function lettera(preheader: string, contenuto: string, disiscrivi: string | null): string {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<link href="https://fonts.googleapis.com/css2?family=Caprasimo&display=swap" rel="stylesheet">
<title>${esc(site.name)}</title>
<style>@media (max-width:620px){.px{padding-left:22px!important;padding-right:22px!important}}</style>
</head>
<body style="margin:0;padding:0;background:${C.paperDeep};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paperDeep};">
<tr><td align="center" style="padding:24px 12px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
<tr><td style="background:${C.paper};border:1px solid ${C.line};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:40px 40px 8px;"><a href="${esc(site.url)}"><img src="${esc(LOGO)}" width="150" alt="${esc(site.name)}" style="display:block;width:150px;height:auto;border:0;"></a></td></tr>
${contenuto}
</table>
</td></tr>
<tr><td class="px" style="padding:28px 40px 0;font-family:${FONT};font-size:12px;line-height:1.7;color:${C.inkFaint};text-align:center;">
${esc(site.name)} · ${esc(site.role)} · ${esc(site.location)}<br>
<a href="${esc(site.url)}" style="color:${C.inkFaint};">${esc(site.url.replace(/^https?:\/\//, ""))}</a>${INSTAGRAM ? ` · <a href="${esc(INSTAGRAM)}" style="color:${C.inkFaint};">Instagram</a>` : ""}
${disiscrivi ? `<br><br>Ricevi questa mail perché ti sei iscritta o iscritto alla newsletter sul sito.<br><a href="${esc(disiscrivi)}" style="color:${C.inkFaint};text-decoration:underline;">Non voglio più riceverla</a>` : ""}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function firma(): string {
  return `<p style="margin:22px 0 0;font-family:${DISPLAY};font-size:26px;line-height:1.2;color:${C.ink};">Benedetta</p>`;
}

function paragrafo(testo: string): string {
  return testo
    .trim()
    .split(/\n\s*\n/)
    .map(
      (p, i) =>
        `<p style="margin:${i === 0 ? 18 : 14}px 0 0;font-family:${SERIF};font-size:18px;line-height:1.65;color:${C.inkSoft};">${esc(p.trim()).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
}

/**
 * La mail che chiede di confermare l'iscrizione. Il link porta a una pagina
 * con un pulsante, e non conferma da solo: molti programmi di posta aprono i
 * link per controllarli, e un'iscrizione confermata da un antivirus non è un
 * consenso.
 */
export async function inviaConfermaIscrizione(
  email: string,
  nome: string | null,
  link: string,
): Promise<void> {
  const testo =
    "grazie per esserti iscritta o iscritto! Manca un passo: conferma che questo indirizzo è tuo, e ti scrivo quando ci sono lavori nuovi o stampe disponibili.";
  const { error } = await cliente().emails.send({
    from: desde(),
    to: email,
    replyTo: para(),
    subject: `Conferma l’iscrizione alla newsletter — ${site.name}`,
    html: lettera(
      "Manca un clic per ricevere le novità.",
      `<tr><td class="px" style="padding:36px 40px 8px;">
<p style="margin:0;font-family:${DISPLAY};font-size:28px;line-height:1.2;color:${C.ink};">${esc(saluto(nome))}</p>
${paragrafo(testo)}
</td></tr>
<tr><td class="px" style="padding:26px 40px 8px;">${pulsante(link, "Conferma l’iscrizione")}</td></tr>
<tr><td class="px" style="padding:8px 40px 40px;">
${firma()}
<p style="margin:26px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.inkFaint};">Se non sei stata o stato tu, ignora questa mail: senza conferma non riceverai niente e il tuo indirizzo verrà cancellato.</p>
</td></tr>`,
      null,
    ),
    text: [
      saluto(nome),
      "",
      testo,
      "",
      link,
      "",
      "Benedetta",
      "",
      "—",
      "Se non sei stata o stato tu, ignora questa mail: senza conferma non riceverai niente e il tuo indirizzo verrà cancellato.",
      `${site.name} · ${site.url}`,
    ].join("\n"),
  });
  if (error) throw new Error(`Resend (conferma iscrizione): ${error.message}`);
}

/** Una novità come entra nella mail: già pronta, con indirizzi assoluti. */
export type VoceNewsletter = {
  tipo: "opera" | "stampa";
  title: string;
  /** «Nuova opera · 2026» o «Stampa · da 10 €». */
  riga: string;
  url: string;
  /** L'immagine, già ferma (mai un video). */
  immagine: string | null;
};

export type ContenutoNewsletter = {
  oggetto: string;
  /** Il messaggio di lei. Senza, la mail dice in una riga cosa c'è di nuovo. */
  testo: string | null;
  voci: VoceNewsletter[];
};

/** A chi va una copia: il nome per il saluto e i due indirizzi di disiscrizione. */
export type DestinatarioNewsletter = {
  email: string;
  nome: string | null;
  disiscrivi: string;
  disiscriviSubito: string;
};

/**
 * Manda la newsletter a tutti, a pacchetti di cento (il massimo di Resend per
 * chiamata). Ognuno riceve la sua copia, con il suo nome nel saluto, il suo
 * link per disiscriversi e l'intestazione List-Unsubscribe, che Gmail e gli
 * altri mostrano come «Annulla iscrizione» accanto al mittente.
 *
 * Non si ferma al primo pacchetto fallito: restituisce quante mail sono
 * partite, e chi chiama decide cosa dire.
 */
export async function inviaNewsletter(
  c: ContenutoNewsletter,
  destinatari: DestinatarioNewsletter[],
  chiave: string,
): Promise<number> {
  const resend = cliente();
  let partite = 0;

  for (let i = 0; i < destinatari.length; i += 100) {
    const pacchetto = destinatari.slice(i, i + 100);
    const { error } = await resend.batch.send(
      pacchetto.map((d) => ({
        from: desde(),
        to: d.email,
        replyTo: para(),
        subject: unaRiga(c.oggetto),
        html: htmlNewsletter(c, d.nome, d.disiscrivi),
        text: testoNewsletter(c, d.nome, d.disiscrivi),
        headers: {
          "List-Unsubscribe": `<${d.disiscriviSubito}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      })),
      // Se la stessa chiamata si ripete, Resend non manda due volte.
      { idempotencyKey: `${chiave}-${i / 100}` },
    );
    if (error) console.error(`Newsletter: il pacchetto ${i / 100 + 1} non è partito.`, error.message);
    else partite += pacchetto.length;

    // Resend accetta poche chiamate al secondo.
    if (i + 100 < destinatari.length) await new Promise((r) => setTimeout(r, 600));
  }
  return partite;
}

/** Una copia di prova a lei, prima di mandarla a tutti. Il saluto è quello di chi non ha dato il nome. */
export async function inviaProvaNewsletter(c: ContenutoNewsletter): Promise<void> {
  const finto = `${site.url}/newsletter`;
  const { error } = await cliente().emails.send({
    from: desde(),
    to: para(),
    subject: `[Prova] ${unaRiga(c.oggetto)}`,
    html: htmlNewsletter(c, null, finto),
    text: testoNewsletter(c, null, finto),
  });
  if (error) throw new Error(`Resend (prova newsletter): ${error.message}`);
}

/** La mail come la riceve una persona, per l'anteprima dell'admin. Il link di disiscrizione non porta da nessuna parte. */
export function anteprimaNewsletter(c: ContenutoNewsletter, nome: string | null): string {
  return htmlNewsletter(c, nome, "#");
}

/** La riga che chiude: se c'è una stampa, che si può avere; se no, dove trovare il resto. */
function chiusura(c: ContenutoNewsletter): string {
  return c.voci.some((v) => v.tipo === "stampa")
    ? "Se una ti piace, la stampo e te la spedisco io, in Italia e in Europa."
    : "Le trovi sul sito, insieme al resto dell’archivio.";
}

function testoNewsletter(c: ContenutoNewsletter, nome: string | null, disiscrivi: string): string {
  return [
    saluto(nome),
    "",
    (c.testo?.trim() || annuncioNovita(c.voci)).trim(),
    "",
    ...c.voci.flatMap((v) => [`${v.title} — ${v.riga}`, v.url, ""]),
    chiusura(c),
    "",
    "Benedetta",
    "",
    "—",
    `Ricevi questa mail perché ti sei iscritta o iscritto alla newsletter su ${site.url.replace(/^https?:\/\//, "")}.`,
    `Per non riceverla più: ${disiscrivi}`,
  ].join("\n");
}

function htmlNewsletter(c: ContenutoNewsletter, nome: string | null, disiscrivi: string): string {
  const testo = c.testo?.trim() || annuncioNovita(c.voci);

  /*
    Fino a tre novità, ognuna grande, una sotto l'altra: si guardano come
    tavole. Da quattro in su la prima resta grande e le altre vanno a due a
    due, più piccole: otto tavole intere farebbero una lettera da scorrere per
    un minuto.
  */
  const grandi = c.voci.length > 3 ? c.voci.slice(0, 1) : c.voci;
  const piccole = c.voci.length > 3 ? c.voci.slice(1) : [];

  const voceGrande = (v: VoceNewsletter) => `<tr><td class="px" style="padding:0 40px 40px;">
<a href="${esc(v.url)}" style="text-decoration:none;">${
    v.immagine
      ? `<img src="${esc(v.immagine)}" width="520" alt="${esc(v.title)}" style="display:block;width:100%;max-width:520px;height:auto;border:0;background:${C.paperDeep};">`
      : ""
  }</a>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;"><tr>
<td valign="top" style="font-family:${SERIF};font-size:20px;line-height:1.3;color:${C.ink};">${esc(v.title)}<div style="margin-top:4px;font-family:${FONT};font-size:13px;color:${C.inkFaint};">${esc(v.riga)}</div></td>
<td align="right" valign="top" style="padding:4px 0 0 16px;white-space:nowrap;"><a href="${esc(v.url)}" style="font-family:${FONT};font-size:14px;color:${C.accent};text-decoration:underline;">Guarda</a></td>
</tr></table>
</td></tr>`;

  const vocePiccola = (v: VoceNewsletter | undefined, lato: "sx" | "dx") =>
    `<td width="50%" valign="top" style="padding:0 ${lato === "sx" ? "8px" : "0"} 30px ${lato === "dx" ? "8px" : "0"};">${
      v
        ? `<a href="${esc(v.url)}" style="text-decoration:none;color:${C.ink};">${
            v.immagine
              ? `<img src="${esc(v.immagine)}" width="252" alt="${esc(v.title)}" style="display:block;width:100%;max-width:252px;height:auto;border:0;background:${C.paperDeep};">`
              : ""
          }<div style="margin-top:10px;font-family:${SERIF};font-size:17px;line-height:1.3;color:${C.ink};">${esc(v.title)}</div><div style="margin-top:3px;font-family:${FONT};font-size:12px;color:${C.inkFaint};">${esc(v.riga)}</div></a>`
        : ""
    }</td>`;

  const coppie: string[] = [];
  for (let i = 0; i < piccole.length; i += 2) {
    coppie.push(`<tr>${vocePiccola(piccole[i], "sx")}${vocePiccola(piccole[i + 1], "dx")}</tr>`);
  }

  const voci =
    grandi.map(voceGrande).join("") +
    (coppie.length > 0
      ? `<tr><td class="px" style="padding:0 40px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${coppie.join("")}</table></td></tr>`
      : "");

  return lettera(
    testo.split("\n")[0],
    `<tr><td class="px" style="padding:36px 40px 8px;">
<p style="margin:0;font-family:${DISPLAY};font-size:28px;line-height:1.2;color:${C.ink};">${esc(saluto(nome))}</p>
${paragrafo(testo)}
</td></tr>
<tr><td class="px" style="padding:28px 40px 32px;"><div style="border-top:1px solid ${C.line};font-size:0;line-height:0;">&nbsp;</div></td></tr>
${voci}
<tr><td class="px" style="padding:0 40px 8px;">
${paragrafo(chiusura(c)).replace("margin:18px 0 0", "margin:0")}
${firma()}
</td></tr>
<tr><td style="padding:32px 0 0;"><img src="${esc(FOTO)}" width="600" alt="Benedetta nei campi intorno a Foligno" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>`,
    disiscrivi,
  );
}

function pulsante(href: string, testo: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${C.accent};border-radius:6px;">
<a href="${esc(href)}" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:15px;color:#ffffff;text-decoration:none;">${esc(testo)}</a>
</td></tr></table>`;
}

/* ----------------------------------------------------------- spedizione */

/** Il numero di spedizione è un link quando è un indirizzo; altrimenti si copia e si cerca sul sito del corriere. */
const eLink = (s: string) => /^https?:\/\//i.test(s);

/**
 * La mail a chi ha comprato quando lei segna l'ordine come spedito: è
 * partito, cosa c'è dentro, dove arriva e come seguirlo. Ha la forma delle
 * lettere della newsletter, perché è lei che scrive, non un magazzino.
 */
export async function avvisaSpedizione(o: Ordine): Promise<void> {
  const nome = o.nome?.split(" ")[0] ?? null;
  const tracciamento = o.tracking
    ? eLink(o.tracking)
      ? `<a href="${esc(o.tracking)}" style="color:${C.accent};text-decoration:underline;">Segui il pacco</a>`
      : `<span style="font-family:${FONT};font-size:15px;color:${C.ink};letter-spacing:.02em;">${esc(o.tracking)}</span>`
    : null;

  const voci = o.righe
    .map((r) =>
      riga(`${r.quantita} ×`, `${esc(r.title)} <span style="color:${C.inkFaint};">— ${esc(r.formato)}</span>`),
    )
    .join("");

  const { error } = await cliente().emails.send({
    from: desde(),
    to: o.email,
    replyTo: para(),
    subject: `La tua stampa è partita — ordine #${o.id}`,
    html: lettera(
      `Il tuo ordine #${o.id} è in viaggio.`,
      `<tr><td class="px" style="padding:36px 40px 8px;">
<p style="margin:0;font-family:${DISPLAY};font-size:28px;line-height:1.2;color:${C.ink};">${esc(saluto(nome))}</p>
${paragrafo(`la tua stampa è partita oggi${o.corriere ? ` con ${o.corriere}` : ""}: l’ho stampata e imballata io, e adesso è in viaggio verso di te.`)}
</td></tr>
${
  tracciamento
    ? `<tr><td class="px" style="padding:20px 40px 4px;"><div style="background:${C.paperDeep};padding:16px 18px;">
<div style="font-family:${FONT};font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${C.inkFaint};margin-bottom:6px;">Numero di spedizione${o.corriere ? ` · ${esc(o.corriere)}` : ""}</div>${tracciamento}</div></td></tr>`
    : ""
}
<tr><td class="px" style="padding:20px 40px 8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line};">${voci}</table>
</td></tr>
<tr><td class="px" style="padding:18px 40px 8px;">
<div style="font-family:${FONT};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${C.inkFaint};margin-bottom:8px;">Arriva a</div>
<div style="font-family:${FONT};font-size:15px;line-height:1.6;color:${C.ink};">${indirizzoInRighe(o).map(esc).join("<br>")}</div>
</td></tr>
<tr><td class="px" style="padding:20px 40px 40px;">
${paragrafo("Se arriva rovinata o c’è qualcosa che non va, rispondi a questa mail: ci penso io.").replace("margin:18px 0 0", "margin:0")}
${firma()}
</td></tr>`,
      null,
    ),
    text: [
      saluto(nome),
      "",
      `la tua stampa è partita oggi${o.corriere ? ` con ${o.corriere}` : ""}: l’ho stampata e imballata io, e adesso è in viaggio verso di te.`,
      "",
      ...(o.tracking ? [`Numero di spedizione${o.corriere ? ` (${o.corriere})` : ""}: ${o.tracking}`, ""] : []),
      ...o.righe.map((r) => `${r.quantita} × ${r.title} — ${r.formato}`),
      "",
      "Arriva a:",
      ...indirizzoInRighe(o),
      "",
      "Se arriva rovinata o c’è qualcosa che non va, rispondi a questa mail: ci penso io.",
      "",
      "Benedetta",
    ].join("\n"),
  });
  if (error) throw new Error(`Resend (spedizione): ${error.message}`);
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
