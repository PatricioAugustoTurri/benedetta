import type { ReactNode } from "react";
import { prezzo } from "@/data/shop";
import { richiediAccesso } from "@/lib/auth";
import { bigliettiPerOrdine, type Codice } from "@/lib/codici";
import { oggiInItalia } from "@/lib/oggi";
import { listOrdini, ultimoCorriere, type Ordine } from "@/lib/prodotti";
import { nomePaese } from "@/lib/spedizione";
import { sumupConfigurato, sumupInProva } from "@/lib/sumup";
import { pingDb } from "@/lib/works";
import BigliettoOrdine from "../components/BigliettoOrdine";
import RimborsaOrdine from "../components/RimborsaOrdine";
import Sezione from "../components/Sezione";
import SpedisciOrdine from "../components/SpedisciOrdine";
import { riavvisaAzione, rimettiDaSpedireAzione } from "./actions";

export const metadata = { title: "Ordini" };

const data = (d: Date) =>
  new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  }).format(d);

/**
 * Gli ordini pagati, dal più recente. Ognuno porta tutto quello che serve
 * per spedirlo —cosa, quante copie, a chi, dove— senza aprire SumUp, e due
 * gesti: segnarlo come spedito e, se qualcuno ci ripensa, rimborsarlo.
 * Tutti e due chiedono un secondo sì prima di partire.
 *
 * Quelli da spedire vanno sopra e con il punto terracotta, perché sono
 * quelli che chiedono qualcosa; gli spediti scendono e si spengono, e i
 * rimborsati vanno in fondo, fuori dai conti di tutti i giorni.
 */
export default async function OrdiniPage() {
  await richiediAccesso("/admin/ordini");
  if (!(await pingDb())) {
    return (
      <section className="shell py-24">
        <h1 className="display-lead font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.15]">
          Il database non risponde.
        </h1>
      </section>
    );
  }

  const [ordini, corriere, biglietti] = await Promise.all([
    listOrdini(),
    ultimoCorriere(),
    bigliettiPerOrdine(),
  ]);
  const oggi = oggiInItalia();
  const daSpedire = ordini.filter((o) => o.stato === "pagato");
  const spediti = ordini.filter((o) => o.stato === "spedito");
  const rimborsati = ordini.filter((o) => o.stato === "rimborsato");
  const sumupAttivo = sumupConfigurato();

  const statoSumup = !sumupAttivo ? "spento" : sumupInProva() ? "prova" : "attivo";
  const gruppo = { corriere: null, biglietti, oggi, sumupAttivo };

  return (
    <section className="shell pt-8 pb-24 md:pt-12">
      {/* Le sezioni parlano da sole; il titolo serve a chi naviga con un
          lettore di schermo, per sapere in che pagina è. */}
      <h1 className="sr-only">Ordini</h1>
      {/*
        Prima stava solo nella colonna di destra, che era in alto. Con le
        sezioni il pagamento scende in fondo, e un SumUp spento o in prova è
        di quelle cose da sapere prima di guardare un ordine, non dopo.
      */}
      {statoSumup !== "attivo" && (
        <p className={`mb-8 nota ${statoSumup === "prova" ? "nota--neutra" : ""}`}>
          {statoSumup === "spento"
            ? "SumUp non è ancora collegato: il carrello funziona, ma il pagamento non parte."
            : "SumUp è in modalità di prova: gli ordini sono finti e non si muove denaro."}
        </p>
      )}

      <div className="space-y-20 md:space-y-28">
        <Gruppo
          id="ord-da-spedire"
          titolo="Da spedire"
          ordini={daSpedire}
          vuoto={
            ordini.length === 0
              ? "Non è ancora arrivato nessun ordine. Quando qualcuno paga una stampa, compare qui e ti arriva una mail."
              : "Niente da spedire."
          }
          testo={
            <>
              <p>Ogni ordine porta cosa, quante copie, a chi e dove, senza aprire SumUp.</p>
              <p>
                Il corriere è obbligatorio, il numero per seguirlo no. Prima di segnarlo come
                spedito ti rilegge tutto e aspetta un secondo sì.
              </p>
            </>
          }
          {...gruppo}
          corriere={corriere}
        />
        {spediti.length > 0 && (
          <Gruppo
            id="ord-spediti"
            titolo="Spediti"
            ordini={spediti}
            testo={<p>Se uno è partito per sbaglio, torna fra quelli da spedire.</p>}
            {...gruppo}
          />
        )}
        {rimborsati.length > 0 && (
          <Gruppo
            id="ord-rimborsati"
            titolo="Rimborsati"
            ordini={rimborsati}
            testo={<p>Restano qui per i conti, fuori da quelli di tutti i giorni.</p>}
            {...gruppo}
          />
        )}

        <Sezione
          id="ord-pagamenti"
          titolo="Pagamenti"
          accanto={statoSumup === "spento" ? "SumUp non collegato" : statoSumup === "prova" ? "SumUp in prova" : "SumUp attivo"}
          testo={
            <p>
              {statoSumup === "spento"
                ? "Senza SumUp il carrello funziona, ma il pagamento non parte."
                : statoSumup === "prova"
                  ? "In prova gli ordini sono finti e non si muove denaro, nemmeno con un rimborso."
                  : "Un rimborso intero parte da qui, dall'ordine; uno a metà si fa dall'app di SumUp, dove ogni ordine si ritrova con il suo codice di transazione."}
            </p>
          }
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-y border-line py-4 lg:-mt-4 lg:border-t-0">
            <p className="text-sm text-ink-soft">
              Tutti gli ordini in un foglio di calcolo, da mandare a chi tiene i conti.
            </p>
            <a
              href="/admin/ordini/esporta"
              download
              className="link-underline text-sm text-ink transition-colors hover:text-accent"
            >
              Scarica gli ordini (CSV)
            </a>
          </div>
        </Sezione>
      </div>
    </section>
  );
}

