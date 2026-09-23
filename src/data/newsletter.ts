import { site } from "@/data/site";

/**
 * La newsletter.
 *
 * **Questo è un lavoro in sospeso di infrastruttura, non di contenuto.** Non
 * c'è un servizio di invio attivo —Buttondown, Mailchimp, Resend— né un
 * database dove salvare un indirizzo, e montare un campo che non salva niente
 * sarebbe promettere una lista che non esiste. Perciò, finché `endpoint` è
 * `null`, il modulo fa esattamente quello che fa già il modulo di contatto:
 * prepara una mail e la passa al programma di posta del visitatore.
 *
 * La differenza conta: l'indirizzo arriva lo stesso, nella sua casella, e lei
 * lo annota a mano. È una lista di posta gestita a mano, che è una cosa che
 * esiste davvero, invece di un'iscrizione automatica che non esiste.
 *
 * Il giorno in cui ci sarà un servizio cambia una riga:
 *
 *   export const endpoint: string | null = "https://…/subscribe";
 *
 * e `NewsletterForm` fa POST invece di aprire la mail. Quello che non cambia è
 * il testo qui sotto: quello che promette è già quello che si può mantenere.
 */
export const endpoint: string | null = null;

/**
 * Cosa si promette. Senza frequenza —"una volta al mese" è una promessa che
 * nessuno ha fatto— e senza esclusive inventate. Solo il motivo del messaggio.
 */
export const pitch = "Ti scrivo quando ci sono lavori nuovi o stampe disponibili.";

/** La mail di iscrizione, con l'indirizzo del visitatore già nel corpo. */
export function subscribeHref(email: string): string {
  const subject = "Newsletter — iscrizione";
  const body = `Vorrei iscrivermi alla newsletter.\n\n${email.trim()}`;
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
