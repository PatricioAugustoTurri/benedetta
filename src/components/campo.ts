/*
  Il campo del sito pubblico, in un posto solo da quando i moduli sono due
  —Contatti e i dati di spedizione del carrello— e due copie della stessa
  classe finiscono per non essere più la stessa. Il disegno, gli stati e il
  perché di ognuno sono spiegati in ContactForm.tsx. L'admin ha il suo, in
  src/app/admin/components/campo.ts, uguale lettera per lettera.

  `text-base` non è una scelta tipografica: sotto i 16px, Safari su iPhone fa
  zoom quando si mette a fuoco un campo e lascia la pagina spostata.

  Lo stato di errore e quello di fuoco possono darsi insieme, e
  `aria-[invalid=true]:focus` pesa più di `focus` per specificità, non per
  ordine: un campo con errore e con il cursore dentro resta un campo con
  errore.
*/
export const LABEL = "label block text-ink-faint transition-colors";

export const CONTROL =
  "peer block w-full border-0 border-b border-line bg-transparent py-2.5 text-base text-ink transition-colors placeholder:text-ink-faint focus:border-ink aria-[invalid=true]:border-accent aria-[invalid=true]:focus:border-accent";
