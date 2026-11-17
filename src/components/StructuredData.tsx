import { site } from "@/data/site";
import { servicios, studioFilm } from "@/data/studio";

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
 * Tre voci. `WebSite` è quella da cui Google prende il nome del sito che
 * mostra sopra il risultato: senza, se lo inventa dal dominio o dal titolo.
 * `Person` e non "Organization": chi lavora e firma è lei. Se in futuro apre
 * partita IVA e questo diventa anche uno studio con più persone, qui è il
 * punto che si aggiorna.
 */
/** Un percorso del sito diventa assoluto; un URL che lo è già resta com'è. */
function assoluto(url: string) {
  return /^https?:\/\//.test(url) ? url : `${site.url}${url}`;
}

export default function StructuredData() {
  const indirizzo = {
    "@type": "PostalAddress",
    streetAddress: site.negozio.indirizzo,
    postalCode: site.negozio.cap,
    addressLocality: site.negozio.citta,
    addressRegion: site.negozio.provincia,
    addressCountry: "IT",
  };

  const dati = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        name: site.name,
        url: site.url,
        inLanguage: "it",
        publisher: { "@id": `${site.url}/#person` },
      },
      {
        "@type": "Person",
        "@id": `${site.url}/#person`,
        name: site.signature,
        jobTitle: site.role,
        description: site.description,
        url: site.url,
        // Una sua foto, che Google può mettere accanto al nome: è il
        // fotogramma del video di About, dove c'è lei. Il poster è già un
        // URL completo (Cloudinary): anteporgli il dominio dava un indirizzo
        // rotto, «https://benedettazibetti.comhttps://res.cloudinary…».
        image: assoluto(studioFilm.poster),
        // I mestieri di About, con i titoli dei suoi servizi.
        knowsAbout: ["Illustrazione", ...servicios.map((s) => s.title)],
        email: `mailto:${site.email}`,
        address: indirizzo,
        workLocation: { "@type": "Place", address: indirizzo },
        alumniOf: {
          "@type": "EducationalOrganization",
          name: "NID di Perugia",
          address: { "@type": "PostalAddress", addressLocality: "Perugia", addressCountry: "IT" },
        },
        sameAs: site.socials.map((social) => social.href),
      },
      /*
        Il negozio di Foligno, dove chi compra passa a ritirare. È la voce che
        lega il sito a un luogo per le ricerche locali —«illustratrice
        Foligno», «illustratrice Umbria»— e la stessa scheda che Google si
        aspetta di ritrovare, con gli stessi dati, nel profilo Google Business.
        Niente orari né telefono: non li abbiamo, e un dato inventato qui
        vale meno di nessun dato.

        L'indirizzo è quello di `site.negozio`: quando lei si sposta, si
        aggiorna lì e questa voce lo segue.
      */
      {
        "@type": "ProfessionalService",
        "@id": `${site.url}/#studio`,
        name: `${site.name} — ${site.role}`,
        description: site.description,
        url: site.url,
        image: assoluto(studioFilm.poster),
        logo: `${site.url}/benedetta-zibetti-wordmark.png`,
        email: site.email,
        founder: { "@id": `${site.url}/#person` },
        address: indirizzo,
        areaServed: [
          { "@type": "City", name: site.negozio.citta },
          { "@type": "AdministrativeArea", name: site.regione },
          { "@type": "Country", name: "Italia" },
        ],
        knowsAbout: ["Illustrazione", ...servicios.map((s) => s.title)],
        sameAs: site.socials.map((social) => social.href),
      },
    ],
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
