import type { NextConfig } from "next";
import { MAX_CUERPO_MB } from "./src/lib/limites";

/*
  Le intestazioni di sicurezza di ogni risposta. Le controllano i browser, e
  anche Google e gli strumenti di audit le leggono come segnale di un sito
  tenuto bene.

  - HSTS: il browser che è passato una volta in HTTPS non prova più HTTP per
    un anno. Senza `includeSubDomains` né `preload`: un sottodominio che un
    giorno servisse solo HTTP resterebbe raggiungibile, e la lista di preload
    non si lascia in fretta.
  - Il sito non si lascia incorniciare da altri (clickjacking). Il pagamento
    non ne ha bisogno: SumUp si apre come pagina sua, non dentro la nostra.
  - `same-origin-allow-popups` e non `same-origin`: una finestra aperta da qui
    —un giorno un pagamento in popup— continua a poter rispondere.
  - Niente Content-Security-Policy completa: Cloudinary, Umami, i font e
    SumUp andrebbero elencati uno per uno, e un dominio dimenticato rompe la
    cassa in silenzio. `frame-ancestors` è l'unica parte che serve oggi.
*/
const intestazioniSicurezza = [
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  // «x-powered-by: Next.js» dice a chiunque cosa gira sotto, e non serve a nessuno.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: intestazioniSicurezza }];
  },

  images: {
    /*
      Da dove è permesso portare immagini.

      L'opera vive su Cloudinary da quando l'admin carica direttamente lì, e
      `next/image` si rifiuta di ottimizzare un dominio che non sia dichiarato
      qui. Non è burocrazia: senza la lista, qualsiasi URL che entrasse nel
      database trasformerebbe l'ottimizzatore del sito in un proxy di immagini
      altrui che chiunque potrebbe usare per conto proprio.

      `pathname` restringe all'account di lei. Il resto di Cloudinary, inclusi
      gli account di altri, resta fuori.
    */
    /*
      AVIF prima, WebP per chi non lo legge. Vale solo per le immagini di
      `public/`: quelle di Cloudinary le rimpicciolisce Cloudinary stesso
      (vedi `src/lib/caricatoreCloudinary.ts`), perché codificarle qui in
      AVIF costava più di un secondo a immagine con la cache vuota.

      `remotePatterns` resta per chi usasse ancora `next/image` direttamente
      con un indirizzo di Cloudinary: senza, l'immagine si romperebbe.
    */
    formats: ["image/avif", "image/webp"],

    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${process.env.CLOUDINARY_CLOUD_NAME ?? "_non_configurato"}/**`,
      },
    ],
  },

  experimental: {
    serverActions: {
      /*
        Il limite del corpo di una Server Action. Vedi `src/lib/limites.ts`:
        da quando le immagini salgono direttamente su Cloudinary, di qui passa
        solo un JSON con indirizzi e misure.
      */
      bodySizeLimit: `${MAX_CUERPO_MB}mb`,
    },
  },
};

export default nextConfig;
