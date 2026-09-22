import type { NextConfig } from "next";
import { MAX_CUERPO_MB } from "./src/lib/limites";

const nextConfig: NextConfig = {
  images: {
    /*
      De dónde se permite traer imágenes.

      La obra vive en Cloudinary desde que el admin sube directo allá, y
      `next/image` se niega a optimizar un dominio que no esté declarado acá.
      No es burocracia: sin la lista, cualquier URL que entrara en la base
      convertiría al optimizador del sitio en un proxy de imágenes ajenas que
      cualquiera podría usar por su cuenta.

      `pathname` acota a la cuenta de ella. El resto de Cloudinary, incluidas
      las cuentas de otros, queda afuera.
    */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${process.env.CLOUDINARY_CLOUD_NAME ?? "_sin_configurar"}/**`,
      },
    ],
  },

  experimental: {
    serverActions: {
      /*
        El tope del cuerpo de una Server Action. Ver `src/lib/limites.ts`:
        desde que las imágenes suben directo a Cloudinary, por acá sólo pasa
        un JSON con direcciones y medidas.
      */
      bodySizeLimit: `${MAX_CUERPO_MB}mb`,
    },
  },
};

export default nextConfig;
