import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaLegale, { Dato, type SezioneLegale } from "@/components/legale/PaginaLegale";
import { elencoCorrieri, legale, legaliPronte } from "@/data/legale";

export const metadata: Metadata = {
  title: "Privacy e cookie",
  description: "Quali dati raccoglie il sito, perché, chi li tratta e come esercitare i tuoi diritti.",
  alternates: { canonical: "/privacy" },
};

/**
 * L'informativa privacy (artt. 13–14 GDPR) e la nota sui cookie.
 *
 * Racconta quello che il sito fa davvero, punto per punto: il modulo di
 * contatto, la newsletter con il doppio opt-in, gli ordini, i servizi che
 * ricevono i dati. Se cambia uno di questi —un servizio nuovo, le statistiche
 * accese— questa pagina cambia con lui.
 */
export default function PrivacyPage() {
  // Bozza: in produzione non esiste finché mancano i dati legali (vedi `legaliPronte`).
  if (!legaliPronte() && process.env.NODE_ENV === "production") notFound();
  const sezioni: SezioneLegale[] = [
    {
      id: "titolare",
      titolo: "Chi tratta i tuoi dati",
      corpo: (
        <>
          <p>
            Il titolare del trattamento è <strong>{legale.titolare}</strong>,{" "}
            <Dato valore={legale.indirizzo} nome="indirizzo" />, email{" "}
            <a href={`mailto:${legale.email}`}>{legale.email}</a>.
          </p>
          <p>Per qualsiasi domanda sui tuoi dati, scrivi a quell&apos;indirizzo: rispondo io.</p>
        </>
      ),
    },
    {
      id: "dati",
      titolo: "Quali dati, e perché",
      corpo: (
        <>
          <p>
            <strong>Se mi scrivi dal modulo di contatto:</strong> nome, email, oggetto e messaggio. Li
            uso solo per risponderti e per l&apos;eventuale lavoro che mi chiedi (base giuridica: la
            tua richiesta, art. 6.1.b GDPR). Ti arriva anche una copia del messaggio come conferma.
          </p>
          <p>
            <strong>Se ti iscrivi alla newsletter:</strong> email e, se lo scrivi, il tuo nome, che
            uso per salutarti. Ti iscrivi solo dopo aver confermato dal link che ti mando (base
            giuridica: il tuo consenso, art. 6.1.a). Ti scrivo quando ci sono lavori nuovi o stampe
            disponibili. Puoi disiscriverti quando vuoi dal link in fondo a ogni mail. Le iscrizioni
            mai confermate si cancellano da sole dopo 30 giorni; se ti disiscrivi, conservo solo
            l&apos;indirizzo e la data, come prova che non devo più scriverti.
          </p>
          <p>
            <strong>Se compri una stampa:</strong> nome, email, telefono, indirizzo di spedizione e
            quello che hai ordinato. Il telefono lo chiede la pagina di pagamento e serve solo al
            corriere, se deve contattarti per la consegna. Servono per spedirti l&apos;ordine e tenerti aggiornato (base giuridica: il
            contratto, art. 6.1.b) e per gli obblighi fiscali e contabili (art. 6.1.c), che impongono
            di conservarli per 10 anni.
          </p>
          <p>
            <strong>I dati della carta</strong> non passano mai da questo sito: il pagamento avviene
            sulle pagine di Stripe, che li tratta in autonomia.
          </p>
          <p>
            <strong>Dati di navigazione:</strong> come ogni sito, il server registra informazioni
            tecniche (indirizzo IP, pagina richiesta, data e ora) per funzionare e per sicurezza.
            Non le uso per profilarti e si conservano per il tempo strettamente necessario.
          </p>
        </>
      ),
    },
    {
      id: "fornitori",
      titolo: "Chi altro li riceve",
      corpo: (
        <>
          <p>
            Non vendo né cedo i tuoi dati. Li ricevono solo i servizi che fanno funzionare il sito,
            come responsabili del trattamento:
          </p>
          <ul>
            <li>
              <strong>Hostinger</strong> — il server del sito e il database, in Germania.
            </li>
            <li>
              <strong>Stripe</strong> (Stripe Payments Europe, Irlanda) — i pagamenti.
            </li>
            <li>
              <strong>Resend</strong> — l&apos;invio delle email (conferme, ordini, newsletter).
            </li>
            <li>
              <strong>Cloudinary</strong> — le immagini del sito.
            </li>
            <li>
              <strong>Il corriere</strong> che porta il pacco — a seconda della spedizione{" "}
              {elencoCorrieri()} — riceve nome, indirizzo e telefono
              per consegnarti l&apos;ordine.
            </li>
          </ul>
          <p>
            Resend e Cloudinary hanno sede fuori dall&apos;Unione Europea: il trasferimento avviene con
            le garanzie previste dal GDPR (clausole contrattuali standard della Commissione europea).
          </p>
        </>
      ),
    },
    {
      id: "cookie",
      titolo: "Cookie",
      corpo: (
        <>
          <p>
            Questo sito usa <strong>solo strumenti tecnici</strong>, necessari a farlo funzionare, e
            per questo non ti chiede il consenso con un banner:
          </p>
          <ul>
            <li>il carrello, salvato nel tuo browser finché non completi l&apos;acquisto;</li>
            <li>il cookie di accesso all&apos;area riservata, che usa solo l&apos;autrice.</li>
          </ul>
          <p>
            Non ci sono cookie di profilazione né pubblicitari. Se il sito misura le visite, lo fa in
            forma anonima e aggregata, senza cookie e senza identificarti.
          </p>
          <p>
            Quando paghi, sei sulle pagine di Stripe, che usa i propri cookie per la sicurezza del
            pagamento: trovi i dettagli nella{" "}
            <a href="https://stripe.com/it/privacy" target="_blank" rel="noopener noreferrer">
              privacy di Stripe
            </a>
            .
          </p>
        </>
      ),
    },
    {
      id: "diritti",
      titolo: "I tuoi diritti",
      corpo: (
        <>
          <p>
            Puoi chiedermi in ogni momento di vedere i dati che ho su di te, correggerli,
            cancellarli, limitarne l&apos;uso, riceverli in un formato leggibile o opporti al
            trattamento; e puoi revocare il consenso alla newsletter senza conseguenze. Basta
            scrivere a <a href={`mailto:${legale.email}`}>{legale.email}</a>.
          </p>
          <p>
            Se pensi che i tuoi dati siano trattati in modo scorretto, puoi presentare reclamo al{" "}
            <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
              Garante per la protezione dei dati personali
            </a>
            .
          </p>
        </>
      ),
    },
    {
      id: "modifiche",
      titolo: "Modifiche",
      corpo: (
        <p>
          Se cambia qualcosa in come tratto i dati, aggiorno questa pagina e la data in cima.
        </p>
      ),
    },
  ];

  return (
    <PaginaLegale
      titolo="Privacy e cookie"
      intro={<p>Quali dati raccoglie questo sito, perché, e cosa puoi chiedermi in qualsiasi momento.</p>}
      sezioni={sezioni}
    />
  );
}
