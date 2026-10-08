import Script from "next/script";

/**
 * Le statistiche delle visite, con Umami: senza cookie, senza dati personali,
 * solo numeri aggregati (quante visite, a quali pagine, da dove si arriva).
 * Per questo non serve un banner, e la privacy lo dice.
 *
 * Si accende solo se ci sono le due variabili d'ambiente —l'indirizzo dello
 * script di Umami e l'id del sito—, e solo nel sito pubblico: le visite
 * dell'admin non sono visite.
 *
 *   NEXT_PUBLIC_UMAMI_SRC=https://statistiche.benedettazibetti.com/script.js
 *   NEXT_PUBLIC_UMAMI_ID=<id del sito in Umami>
 */
export default function Statistiche() {
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC;
  const id = process.env.NEXT_PUBLIC_UMAMI_ID;
  if (!src || !id) return null;
  return <Script src={src} data-website-id={id} data-do-not-track="true" strategy="afterInteractive" />;
}
