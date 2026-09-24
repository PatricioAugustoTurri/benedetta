/**
 * Il disegno dell'unica azione del sito: un filetto terracotta da 1px su
 * quattro lati, raggio di 6px, parola e busta in terracotta su carta, e il
 * pieno solo sotto il puntatore. L'anello di fuoco è d'inchiostro e non
 * d'accento: tre pixel fuori da un bordo terracotta, un anello terracotta si
 * leggerebbe come un alone del bordo stesso.
 *
 * Vive in un posto solo perché lo portano le due estremità dello stesso
 * percorso —«Chiedi info» sull'opera, che porta al modulo, e «Invia» nel
 * modulo, che apre la mail— e due copie della stessa stringa finiscono per
 * separarsi al primo ritocco.
 */
export const AZIONE =
  "inline-flex cursor-pointer items-center gap-2.5 rounded-md border border-accent px-5 py-2.5 text-sm text-accent transition-colors duration-300 hover:bg-accent hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ink";
