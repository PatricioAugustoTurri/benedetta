/**
 * Le regole del modulo di contatto, in un posto solo perché le usano due parti
 * che non si fidano l'una dell'altra: il browser, per rispondere subito
 * mentre si scrive, e il server, che deve ricontrollare tutto perché una
 * Server Action si può chiamare con un POST senza passare dal modulo.
 */

export type Campo = "nome" | "email" | "oggetto" | "messaggio";
export type DatiContatto = Record<Campo, string>;
export type ErroriContatto = Partial<Record<Campo, string>>;

/**
 * Quanto può essere lungo ogni campo. Non sono limiti di gusto: sono il tetto
 * oltre il quale un messaggio smette di essere una richiesta e diventa
 * qualcuno che usa il modulo per riempire la casella di lei. Un messaggio vero
 * di cinquemila caratteri è già una lettera lunga.
 */
export const MAX: Record<Campo, number> = {
  nome: 120,
  email: 254,
  oggetto: 200,
  messaggio: 5000,
};

export function validaContatto(dati: DatiContatto): ErroriContatto {
  const errori: ErroriContatto = {};
  const nome = dati.nome.trim();
  const email = dati.email.trim();
  const messaggio = dati.messaggio.trim();

  if (!nome) errori.nome = "Manca il tuo nome.";
  else if (nome.length > MAX.nome) errori.nome = "Questo nome è troppo lungo.";

  // Controllo minimo di proposito: quello vero lo fa la mail arrivando o non
  // arrivando. Un'espressione severa rifiuta indirizzi validi ma insoliti.
  if (!email) errori.email = "Manca la tua email.";
  else if (email.length > MAX.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errori.email = "Questa email non sembra completa.";

  if (dati.oggetto.trim().length > MAX.oggetto) errori.oggetto = "L'oggetto è troppo lungo.";

  if (!messaggio) errori.messaggio = "Raccontami qualcosa, anche in breve.";
  else if (messaggio.length > MAX.messaggio)
    errori.messaggio = `Il messaggio supera i ${MAX.messaggio} caratteri. Accorcialo un po'.`;

  return errori;
}
