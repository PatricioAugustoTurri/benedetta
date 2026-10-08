import Link from "next/link";
import { richiediAccesso } from "@/lib/auth";
import { cloudinaryConfigurado } from "@/lib/cloudinary";
import { listWorks, pingDb } from "@/lib/works";
import ArchivoOrdenable from "./components/ArchivoOrdenable";
import LimpiarSueltas from "./components/LimpiarSueltas";
import NuevaObra from "./components/NuevaObra";

/**
 * L'archivio, con le mani dentro.
 *
 * È la griglia del sito —stesse tre colonne, stesso quadrato, stessa aria— e
 * non una tabella di amministrazione. La ragione è che quello da giudicare
 * quando si carica un'opera non è se l'anno è scritto bene, ma come si vede il
 * pezzo accanto agli altri; una lista di righe di testo risponde alla prima
 * domanda e nasconde la seconda.
 *
 * L'unica cosa che si aggiunge è lo strato di controllo, e vive appoggiato: i
 * pulsanti di un pezzo compaiono al passaggio del puntatore, e la prima
 * casella della griglia —vuota, con filetto tratteggiato— è dove si carica
 * un'opera nuova.
 *
 * L'ordine della griglia è quello del sito e si trascina, quindi la lista la
 * disegna `ArchivoOrdenable`, che è client. La casella di inserimento scende
 * come proprietà invece di essere importata là dentro: non ha un solo stato né
 * ascolta niente, e mandarla da qui la lascia dov'era, dal lato server.
 */
export default async function AdminPage() {
  await richiediAccesso("/admin");
  const viva = await pingDb();

  if (!viva) {
    return (
      <section className="shell py-24">
        <h1 className="display-lead font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.15] text-balance">
          Il database non risponde.
        </h1>
        <p className="prose-measure mt-5 text-ink-soft">
          Il sito ha bisogno di PostgreSQL avviato per leggere l&apos;archivio. Avvialo e
          ricarica questa pagina.
        </p>
        {/*
          Il comando esatto, perché l'errore utile è quello che dice cosa fare.
          Va in un <code> e non in un blocco: è una riga, non un esempio.
        */}
        <p className="mt-6 text-sm text-ink-faint">
          Su questa macchina:{" "}
          <code className="figures bg-paper-deep px-1.5 py-0.5 text-ink">
            brew services start postgresql@17
          </code>
        </p>
      </section>
    );
  }

  const obras = await listWorks();
  const conCloudinary = cloudinaryConfigurado();

  return (
    <section className="shell pt-8 pb-16 md:pt-12">
      {/* La griglia e le sezioni parlano da sole; il titolo serve a chi
          naviga con un lettore di schermo, per sapere in che pagina è. */}
      <h1 className="sr-only">Opere</h1>
      {/*
        Senza le chiavi di Cloudinary si può entrare, guardare e modificare i
        testi, ma non caricare un'immagine. L'avviso va qui in alto e non
        nascosto nel modulo: scoprire che manca una variabile d'ambiente solo
        dopo aver scelto tre scansioni è scoprirlo tardi.
      */}
      {!conCloudinary && (
        <p className="mb-8 nota nota--neutra">
          Mancano le chiavi di Cloudinary, quindi non si possono caricare immagini. Completa{" "}
          <code className="bg-paper px-1 py-0.5">CLOUDINARY_CLOUD_NAME</code>,{" "}
          <code className="bg-paper px-1 py-0.5">CLOUDINARY_API_KEY</code> e{" "}
          <code className="bg-paper px-1 py-0.5">CLOUDINARY_API_SECRET</code> en{" "}
          <code className="bg-paper px-1 py-0.5">.env.local</code> e riavvia il server.
        </p>
      )}
      {/*
        Due differenze dichiarate rispetto alla griglia del sito, nessuna per
        dimenticanza.

        La prima: là la griglia non disegna una sola parola e qui ogni pezzo
        porta titolo, anno, tecnica, numero di immagini e l'avviso che gli
        manca il testo. È il senso di questa schermata. Là si viene a guardare
        l'opera; qui si viene a sapere quale è quale e cosa le manca, e a
        questo non si risponde guardando.

        La seconda: là il telefono mostra due colonne e qui una. In mezzo
        schermo di telefono, una cella con quella scheda più i tre controlli
        che cadono in basso quando non c'è un puntatore resta stretta.

        Quello che invece condividono, ed è ciò che rende utile questa
        schermata, è il ritaglio e le proporzioni della cella: il pezzo si vede
        qui come si vedrà pubblicato.
      */}
      <ArchivoOrdenable obras={obras} hueco={<NuevaObra />} />

      {/*
        L'archivio vuoto non dice «non c'è niente»: dice cosa succede quando ci
        sarà qualcosa. Compare solo quando davvero non c'è opera caricata, e
        non fa concorrenza alla casella di inserimento, che è già in alto a
        sinistra.
      */}
      {obras.length === 0 && (
        <p className="prose-measure mt-10 text-sm text-ink-faint">
          L&apos;archivio è vuoto. Ogni opera che carichi compare qui, e nello stesso
          ordine e con lo stesso ritaglio, nella{" "}
          <Link href="/" className="link-underline text-ink-soft hover:text-ink">
            home del sito
          </Link>
          .
        </p>
      )}

      {conCloudinary && <LimpiarSueltas />}
    </section>
  );
}
