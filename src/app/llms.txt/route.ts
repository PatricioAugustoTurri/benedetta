import { legaliPronte } from "@/data/legale";
import { site } from "@/data/site";
import { esServizio, shopHref } from "@/data/shop";
import { listCategorieVisibili } from "@/lib/categorie";
import { descrizioneBreve } from "@/lib/seo";
import { getServizio } from "@/lib/servizi";
import { listWorks } from "@/lib/works";

/**
 * `/llms.txt`: il sito raccontato in Markdown per gli assistenti —ChatGPT,
 * Perplexity, Claude, Gemini— che rispondono a «un'illustratrice in Umbria
 * per un ritratto» leggendo il web. È la proposta di llmstxt.org: un titolo,
 * una frase che dice chi è, e poi le pagine che contano, ognuna con una riga.
 *
 * Si costruisce dal database come la sitemap, così un'opera nuova entra qui
 * senza che nessuno se ne ricordi. Si rifà al massimo una volta all'ora.
 */
export const revalidate = 3600;

export async function GET() {
  const [works, categorie] = await Promise.all([listWorks(), listCategorieVisibili()]);
  const servizi = await Promise.all(
    categorie.filter((c) => esServizio(c.slug)).map((c) => getServizio(c.slug).catch(() => null)),
  );
  const negozi = categorie.filter((c) => !esServizio(c.slug));
  const n = site.negozio;

  const riga = (titolo: string, path: string, testo?: string | null) =>
    `- [${titolo}](${site.url}${path})${testo ? `: ${descrizioneBreve(testo, 200)}` : ""}`;

  const testo = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `${site.name} è un'${site.role.toLowerCase()} freelance con base a ${n.citta}, in ${site.regione}, e lavora per clienti in tutta Italia. Ha studiato al NID di Perugia. ${site.craft} Realizza ritratti illustrati e illustrazioni personalizzate su commissione, illustrazioni editoriali, packaging ed etichette; vende online stampe, quaderni e altri oggetti con le sue illustrazioni.`,
    "",
    `- Email: ${site.email}`,
    ...site.socials.map((s) => `- ${s.label}: ${s.href}`),
    `- Negozio e ritiro ordini: ${n.indirizzo}, ${n.cap} ${n.citta} (${n.provincia}), Italia`,
    "",
    "## Su commissione",
    "",
    ...servizi.filter((s) => s !== null).map((s) => riga(s.title, `/shop/${s.slug}`, s.description)),
    riga("Contatti", "/contatti", "Il modulo per chiedere un ritratto, un'illustrazione o una collaborazione."),
    "",
    "## Opere",
    "",
    ...works.map((w) => riga(w.title, `/opera/${w.slug}`, w.description ?? `${w.tecnica}, ${w.year}.`)),
    "",
    "## Shop",
    "",
    riga("Shop", "/shop", "Tutto quello che si compra online, con spedizione in Italia e in Europa."),
    ...negozi.map((c) => riga(c.label, shopHref(c))),
    "",
    "## Informazioni",
    "",
    riga("About me", "/studio", "Chi è, come lavora e cosa fa."),
    riga("Domande frequenti", "/domande-frequenti"),
    // Le pagine legali, come nella sitemap, solo quando sono complete.
    ...(legaliPronte()
      ? [riga("Spedizioni e resi", "/spedizioni-e-resi"), riga("Condizioni di vendita", "/condizioni-di-vendita")]
      : []),
    "",
  ].join("\n");

  return new Response(testo, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
