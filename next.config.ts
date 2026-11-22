import type { NextConfig } from "next";
import { MAX_CUERPO_MB } from "./src/lib/limites";

const nextConfig: NextConfig = {
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
