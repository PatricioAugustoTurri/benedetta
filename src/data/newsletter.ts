/**
 * La newsletter.
 *
 * Chi si iscrive dal piè di pagina riceve una mail per confermare, e solo
 * allora entra nella lista (vedi `src/lib/newsletter.ts`). Le opere nuove e le
 * stampe pubblicate si mettono in fila da sole in /admin/newsletter, e lei
 * manda la mail da lì quando vuole, con tutte insieme.
 */

/**
 * Cosa si promette. Senza frequenza —"una volta al mese" è una promessa che
 * nessuno ha fatto— e senza esclusive inventate. Solo il motivo del messaggio.
 */
export const pitch = "Ti scrivo quando ci sono lavori nuovi o stampe disponibili.";

const NUMERI = ["", "una", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove", "dieci"];
const numero = (n: number) => NUMERI[n] ?? String(n);

/**
 * Quello che dice la newsletter quando lei non scrive un messaggio: cosa c'è
 * di nuovo, in una frase, dopo «Ciao Giulia,». Solo fatti, nessuna promessa.
 *
 *   «ci sono quattro stampe nuove e un’opera nuova sul sito: te le lascio qui sotto.»
 */
export function annuncioNovita(voci: { tipo: "opera" | "stampa" }[]): string {
  if (voci.length === 0) return "";
  const stampe = voci.filter((v) => v.tipo === "stampa").length;
  const opere = voci.length - stampe;
  const parti = [
    stampe === 1 ? "una stampa nuova" : stampe > 1 ? `${numero(stampe)} stampe nuove` : null,
    opere === 1 ? "un’opera nuova" : opere > 1 ? `${numero(opere)} opere nuove` : null,
  ].filter(Boolean);
  return voci.length === 1
    ? `c’è ${parti[0]} sul sito: te la lascio qui sotto.`
    : `ci sono ${parti.join(" e ")} sul sito: te le lascio qui sotto.`;
}
