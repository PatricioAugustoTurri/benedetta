import { site } from "@/data/site";

/**
 * Dati strutturati (schema.org) per Google: raccontano chi è lei —non solo
 * cosa dice la pagina— in un formato che un motore di ricerca legge senza
 * dover indovinare. È quello che permette a una ricerca del suo nome di
 * mostrare in più il mestiere, la città e il link a Instagram, invece del
 * solo titolo della pagina.
 *
 * Vive in `(sitio)/layout.tsx`, quindi esce su ogni pagina pubblica e mai in
 * `/admin`, che non è una pagina su cui un crawler abbia niente da leggere.
 *
 * `@type: "Person"` e non "Organization": Illustrando è il nome del
 * portfolio, ma chi lavora e firma è lei. Se in futuro apre partita IVA e
 * questo diventa anche uno studio con più persone, qui è il punto che si
 * aggiorna.
 */
export default function StructuredData() {
  const dati = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.signature,
    jobTitle: site.role,
    description: site.description,
    url: site.url,
    email: `mailto:${site.email}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Foligno",
      addressCountry: "IT",
    },
    sameAs: site.socials.map((social) => social.href),
  };

  return (
    <script
      type="application/ld+json"
      // `JSON.stringify` su dati che vengono da `site.ts`, non da un
      // visitatore: non c'è niente qui che richieda una sanificazione.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dati) }}
    />
  );
}
