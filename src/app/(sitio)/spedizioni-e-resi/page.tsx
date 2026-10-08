import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import PaginaLegale, { Dato, type SezioneLegale } from "@/components/legale/PaginaLegale";
import { elencoCorrieri, legale, misuraFormato, legaliPronte } from "@/data/legale";
import { FORMATI_BASE, prezzo } from "@/data/shop";
import { listPubblicati } from "@/lib/prodotti";
import { tariffeSpedizione } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Spedizioni e resi",
  description: "Come sono fatte le stampe, quando partono, quanto costa spedirle e cosa fare se cambi idea.",
  alternates: { canonical: "/spedizioni-e-resi" },
};

// I formati escono da quelli in vendita, che lei cambia dall'admin.
export const dynamic = "force-dynamic";

/**
 * Le domande di chi sta per comprare, con le risposte: com'è fatta la stampa,
 * quanto è grande, quando parte, quanto costa la spedizione, cosa succede se
 * arriva rovinata o se si cambia idea. Le regole precise stanno nelle
 * condizioni di vendita; qui si dicono a parole.
 *
 * I formati sono quelli davvero in vendita, letti dalle stampe pubblicate,
 * con la misura in centimetri accanto al nome della carta.
 */
export default async function SpedizioniPage() {
  // Bozza: in produzione non esiste finché mancano i dati legali (vedi `legaliPronte`).
  if (!legaliPronte() && process.env.NODE_ENV === "production") notFound();
  const tariffe = tariffeSpedizione();
  const stampe = await listPubblicati("stampe").catch(() => []);

  // I formati in vendita, nell'ordine del listino di base e poi gli altri.
  const nomi = [...new Set(stampe.flatMap((p) => p.formati.map((f) => f.formato)))];
  const ordine = (n: string) => {
    const i = FORMATI_BASE.findIndex((f) => f.formato === n);
    return i === -1 ? 99 : i;
  };
  const formati = nomi.sort((a, b) => ordine(a) - ordine(b));

  const sezioni: SezioneLegale[] = [
    {
      id: "stampe",
      titolo: "Come sono le stampe",
      corpo: (
        <>
          <p>
            Le illustrazioni nascono <Dato valore={legale.tecnica} nome="tecnica" />, e ogni
            stampa si stampa dopo il tuo ordine su <Dato valore={legale.carta} nome="carta" />. Il
            prezzo è quello della sola stampa; la cornice{" "}
            <Dato valore={legale.cornice} nome="cornice" />.
          </p>
          {formati.length > 0 && (
            <>
              <p>I formati, con le misure del foglio:</p>
              <table className="w-full max-w-sm border-t border-line text-sm">
                <tbody>
                  {formati.map((f) => (
                    <tr key={f} className="border-b border-line">
                      <th scope="row" className="py-2 pr-6 text-left font-normal text-ink">
                        {f}
                      </th>
                      <td className="figures py-2 text-ink-soft">
                        {/* «20×20 cm» porta già la misura nel nome. */}
                        {misuraFormato(f) ?? (/\d\s*[×x]\s*\d/i.test(f) ? f.replace(/\s*[×x]\s*/i, " × ") : "—")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-sm">
                Non tutte le stampe esistono in tutti i formati: quelli disponibili sono nella pagina
                di ogni stampa, con il prezzo.
              </p>
            </>
          )}
        </>
      ),
    },
    {
      id: "quando",
      titolo: "Quando parte",
      corpo: (
        <p>
          Una stampa la preparo e la spedisco entro{" "}
          <Dato valore={legale.tempiProduzione} nome="tempi di produzione" /> dall&apos;ordine. Un
          ritratto o un&apos;illustrazione personalizzata richiede invece {legale.tempiSuMisura}{" "}
          di lavoro. Quando parte ti scrivo, con il numero per seguire il pacco.
        </p>
      ),
    },
    {
      id: "costi",
      titolo: "Dove spedisco e quanto costa",
      corpo: (
        <>
          <p>
            Spedisco con il corriere più adatto al pacco ({elencoCorrieri()}), una volta per
            ordine, anche se compri più stampe:
          </p>
          <ul>
            {tariffe.map((t) => (
              <li key={t.zona}>
                <strong>{t.etichetta}</strong>: {prezzo(t.prezzo)} · consegna in{" "}
                <Dato
                  valore={t.zona === "italia" ? legale.tempiConsegna.italia : legale.tempiConsegna.ue}
                  nome="tempi"
                />
              </li>
            ))}
          </ul>
          <p>Per ora non spedisco fuori dall&apos;Unione Europea. Se sei altrove, scrivimi e vediamo.</p>
        </>
      ),
    },
    {
      id: "imballaggio",
      titolo: "Come arriva",
      corpo: (
        <p>
          La stampa viaggia <Dato valore={legale.imballaggio} nome="imballaggio" />.
        </p>
      ),
    },
    {
      id: "danni",
      titolo: "Se arriva rovinata",
      corpo: (
        <p>
          Scrivimi appena possibile a <a href={`mailto:${legale.email}`}>{legale.email}</a> con una
          foto della stampa e dell&apos;imballaggio: te ne mando un&apos;altra, senza spese.
        </p>
      ),
    },
    {
      id: "resi",
      titolo: "Se cambi idea",
      corpo: (
        <p>
          Hai 14 giorni dalla consegna per restituirla, senza spiegazioni: me la rispedisci integra e
          ti rimborso tutto, spedizione compresa. Come fare, passo per passo, è nelle{" "}
          <Link href="/condizioni-di-vendita#recesso">condizioni di vendita</Link>.
        </p>
      ),
    },
    {
      id: "su-misura",
      titolo: "Ritratti e illustrazioni personalizzate",
      corpo: (
        <p>
          Non passano dal carrello: formato, prezzo e spedizione li decidiamo insieme scrivendoci.
          Il lavoro richiede di solito {legale.tempiSuMisura}; se è un regalo, scrivimi con un
          po&apos; di anticipo.
          Guarda come funzionano i{" "}
          <Link href="/shop/ritratti-illustrati">Ritratti Illustrati</Link> e le{" "}
          <Link href="/shop/illustrazioni-personalizzate">Illustrazioni Personalizzate</Link>.
        </p>
      ),
    },
  ];

  return (
    <PaginaLegale
      titolo="Spedizioni e resi"
      intro={<p>Tutto quello che succede tra il tuo ordine e la stampa appesa al muro.</p>}
      sezioni={sezioni}
    />
  );
}
