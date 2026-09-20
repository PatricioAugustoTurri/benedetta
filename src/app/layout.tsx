import type { Metadata } from "next";
import localFont from "next/font/local";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { site } from "@/data/site";
import "./globals.css";

/*
  Una sola familia para todo el sitio: títulos y texto. Geist es variable en
  el eje de peso, así que de un archivo de 29 KB salen las dos voces que el
  sistema necesita —texto en 400, títulos en 500— sin una segunda descarga.

  Va self-hosted con next/font/local y no desde Google: esta versión de Next
  todavía no trae Geist en su lista de next/font/google. El archivo es el
  subconjunto latino que publica Google Fonts (Geist es OFL).
*/
const geist = localFont({
  src: "../fonts/Geist-Variable.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-geist",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · ${site.author}, ${site.role}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: `${site.name} · ${site.author}, ${site.role}`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: "es_AR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Las variables de next/font van en <html> para que los tokens de @theme,
    // que se emiten en :root, puedan resolverlas.
    //
    // lang sigue en "es" a propósito: la navegación ya está en italiano pero
    // el cuerpo de texto todavía es el heredado en español. Cambiar a "it"
    // con texto en español haría que los lectores de pantalla lo pronuncien
    // mal. Pasa a "it" en el mismo commit que la traducción del contenido.
    <html lang="es" className={geist.variable}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
        >
          Saltar al contenido
        </a>
        <Header />
        {/*
          El sitio no se corre de costado. Nada acá se lee a lo ancho, así que
          un desborde horizontal nunca es contenido: es el sobrante de algo que
          se movió —una pieza entrando desde su columna, un filete de más— y
          deja la página arrastrable un par de centímetros. En el escritorio
          casi no se nota; en el teléfono se siente como un sitio flojo.

          Va acá y no en `html` ni en `body`: el overflow de esos dos se
          propaga al viewport, y ahí `clip` se ignora. Medido, no supuesto.
          `main` es un elemento común, así que corta de verdad, y cubre todo
          lo que dibuja una página sin tocar la cabecera ni las capas fijas,
          que son hermanas suyas.

          `clip` y no `hidden`: `hidden` haría de esto un contenedor de scroll
          —adiós `position: sticky` de lo que viva adentro— y `clip` corta sin
          crearlo. El par vertical queda en `visible` y la página sigue
          bajando normalmente.
        */}
        <main id="contenido" className="flex-1 overflow-x-clip">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