function Gruppo({
  id,
  titolo,
  ordini,
  vuoto,
  testo,
  corriere,
  biglietti,
  oggi,
  sumupAttivo,
}: {
  id: string;
  titolo: string;
  ordini: Ordine[];
  vuoto?: string;
  testo: ReactNode;
  corriere: string | null;
  biglietti: Map<number, Codice>;
  oggi: string;
  sumupAttivo: boolean;
}) {
  return (
    <Sezione
      id={id}
      titolo={titolo}
      accanto={ordini.length === 1 ? "1 ordine" : `${ordini.length} ordini`}
      testo={testo}
    >
      {ordini.length === 0 ? (
        <p className="prose-measure text-sm text-ink-faint">{vuoto}</p>
      ) : (
        <ul className="border-t border-line lg:-mt-6 lg:border-t-0">
          {ordini.map((o) => (
            <Voce
              key={o.id}
              ordine={o}
              corriere={corriere}
              biglietto={biglietti.get(o.id) ?? null}
              oggi={oggi}
              sumupAttivo={sumupAttivo}
            />
          ))}
        </ul>
      )}
    </Sezione>
  );
}

function Voce({
  ordine: o,
  corriere,
  biglietto,
  oggi,
  sumupAttivo,
}: {
  ordine: Ordine;
  corriere: string | null;
  biglietto: Codice | null;
  oggi: string;
  sumupAttivo: boolean;
}) {
  const a = o.indirizzo;
  const spedito = o.stato === "spedito";
  const rimborsato = o.stato === "rimborsato";
  const rimborso = (
    <RimborsaOrdine id={o.id} importo={prezzo(o.totale)} email={o.email} sumupAttivo={sumupAttivo} />
  );

  return (
    <li className={`border-b border-line py-6 ${spedito || rimborsato ? "text-ink-soft" : ""}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="flex items-center gap-2 text-[0.9375rem]">
          <span
            aria-hidden="true"
            className={`block h-1 w-1 rounded-full ${spedito || rimborsato ? "bg-ink-faint" : "bg-accent"}`}
          />
          <span className="figures">#{o.id}</span>
          <span className="text-ink-faint">·</span>
          {o.nome ?? o.email}
        </p>
        <p className="figures text-sm">
          <span className={rimborsato ? "line-through decoration-ink-faint" : ""}>{prezzo(o.totale)}</span>
          <span className="ml-3 text-xs text-ink-faint">{data(o.creato)}</span>
        </p>
      </div>

      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <ul className="space-y-1 text-sm">
          {o.righe.map((r, i) => (
            <li key={i} className="flex items-baseline justify-between gap-4">
              <span>
                <span className="figures text-ink-faint">{r.quantita} ×</span> {r.title}{" "}
                <span className="text-ink-faint">— {r.formato}</span>
              </span>
              <span className="figures shrink-0 text-ink-soft">{prezzo(r.prezzo * r.quantita)}</span>
            </li>
          ))}
          {o.sconto > 0 && (
            <li className="figures flex justify-between gap-4 pt-1 text-xs text-ink-faint">
              <span>Codice {o.codice ?? "sconto"}</span>
              <span>−{prezzo(o.sconto)}</span>
            </li>
          )}
          <li className="figures flex justify-between gap-4 pt-1 text-xs text-ink-faint">
            <span>Spedizione</span>
            <span>{prezzo(o.spedizione)}</span>
          </li>
        </ul>

        <address className="text-sm not-italic leading-relaxed">
          {[o.nome, a.line1, a.line2, [a.postal_code, a.city, a.state].filter(Boolean).join(" "), a.country && nomePaese(a.country)]
            .filter((r) => r && r.trim().length > 0)
            .map((r, i) => (
              <span key={i} className="block">
                {r}
              </span>
            ))}
          {/* `link-underline` è inline-block: il blocco lo fa la riga che lo contiene. */}
          <span className="mt-1 block">
            <a href={`mailto:${o.email}`} className="link-underline break-all text-xs text-ink-soft">
              {o.email}
            </a>
          </span>
          {o.telefono && (
            <span className="mt-1 block">
              <a href={`tel:${o.telefono.replace(/[^\d+]/g, "")}`} className="link-underline text-xs text-ink-soft">
                <span className="figures">{o.telefono}</span>
              </a>
            </span>
          )}
          {o.codiceFiscale && (
            <span className="mt-1 block text-xs text-ink-soft">
              CF <span className="figures tracking-[0.04em]">{o.codiceFiscale}</span>
            </span>
          )}
          {o.transazione && (
            <span className="mt-1 block text-xs text-ink-faint">
              SumUp <span className="figures">{o.transazione}</span>
            </span>
          )}
        </address>
      </div>

      {!rimborsato && <BigliettoOrdine ordine={o.id} biglietto={biglietto} spedito={spedito} oggi={oggi} />}

      {rimborsato ? (
        <p className="mt-4 text-xs text-ink-faint">
          Rimborsato{o.rimborsato && ` il ${data(o.rimborsato)}`}
          {o.spedito
            ? ` · era partito il ${data(o.spedito)}${o.corriere ? ` con ${o.corriere}` : ""}`
            : " · non era ancora partito"}
        </p>
      ) : spedito ? (
        <>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-ink-faint">
            <span>
              Spedito{o.spedito && ` il ${data(o.spedito)}`}
              {o.corriere && ` con ${o.corriere}`}
              {o.tracking && (
                <>
                  {" · "}
                  {/^https?:\/\//i.test(o.tracking) ? (
                    <a href={o.tracking} target="_blank" rel="noopener noreferrer" className="link-underline text-ink-soft">
                      tracciamento
                    </a>
                  ) : (
                    <span className="figures text-ink-soft">{o.tracking}</span>
                  )}
                </>
              )}
            </span>
            {o.avvisato ? (
              <span>· Cliente avvisato per mail</span>
            ) : (
              <form action={riavvisaAzione} className="flex items-baseline gap-2">
                <input type="hidden" name="id" value={o.id} />
                <span className="text-accent">· Cliente non avvisato</span>
                <button type="submit" className="link-underline text-ink transition-colors hover:text-accent">
                  Avvisalo per mail
                </button>
              </form>
            )}
            <form action={rimettiDaSpedireAzione}>
              <input type="hidden" name="id" value={o.id} />
              <button type="submit" className="link-underline transition-colors hover:text-ink">
                Rimetti fra quelli da spedire
              </button>
            </form>
          </div>
          {rimborso}
        </>
      ) : (
        <>
          <SpedisciOrdine id={o.id} corriere={corriere} email={o.email} />
          {rimborso}
        </>
      )}
    </li>
  );
}
