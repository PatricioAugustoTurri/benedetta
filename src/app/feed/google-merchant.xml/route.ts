import { site } from "@/data/site";
import { prezzoScontato, prodottoHref } from "@/data/shop";
import { listPubblicati } from "@/lib/prodotti";
import { scontiInCorso } from "@/lib/sconti";
import { tariffeSpedizione } from "@/lib/stripe";
import { immagineFerma } from "@/lib/video";

/**
 * Il catalogo delle stampe per Google Merchant Center: un feed RSS con una
 * voce per ogni formato di ogni stampa pubblicata. Caricato una volta in
 * Merchant Center (Prodotti → Feed → «URL»), Google lo rilegge da solo e le
 * stampe possono comparire gratis nella scheda Shopping.
 *
 * Ogni formato è una variante della stessa stampa (`item_group_id`), con il
 * suo prezzo; la spedizione è quella del carrello, paese per paese.
 */
export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** L'immagine per Google: jpg, almeno 800px di lato, senza ritagli. */
function immagineFeed(url: string): string {
  if (url.startsWith("/")) return `${site.url}${url}`;
  return url.replace("/upload/", "/upload/c_limit,w_1600,q_auto,f_jpg/");
}

export async function GET() {
  const [stampe, sconti] = await Promise.all([
    listPubblicati("stampe").catch(() => []),
    scontiInCorso().catch(() => new Map()),
  ]);
  const tariffe = tariffeSpedizione();
  const spedizione = tariffe
    .flatMap((t) =>
      t.paesi.map(
        (paese) =>
          `<g:shipping><g:country>${paese}</g:country><g:price>${(t.prezzo / 100).toFixed(2)} EUR</g:price></g:shipping>`,
      ),
    )
    .join("");

  const voci = stampe
    .filter((p) => p.image.length > 0)
    .flatMap((p) =>
      p.formati.map((f) => {
        const altre = p.image.slice(1, 6).map((i) => `<g:additional_image_link>${esc(immagineFeed(immagineFerma(i)))}</g:additional_image_link>`);
        if (p.mockup) altre.push(`<g:additional_image_link>${esc(immagineFeed(p.mockup.url))}</g:additional_image_link>`);
        // Lo sconto in corso, con le sue date: Google mostra il prezzo barrato finché vale.
        const sconto = sconti.get(p.id);
        const saldo = sconto
          ? `<g:sale_price>${(prezzoScontato(f.prezzo, sconto.percentuale) / 100).toFixed(2)} EUR</g:sale_price>
<g:sale_price_effective_date>${sconto.dal}T00:00+01:00/${sconto.al}T23:59+01:00</g:sale_price_effective_date>`
          : "";
        return `<item>
<g:id>${esc(`${p.slug}-${f.formato}`)}</g:id>
<g:item_group_id>${esc(p.slug)}</g:item_group_id>
<title>${esc(`${p.title} — stampa ${f.formato}`)}</title>
<description>${esc(p.description ?? `Stampa dell'illustrazione «${p.title}» di ${site.name}, formato ${f.formato}, stampata su ordinazione.`)}</description>
<link>${esc(`${site.url}${prodottoHref(p)}`)}</link>
<g:image_link>${esc(immagineFeed(immagineFerma(p.image[0])))}</g:image_link>
${altre.join("\n")}
<g:price>${(f.prezzo / 100).toFixed(2)} EUR</g:price>
${saldo}
<g:availability>in_stock</g:availability>
<g:condition>new</g:condition>
<g:brand>${esc(site.name)}</g:brand>
<g:identifier_exists>no</g:identifier_exists>
<g:size>${esc(f.formato)}</g:size>
<g:google_product_category>500044</g:google_product_category>
${spedizione}
</item>`;
      }),
    );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${esc(site.name)} — Stampe</title>
<link>${esc(site.url)}</link>
<description>Stampe delle illustrazioni di ${esc(site.name)}</description>
${voci.join("\n")}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
