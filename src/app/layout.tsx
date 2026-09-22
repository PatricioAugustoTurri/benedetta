import type { Metadata } from "next";
import { Caprasimo } from "next/font/google";
import localFont from "next/font/local";
import { site } from "@/data/site";
import "./globals.css";

/*
  La familia del cuerpo y de casi todo lo demás. Geist es variable en
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

/*
  La voz de los títulos, y la única segunda familia del sitio.

  Caprasimo trae un solo peso, el 400, y eso decide cómo se usa: los títulos
  no pueden llevar el 500 que el resto del sistema usa para separar un titular
  de su texto, porque pedirle 500 a una familia que no lo tiene hace que el
  navegador lo invente engrosando los trazos. Acá la separación ya la hace la
  familia: al lado de Geist, esta cara no necesita peso para distinguirse.

  Viene de Google y no self-hosted como Geist porque next/font/google la trae
  en su lista: la descarga en el build, la sirve desde este dominio y arma el
  fallback con las métricas ajustadas. Geist tuvo que ir a mano justamente
  porque no está en esa lista.
*/
const caprasimo = Caprasimo({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-caprasimo",
  fallback: ["Georgia", "Times New Roman", "serif"],
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
    //
    // Acá abajo no hay ni cabecera ni pie: los tiene `(sitio)/layout.tsx`.
    // El admin es la otra mitad del árbol y no los quiere, y una cabecera que
    // se dibuja siempre y se tapa a veces es peor que dos layouts hermanos.
    <html lang="es" className={`${geist.variable} ${caprasimo.variable}`}>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
