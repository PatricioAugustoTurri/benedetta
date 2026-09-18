import type { Metadata } from "next";
import { Fraunces, Inter, Yellowtail } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { site } from "@/data/site";
import "./globals.css";

// Serif suave para títulos, sans neutra para el resto.
const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
});

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// La firma de la marca: pincel con grueso y fino, dibujada a mano.
// Se usa sólo en el logotipo — en ningún texto corrido.
const mark = Yellowtail({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-yellowtail",
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
    <html lang="es" className={`${display.variable} ${sans.variable} ${mark.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
        >
          Saltar al contenido
        </a>
        <Header />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
