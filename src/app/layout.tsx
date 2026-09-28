import type { Metadata } from "next";
import { Caprasimo } from "next/font/google";
import localFont from "next/font/local";
import { site } from "@/data/site";
import "./globals.css";

/*
  La famiglia del corpo del testo e di quasi tutto il resto. Geist è variabile
  sull'asse del peso, così da un file di 29 KB escono le due voci che servono
  al sistema —testo a 400, titoli a 500— senza un secondo download.

  Va self-hosted con next/font/local e non da Google: questa versione di Next
  non porta ancora Geist nella lista di next/font/google. Il file è il
  sottoinsieme latino che pubblica Google Fonts (Geist è OFL).
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
  La voce dei titoli, e l'unica seconda famiglia del sito.

  Caprasimo ha un solo peso, il 400, e questo decide come si usa: i titoli non
  possono portare il 500 che il resto del sistema usa per separare un titolo
  dal suo testo, perché chiedere il 500 a una famiglia che non ce l'ha fa sì
  che il browser se lo inventi ingrossando i tratti. Qui la separazione la fa
  già la famiglia: accanto a Geist, questo carattere non ha bisogno del peso
  per distinguersi.

  Viene da Google e non self-hosted come Geist perché next/font/google ce l'ha
  in lista: la scarica in fase di build, la serve da questo dominio e prepara
  il fallback con le metriche corrette. Geist è dovuta andare a mano proprio
  perché non è in quella lista.
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
    default: `${site.name} · ${site.role}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.signature, url: site.url }],
  creator: site.signature,
  openGraph: {
    title: `${site.name} · ${site.role}`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: "it_IT",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Le variabili di next/font vanno su <html> perché i token di @theme, che
    // vengono emessi su :root, possano risolverle.
    //
    // lang è "it" perché tutto il sito —navigazione e corpo del testo— è in
    // italiano. Le uniche etichette in inglese sono "Works" e "About me" del
    // menu, volute dalla cliente; sono due parole e non giustificano un
    // attributo lang a parte.
    //
    // Qui sotto non c'è né header né footer: li ha `(sitio)/layout.tsx`.
    // L'admin è l'altra metà dell'albero e non li vuole, e un header che si
    // disegna sempre e a volte si copre è peggio di due layout fratelli.
    <html lang="it" className={`${geist.variable} ${caprasimo.variable}`}>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
