import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import PaginaLegale, { Dato, type SezioneLegale } from "@/components/legale/PaginaLegale";
import { elencoCorrieri, legale, legaliPronte } from "@/data/legale";
import { prezzo } from "@/data/shop";
import { tariffeSpedizione } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Condizioni di vendita",
  description: "Chi vende, prezzi, spedizioni, diritto di recesso e garanzia delle stampe.",
  alternates: { canonical: "/condizioni-di-vendita" },
};

/**
 * Le condizioni di vendita delle stampe, per chi compra come consumatore
 * (Codice del Consumo, D.Lgs. 206/2005).
 *
 * Valgono solo per le stampe, che si comprano dal carrello. Ritratti e
 * illustrazioni personalizzate si concordano scrivendosi, e hanno le loro
 * condizioni caso per caso.
 *
 * Le spese di spedizione escono da `tariffeSpedizione`, le stesse che
 * calcola il carrello: se cambiano lì, cambiano qui.
 */
export default function CondizioniPage() {
  // Bozza: in produzione non esiste finché mancano i dati legali (vedi `legaliPronte`).
  if (!legaliPronte() && process.env.NODE_ENV === "production") notFound();
  const tariffe = tariffeSpedizione();

  const sezioni: SezioneLegale[] = [
    {
      id: "venditore",
      titolo: "Chi vende",
      corpo: (
        <p>
          Le stampe sono vendute da <strong>{legale.titolare}</strong>,{" "}
          <Dato valore={legale.indirizzo} nome="indirizzo" />, partita IVA{" "}
          <Dato valore={legale.partitaIva} nome="partita IVA" />, email{" "}
          <a href={`mailto:${legale.email}`}>{legale.email}</a>.
        </p>
      ),
    },
    {
      id: "prodotti",
      titolo: "Le stampe",
      corpo: (
        <>
          <p>
            Sono riproduzioni delle illustrazioni di {legale.titolare}, stampate su ordinazione
            nel formato che scegli. Carta, misure e dettagli sono nella pagina{" "}
            <Link href="/spedizioni-e-resi#stampe">Spedizioni e resi</Link>.
          </p>
          <p>
            Le foto sono il più fedeli possibile, ma i colori possono cambiare leggermente da uno
            schermo all&apos;altro. Le stampe nelle foto ambientate servono a dare l&apos;idea della
            misura: il prezzo è quello della sola stampa, e la cornice{" "}
            <Dato valore={legale.cornice} nome="cornice" />.
          </p>
          <p>
            Comprare una stampa non trasferisce i diritti sull&apos;immagine, che restano
            dell&apos;autrice: la stampa è per uso personale.
          </p>
        </>
      ),
    },
    {
      id: "prezzi",
      titolo: "Prezzi e pagamento",
      corpo: (
        <>
          <p>
            I prezzi sono in euro. <Dato valore={legale.regimeIva} nome="regime IVA" />.
          </p>
          <p>
            Le spese di spedizione si aggiungono una volta per ordine, qualunque sia il numero di
            stampe, e le vedi prima di pagare:
          </p>
          <ul>
            {tariffe.map((t) => (
              <li key={t.zona}>
                {t.etichetta}: <strong>{prezzo(t.prezzo)}</strong>
              </li>
            ))}
          </ul>
          <p>
            Paghi con carta o con gli altri metodi proposti da Stripe, sulle sue pagine protette. Il
            contratto si conclude quando il pagamento va a buon fine: ti arriva subito una mail con
            il riepilogo dell&apos;ordine.
          </p>
        </>
      ),
    },
    {
      id: "spedizione",
      titolo: "Produzione e spedizione",
      corpo: (
        <>
          <p>
            Ogni stampa si prepara dopo l&apos;ordine e parte entro{" "}
            <Dato valore={legale.tempiProduzione} nome="tempi di produzione" /> dal pagamento.
            Spedisco in Italia
            e nei paesi dell&apos;Unione Europea con il corriere più adatto al pacco (
            {elencoCorrieri()}): la consegna richiede in genere{" "}
            <Dato valore={legale.tempiConsegna.italia} nome="tempi Italia" /> in Italia e{" "}
            <Dato valore={legale.tempiConsegna.ue} nome="tempi UE" /> nel resto dell&apos;Unione.
          </p>
          <p>Quando l&apos;ordine parte, ti scrivo con il numero per seguire il pacco.</p>
        </>
      ),
    },
    {
      id: "recesso",
      titolo: "Diritto di recesso",
      corpo: (
        <>
          <p>
            Se cambi idea, hai <strong>14 giorni</strong> dal giorno in cui ricevi la stampa per
            recedere dall&apos;acquisto, senza dover dare spiegazioni.
          </p>
          <ul>
            <li>
              Scrivimi a <a href={`mailto:${legale.email}`}>{legale.email}</a> che vuoi recedere, o
              usa il modulo qui sotto.
            </li>
            <li>
              Rispediscimi la stampa integra, nel suo imballaggio, entro 14 giorni dalla tua
              comunicazione, a: <Dato valore={legale.indirizzo} nome="indirizzo" />. Le spese per
              rispedirla sono a tuo carico.
            </li>
            <li>
              Ti rimborso entro 14 giorni dalla tua comunicazione tutto quello che hai pagato,
              spedizione compresa, con lo stesso metodo di pagamento. Posso aspettare a rimborsarti
              finché la stampa non torna o finché non mi mandi la prova di averla spedita.
            </li>
          </ul>
          <p>
            <strong>Modulo di recesso</strong> (puoi copiarlo in una mail):
          </p>
          <blockquote className="border-l border-line pl-4 text-ink-soft">
            Destinatario: {legale.titolare}, <Dato valore={legale.indirizzo} nome="indirizzo" />,{" "}
            {legale.email}. — Con la presente notifico il recesso dal contratto di vendita dei
            seguenti beni: … — Ordinato il … / ricevuto il … — Nome: … — Indirizzo: … — Data: …
          </blockquote>
        </>
      ),
    },
    {
      id: "garanzia",
      titolo: "Garanzia e stampe danneggiate",
      corpo: (
        <>
          <p>
            Le stampe hanno la garanzia legale di conformità di due anni dalla consegna (artt.
            128 e seguenti del Codice del Consumo): se una stampa ha un difetto, la ristampo o ti
            rimborso.
          </p>
          <p>
            Se arriva rovinata dal viaggio, scrivimi appena possibile con una foto della stampa e
            dell&apos;imballaggio: te ne mando un&apos;altra, senza spese.
          </p>
        </>
      ),
    },
    {
      id: "su-misura",
      titolo: "Ritratti e illustrazioni su commissione",
      corpo: (
        <p>
          Ritratti Illustrati e Illustrazioni Personalizzate non si comprano dal carrello: sono
          lavori fatti per te, e prezzo e condizioni li concordiamo scrivendoci, prima di
          cominciare. Di solito richiedono {legale.tempiSuMisura} di lavoro, a cui si aggiunge la
          spedizione. Essendo personalizzati, per questi lavori non vale il diritto di recesso (art.
          59, lettera c, del Codice del Consumo).
        </p>
      ),
    },
    {
      id: "legge",
      titolo: "Legge applicabile",
      corpo: (
        <p>
          Queste condizioni seguono la legge italiana. Se compri come consumatore, per qualsiasi
          controversia è competente il giudice del luogo in cui risiedi, e restano validi i diritti
          che ti dà la legge del tuo paese.
        </p>
      ),
    },
  ];

  return (
    <PaginaLegale
      titolo="Condizioni di vendita"
      intro={
        <p>
          Le regole per comprare le stampe dal sito, scritte nel modo più semplice possibile. Se
          qualcosa non è chiaro, <Link href="/contatti">scrivimi</Link>.
        </p>
      }
      sezioni={sezioni}
    />
  );
}
