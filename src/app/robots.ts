import type { MetadataRoute } from "next";
import { site } from "@/data/site";

/**
 * `robots.txt`: tutto è indicizzabile tranne `/admin`, che è già `noindex`
 * nel suo `layout.tsx` ma qui si tiene anche fuori dalla scansione — è una
 * schermata di lavoro, non una pagina, e non ha senso che un crawler ci
 * perda tempo.
 *
 * Il `sitemap` qui sotto è quello che genera `src/app/sitemap.ts`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
