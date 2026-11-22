"use client";

import { useActionState, useState } from "react";
import { site } from "@/data/site";
import { scaricaCartolina } from "@/lib/cartolinaRecensione";
import { chiediRecensioneAzione, type EsitoRichiesta } from "../ordini/actions";

const SITO = new URL(site.url).host;
const INSTAGRAM = (() => {
  const nome = site.socials.find((s) => s.label === "Instagram")?.href.match(/instagram\.com\/([^/?#]+)/)?.[1];
  return nome ? `@${nome}` : undefined;
})();

const giorno = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", timeZone: "Europe/Rome" }).format(new Date(iso));

/**
 * La riga della recensione di un ordine: il QR da stampare e mettere nel
 * pacco —c'è da quando l'ordine arriva, perché il pacco si prepara prima di
 * spedirlo— e, a ordine consegnato, quante ne ha lasciate, il link da
 * copiare —per WhatsApp o Instagram— e la mail che la chiede.
 *
 * La mail non parte da sola: la manda lei quando pensa che il pacco sia
 * arrivato. Dopo averla mandata il pulsante dice quando, e permette di
 * rimandarla: non si sa mai se la prima è finita nello spam.
 */
export default function RecensioneOrdine({
  id,
  link,
  chiesta,
  usata,
  lasciate,
  prodotti,
  correoAttivo,
  consegnato,
  nome,
}: {
  id: number;
  /** Spedito o ritirato: solo allora si chiede, si copia e si contano. */
  consegnato: boolean;
  /** Il nome di battesimo, per la cartolina. */
  nome: string | null;
  link: string;
  /** ISO, quando lei l'ha chiesta per mail. */
  chiesta: string | null;
  /** Il link è già stato usato: vale una volta sola. */
  usata: boolean;
  lasciate: number;
  /** Quanti prodotti diversi ha l'ordine. */
  prodotti: number;
  correoAttivo: boolean;
}) {
  const [esito, azione, inCorso] = useActionState<EsitoRichiesta, FormData>(chiediRecensioneAzione, {});
  const [copiato, setCopiato] = useState(false);
  const [pdf, setPdf] = useState<"fermo" | "lavora" | "errore">("fermo");

  async function qr() {
    setPdf("lavora");
    try {
      await scaricaCartolina(
        { link, ordine: id, per: nome, sito: SITO, instagram: INSTAGRAM },
        "/benedetta-zibetti-wordmark.png",
        "/biglietto-ragazza.png",
      );
      setPdf("fermo");
    } catch (e) {
      console.error(e);
      setPdf("errore");
    }
  }

  const scaricaQr = (
    <button
      type="button"
      onClick={qr}
      disabled={pdf === "lavora"}
      className="link-underline text-ink transition-colors hover:text-accent disabled:opacity-60"
    >
      {pdf === "lavora" ? "Preparo il PDF…" : "Scarica il QR per il pacco"}
    </button>
  );

  if (!consegnato) {
    return (
      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-ink-faint">
        <span>Recensione:</span>
        {scaricaQr}
        {pdf === "errore" && <span className="text-accent">Il PDF non è venuto. Riprova.</span>}
      </div>
    );
  }


  async function copia() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiato(true);
      window.setTimeout(() => setCopiato(false), 1800);
    } catch {
      window.prompt("Copia il link della recensione:", link);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-ink-faint">
      <span>
        Recensione:{" "}
        {usata ? (
          <span className="text-ink">
            lasciata{lasciate > 0 && lasciate < prodotti ? ` (${lasciate} su ${prodotti} prodotti)` : ""}
          </span>
        ) : (
          "non ancora"
        )}
      </span>
      {/* Il link vale per un invio solo: usato, non c'è più niente da mandare. */}
      {!usata && (
        <>
          {scaricaQr}
          <button type="button" onClick={copia} className="link-underline transition-colors hover:text-ink">
            {copiato ? "Link copiato" : "Copia il link"}
          </button>
          {correoAttivo && (
            <form action={azione} className="flex items-baseline gap-2">
              <input type="hidden" name="id" value={id} />
              {chiesta && <span>· chiesta per mail il {giorno(chiesta)}</span>}
              <button
                type="submit"
                disabled={inCorso}
                className="link-underline text-ink transition-colors hover:text-accent disabled:opacity-60"
              >
                {inCorso ? "Invio…" : chiesta ? "Richiedila" : "Chiedila per mail"}
              </button>
            </form>
          )}
        </>
      )}
      {pdf === "errore" && <span className="w-full text-accent">Il PDF non è venuto. Riprova.</span>}
      {esito.error && <span className="w-full text-accent">{esito.error}</span>}
      {esito.fatto && <span className="w-full text-ink">{esito.fatto}</span>}
    </div>
  );
}
