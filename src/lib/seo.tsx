import type { Metadata } from "next";
import { site } from "@/data/site";
import { esCloudinary } from "@/lib/caricatoreCloudinary";
import { immagineFerma } from "@/lib/video";
import type { WorkImage } from "@/lib/works";

/**
 * I pezzi di SEO che ogni pagina pubblica ripete: l'anteprima quando si
 * condivide il link, la descrizione per Google e le briciole di pane.
 *
 * Esistono qui e non pagina per pagina perché Next fonde i metadati in modo
 * superficiale: una pagina che dichiara `openGraph` sostituisce per intero
 * quello del layout. Le pagine che lo facevano perdevano `og:url`, il nome
 * del sito e la lingua, e quelle che non lo facevano ereditavano l'`og:url`
 * della home —per Facebook e WhatsApp, ogni pagina era la home—. Con
 * `openGraphPagina` ogni pagina dichiara tutto, sempre allo stesso modo.
 */

/**
 * L'anteprima di fondo, per le pagine senza un'immagine propria. È
 * `src/app/anteprima.png/route.tsx`: un indirizzo fisso, a differenza di
 * quello di `opengraph-image`, che porta un hash e non si può nominare.
 */
export const ANTEPRIMA = {
  url: "/anteprima.png",
  width: 1200,
  height: 630,
  alt: `${site.name} · ${site.role} a ${site.zona}`,
};

/**
 * Un'opera come anteprima social: 1200×630, l'opera intera al centro e i
 * lati riempiti con il suo colore dominante.
 *
 * Prima si passava l'originale di Cloudinary, che arriva a 6 MB e a misure
 * da stampa (3508×4961): WhatsApp e Facebook scartano un'anteprima così
 * pesante e il link usciva senza immagine. Ritagliare invece di riempire
 * taglierebbe un ritratto in verticale a metà faccia; `c_pad` lo lascia
 * intero. Il risultato pesa intorno ai 60 KB.
 */
export function anteprimaOpera(pezzo: Pick<WorkImage, "url" | "tipo" | "alt" | "width" | "height">) {
  const src = immagineFerma(pezzo);
  if (!esCloudinary(src)) return { url: src, width: pezzo.width, height: pezzo.height, alt: pezzo.alt };
  return {
    url: src.replace("/upload/", "/upload/c_pad,b_auto:predominant,w_1200,h_630,q_auto:good,f_jpg/"),
    width: 1200,
    height: 630,
    alt: pezzo.alt,
  };
}

/**
 * L'`openGraph` completo di una pagina. `title` e `description`, se mancano,
 * Next li prende da quelli della pagina; l'immagine, se manca, è quella di
 * fondo.
 */
export function openGraphPagina({
  path,
  title,
  description,
  immagine,
}: {
  path: string;
  title?: string;
  description?: string;
  immagine?: Pick<WorkImage, "url" | "tipo" | "alt" | "width" | "height">;
}): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    locale: "it_IT",
    siteName: site.name,
    url: path,
    ...(title && { title }),
    ...(description && { description }),
    images: [immagine ? anteprimaOpera(immagine) : ANTEPRIMA],
  };
}

/**
 * Un testo dell'admin ridotto a descrizione per Google: su una riga, e non
 * più lungo di quello che il risultato mostra (circa 155 caratteri) — oltre,
 * Google lo taglia dove capita. Si taglia alla fine di una parola, con i
 * puntini.
 */
export function descrizioneBreve(testo: string, max = 155): string {
  const piano = testo.replace(/\s+/g, " ").trim();
  if (piano.length <= max) return piano;
  const taglio = piano.slice(0, max - 1);
  const spazio = taglio.lastIndexOf(" ");
  return `${(spazio > max * 0.6 ? taglio.slice(0, spazio) : taglio).replace(/[\s,;:.—-]+$/, "")}…`;
}

/**
 * Le briciole di pane come dati strutturati (`BreadcrumbList`): Google le
 * mostra al posto dell'indirizzo sopra il risultato —«benedettazibetti.com ›
 * Shop › Stampe»— e capisce dove sta la pagina nel sito.
 */
export function briciole(passi: { nome: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: passi.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.nome,
      item: `${site.url}${p.path === "/" ? "" : p.path}`,
    })),
  };
}

/**
 * I dati strutturati, uno `<script type="application/ld+json">` per oggetto.
 * Un array in un solo script Google lo legge, ma altri lettori (validatori,
 * strumenti di audit, qualche crawler) cercano `@type` in cima allo script e
 * non lo trovano.
 */
export function JsonLd({ dati }: { dati: object | object[] }) {
  return (Array.isArray(dati) ? dati : [dati]).map((d, i) => (
    <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
  ));
}
