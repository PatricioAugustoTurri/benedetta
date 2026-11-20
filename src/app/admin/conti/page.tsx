import Link from "next/link";
import type { ReactNode } from "react";
import { prezzo } from "@/data/shop";
import { ArrowLeft, ArrowRight, ArrowUpRight, Plus } from "@/components/Icon";
import { richiediAccesso } from "@/lib/auth";
import {
  CANALI,
  contiAnno,
  daFare,
  listSpese,
  NOME_CANALE,
  nettoDi,
  venditeDaFare,
  venditeDelMese,
  venditeDi,
  type Canale,
  type ContoMese,
  type Vendita,
} from "@/lib/conti";
import { oggiInItalia } from "@/lib/oggi";
import { pingDb } from "@/lib/works";
import CancellaRiga from "../components/CancellaRiga";
import Sezione from "../components/Sezione";
import SpesaForm from "../components/SpesaForm";
import { cancellaSpesaAzione, segnaVenditaAzione } from "./actions";

export const metadata = { title: "Conti" };

type Props = { searchParams: Promise<{ mese?: string; canale?: string; dafare?: string; q?: string }> };

const NOMI_MESI = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const chiaveMese = (anno: number, mese: number) => `${anno}-${String(mese).padStart(2, "0")}`;

/** Un mese dopo o prima, attraversando l'anno. */
function sposta(anno: number, mese: number, di: number): [number, number] {
  const t = anno * 12 + (mese - 1) + di;
  return [Math.floor(t / 12), (t % 12) + 1];
}

/** Il segno meno vero, e non il trattino, davanti a un netto in perdita. */
const firmato = (c: number) => (c < 0 ? `−${prezzo(-c)}` : prezzo(c));

const giornoBreve = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/**
 * I conti. Dall'alto:
 *
 * - **Il mese**: contanti, bonifico, SumUp —il lettore e il sito—, il totale, le spese e il netto, e
 *   quello che aspetta —da incassare, da spedire, da consegnare— in
 *   terracotta, che porta dritto alle righe da fare.
 * - **Il registro delle vendite**, a tutta larghezza perché è una tabella da
 *   leggere in riga: chi, cosa, come, quanto, se ha pagato e se l'ha
 *   ricevuta. Quelle del sito ci sono da sole, come SumUp e con un rimando
 *   all'ordine.
 *   Ogni riga ha il suo gesto veloce —«È arrivato», «È partita»— senza aprire
 *   niente.
 * - **Le spese**, in cosa e quanto.
 * - **L'anno**, una riga per mese, e il foglio per il commercialista.
 *
 * I filtri vivono nell'indirizzo (?canale, ?dafare, ?q): si torna indietro col
 * browser e un filtro si può tenere fra i preferiti.
 */
export default async function ContiPage({ searchParams }: Props) {
  await richiediAccesso("/admin/conti");
  if (!(await pingDb())) {
    return (
      <section className="shell py-24">
        <h1 className="display-lead font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.15]">
          Il database non risponde.
        </h1>
      </section>
    );
  }

  const oggi = oggiInItalia();
  const annoOggi = Number(oggi.slice(0, 4));
  const meseOggi = Number(oggi.slice(5, 7));

  const params = await searchParams;
  const valido = params.mese && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.mese);
  const anno = valido ? Number(params.mese!.slice(0, 4)) : annoOggi;
  const mese = valido ? Number(params.mese!.slice(5, 7)) : meseOggi;
  const canale = CANALI.includes(params.canale as Canale) ? (params.canale as Canale) : null;
  const soloDaFare = params.dafare === "1";
  const cerca = (params.q ?? "").trim().slice(0, 80);

  const [conti, delMese, pendenti, spese] = await Promise.all([
    contiAnno(anno),
    venditeDelMese(anno, mese),
    venditeDaFare(),
    listSpese(anno, mese),
  ]);
  const questo = conti[mese - 1];

  // Le righe del registro: il mese, o tutto quello che aspetta qualcosa.
  const base = soloDaFare ? pendenti : delMese;
  const ago = cerca.toLowerCase();
  const righe = base.filter(
    (v) =>
      (!canale || v.canale === canale) &&
      (!ago || [v.nome, v.email ?? "", v.cosa, v.numero].some((t) => t.toLowerCase().includes(ago))),
  );
  const totaleRighe = righe.reduce((t, v) => t + v.importo, 0);

  const daIncassare = pendenti.filter((v) => v.pagatoIl === null);
  const daSpedire = pendenti.filter((v) => v.consegnatoIl === null && v.consegna === "spedizione");
  const daConsegnare = pendenti.filter((v) => v.consegnatoIl === null && v.consegna === "mano");

  const meseQui = chiaveMese(anno, mese);
  const link = (cambio: Partial<{ canale: Canale | null; dafare: boolean; q: string; mese: string }>) => {
    const p = new URLSearchParams();
    p.set("mese", cambio.mese ?? meseQui);
    const c = "canale" in cambio ? cambio.canale : canale;
    if (c) p.set("canale", c);
    if (cambio.dafare ?? soloDaFare) p.set("dafare", "1");
    const q = cambio.q ?? cerca;
    if (q) p.set("q", q);
    return `/admin/conti?${p}`;
  };

  // Dell'anno in corso si vedono i mesi fino a oggi; di un anno passato tutti;
  // di uno futuro solo quelli che hanno già qualcosa.
  const mesiAnno = conti.filter((c) => {
    const pieno = venditeDi(c) + c.spese > 0;
    return anno < annoOggi ? true : anno === annoOggi ? c.mese <= meseOggi || pieno : pieno;
  });
  const totaleAnno = conti.reduce<ContoMese>(
    (t, c) => ({
      mese: 0,
      contanti: t.contanti + c.contanti,
      bonifico: t.bonifico + c.bonifico,
      sumup: t.sumup + c.sumup,
      spese: t.spese + c.spese,
    }),
    { mese: 0, contanti: 0, bonifico: 0, sumup: 0, spese: 0 },
  );

  const [annoPrima, mesePrima] = sposta(anno, mese, -1);
  const [annoDopo, meseDopo] = sposta(anno, mese, 1);
  const nomeMese = `${NOMI_MESI[mese - 1]} ${anno}`;
  const contaCanale = (c: Canale) => base.filter((v) => v.canale === c).length;

  return (
    <section className="shell pt-8 pb-24 md:pt-12">
      <h1 className="sr-only">Conti</h1>
      <div className="space-y-20 md:space-y-28">
        {/* ------------------------------------------------------ il mese */}
        <Sezione
          id="conti-mese"
          titolo={nomeMese}
          accanto={`Netto ${firmato(nettoDi(questo))}`}
          azione={
            <nav aria-label="Altri mesi" className="flex items-center gap-4 text-sm">
              <Link
                href={`/admin/conti?mese=${chiaveMese(annoPrima, mesePrima)}`}
                className="area-tocco inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
              >
                <ArrowLeft size={14} />
                <span className="link-underline">{NOMI_MESI[mesePrima - 1]}</span>
              </Link>
              <Link
                href={`/admin/conti?mese=${chiaveMese(annoDopo, meseDopo)}`}
                className="area-tocco inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
              >
                <span className="link-underline">{NOMI_MESI[meseDopo - 1]}</span>
                <ArrowRight size={14} />
              </Link>
            </nav>
          }
        >
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-5 sm:grid-cols-3 lg:-mt-4 lg:grid-cols-6 lg:border-t-0 lg:pt-0">
            <Cifra nome="Contanti" valore={prezzo(questo.contanti)} />
            <Cifra nome="Bonifico" valore={prezzo(questo.bonifico)} />
            <Cifra nome="SumUp" valore={prezzo(questo.sumup)} />
            <Cifra nome="Vendite" valore={prezzo(venditeDi(questo))} forte />
            <Cifra nome="Spese" valore={prezzo(questo.spese)} />
            <Cifra nome="Netto" valore={firmato(nettoDi(questo))} forte />
          </dl>

          {pendenti.length > 0 && (
            <p className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-sm">
              <span aria-hidden="true" className="block h-1 w-1 rounded-full bg-accent" />
              {daIncassare.length > 0 && (
                <Avviso href={link({ dafare: true, canale: null })}>
                  Da incassare: {daIncassare.length} · {prezzo(daIncassare.reduce((t, v) => t + v.importo, 0))}
                </Avviso>
              )}
              {daSpedire.length > 0 && (
                <Avviso href={link({ dafare: true, canale: null })}>Da spedire: {daSpedire.length}</Avviso>
              )}
              {daConsegnare.length > 0 && (
                <Avviso href={link({ dafare: true, canale: null })}>Da consegnare a mano: {daConsegnare.length}</Avviso>
              )}
              <span className="text-xs text-ink-faint">di tutti i mesi</span>
            </p>
          )}
        </Sezione>

        {/* ---------------------------------------------- il registro */}
        <section aria-labelledby="conti-vendite" className="border-t-4 border-ink pt-6 md:pt-8">
          <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div>
              <h2 id="conti-vendite" className="display-section font-display text-xl leading-tight">
                {soloDaFare ? "Da fare" : "Vendite"}
              </h2>
              <p className="figures mt-1 text-xs text-ink-faint">
                {soloDaFare ? "Di tutti i mesi" : nomeMese} · {righe.length} {righe.length === 1 ? "vendita" : "vendite"} ·{" "}
                {prezzo(totaleRighe)}
              </p>
            </div>
            <Link
              href="/admin/conti/vendite/nuova"
              className="inline-flex items-center gap-2 border border-ink bg-ink px-4 py-2 text-xs text-paper transition-opacity hover:opacity-85"
            >
              <Plus size={14} />
              Nuova vendita
            </Link>
          </header>

          {/* I filtri: il canale, solo quello da fare, e la ricerca. */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-b border-line pb-4">
            <nav aria-label="Filtra per canale" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <Filtro href={link({ canale: null })} attivo={!canale}>
                Tutte <span className="figures text-xs text-ink-faint">{base.length}</span>
              </Filtro>
              {CANALI.map((c) => (
                <Filtro key={c} href={link({ canale: c })} attivo={canale === c}>
                  {NOME_CANALE[c]} <span className="figures text-xs text-ink-faint">{contaCanale(c)}</span>
                </Filtro>
              ))}
              <span aria-hidden="true" className="h-4 w-px bg-line" />
              <Filtro href={link({ dafare: !soloDaFare })} attivo={soloDaFare}>
                Solo da fare <span className="figures text-xs text-accent">{pendenti.length || ""}</span>
              </Filtro>
            </nav>
            <form action="/admin/conti" className="flex w-full items-center gap-3 sm:w-auto">
              <input type="hidden" name="mese" value={meseQui} />
              {canale && <input type="hidden" name="canale" value={canale} />}
              {soloDaFare && <input type="hidden" name="dafare" value="1" />}
              <label htmlFor="conti-cerca" className="sr-only">
                Cerca per nome, email o cosa
              </label>
              <input
                id="conti-cerca"
                type="search"
                name="q"
                defaultValue={cerca}
                placeholder="Cerca un nome, un’email…"
                className="w-full border-0 border-b border-line bg-transparent py-1.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none sm:w-60"
              />
            </form>
          </div>

          {righe.length === 0 ? (
            <p className="border-b border-line py-8 text-sm text-ink-faint">
              {cerca
                ? `Nessuna vendita per «${cerca}».`
                : soloDaFare
                  ? "Niente da fare: tutto incassato e consegnato."
                  : canale
                    ? `Nessuna vendita con ${NOME_CANALE[canale].toLowerCase()} in questo mese.`
                    : "Nessuna vendita in questo mese."}
            </p>
          ) : (
            <>
              {/* L'intestazione delle colonne, solo dove la riga è una riga. */}
              <div
                aria-hidden="true"
                className={`hidden border-b border-line py-2 text-xs text-ink-faint lg:grid ${COLONNE}`}
              >
                <span>Data</span>
                <span>Cliente</span>
                <span>Cosa</span>
                <span>Canale</span>
                <span className="text-right">Importo</span>
                <span>Pagamento</span>
                <span>Consegna</span>
              </div>
              <ul>
                {righe.map((v) => (
                  <RigaVendita key={v.chiave} vendita={v} conAnno={soloDaFare} />
                ))}
              </ul>
              <p className="figures flex justify-end gap-3 border-t-2 border-ink py-3 text-sm">
                <span className="text-ink-faint">Totale</span>
                <span className="text-ink">{prezzo(totaleRighe)}</span>
              </p>
            </>
          )}
        </section>

        {/* --------------------------------------------------- le spese */}
        <Sezione
          id="conti-spese"
          titolo="Spese"
          accanto={`${nomeMese} · ${prezzo(questo.spese)}`}
          testo={<p>In cosa e quanto. Materiali, stampa, spedizioni, fiere: tutto quello che esce.</p>}
        >
          <SpesaForm
            key={meseQui}
            giornoIniziale={meseQui === oggi.slice(0, 7) ? oggi : `${meseQui}-01`}
          />
          {spese.length > 0 ? (
            <ul className="mt-8 border-t border-line">
              {spese.map((s) => (
                <li key={s.id} className="flex items-center gap-4 border-b border-line py-3">
                  <span className="figures w-14 shrink-0 text-xs text-ink-faint">{giornoBreve(s.giorno)}</span>
                  <span className="min-w-0 flex-1 text-sm text-ink">{s.descrizione}</span>
                  <span className="figures shrink-0 text-sm text-ink-soft">−{prezzo(s.importo)}</span>
                  <CancellaRiga azione={cancellaSpesaAzione} id={s.id} descrizione={`la spesa «${s.descrizione}»`} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 border-t border-line pt-4 text-sm text-ink-faint">Nessuna spesa in questo mese.</p>
          )}
        </Sezione>

        {/* ---------------------------------------------------- l'anno */}
        <Sezione
          id="conti-anno"
          titolo={String(anno)}
          accanto={`Netto ${firmato(nettoDi(totaleAnno))}`}
          testo={
            <>
              <p>Un mese per riga. Toccane uno per vederlo sopra.</p>
              <p>
                Il foglio si apre con Excel o Numbers: tutte le vendite, con il loro canale, e tutte le spese.
              </p>
            </>
          }
          azione={
            <div className="space-y-4">
              <nav aria-label="Altri anni" className="flex items-center gap-4 text-sm">
                <Link
                  href={`/admin/conti?mese=${chiaveMese(anno - 1, 12)}`}
                  className="area-tocco inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
                >
                  <ArrowLeft size={14} />
                  <span className="link-underline figures">{anno - 1}</span>
                </Link>
                <Link
                  href={`/admin/conti?mese=${chiaveMese(anno + 1, 1)}`}
                  className="area-tocco inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
                >
                  <span className="link-underline figures">{anno + 1}</span>
                  <ArrowRight size={14} />
                </Link>
              </nav>
              <div className="flex flex-col items-start gap-2 text-sm">
                <a
                  href={`/admin/conti/esporta?anno=${anno}&mese=${mese}`}
                  className="area-tocco inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
                >
                  <ArrowRight size={14} className="rotate-90" />
                  <span className="link-underline">Scarica {NOMI_MESI[mese - 1].toLowerCase()}</span>
                </a>
                <a
                  href={`/admin/conti/esporta?anno=${anno}`}
                  className="area-tocco inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
                >
                  <ArrowRight size={14} className="rotate-90" />
                  <span className="link-underline">Scarica tutto il {anno}</span>
                </a>
              </div>
            </div>
          }
        >
          <div className="-mx-4 overflow-x-auto px-4 lg:-mt-4">
            <table className="figures w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-faint">
                  <th scope="col" className="py-2 pr-4 font-normal">
                    Mese
                  </th>
                  {["Contanti", "Bonifico", "SumUp", "Vendite", "Spese", "Netto"].map((t) => (
                    <th key={t} scope="col" className="py-2 pl-4 text-right font-normal">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mesiAnno.map((c) => {
                  const attivo = c.mese === mese;
                  return (
                    <tr key={c.mese} className={`border-b border-line ${attivo ? "bg-paper-deep/60" : ""}`}>
                      <th scope="row" className="py-2.5 pr-4 text-left font-normal">
                        <Link
                          href={`/admin/conti?mese=${chiaveMese(anno, c.mese)}`}
                          aria-current={attivo ? "page" : undefined}
                          className="link-underline text-ink transition-colors hover:text-accent"
                        >
                          {NOMI_MESI[c.mese - 1]}
                        </Link>
                      </th>
                      <Cella c={c.contanti} />
                      <Cella c={c.bonifico} />
                      <Cella c={c.sumup} />
                      <Cella c={venditeDi(c)} forte />
                      <Cella c={c.spese} />
                      <Cella c={nettoDi(c)} forte netto />
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink">
                  <th scope="row" className="py-3 pr-4 text-left font-normal text-ink">
                    Totale
                  </th>
                  <Cella c={totaleAnno.contanti} forte />
                  <Cella c={totaleAnno.bonifico} forte />
                  <Cella c={totaleAnno.sumup} forte />
                  <Cella c={venditeDi(totaleAnno)} forte />
                  <Cella c={totaleAnno.spese} forte />
                  <Cella c={nettoDi(totaleAnno)} forte netto />
                </tr>
              </tfoot>
            </table>
          </div>
        </Sezione>
      </div>
    </section>
  );
}

/** Le colonne del registro da 1024px: la stessa griglia per l'intestazione e per ogni riga. */
const COLONNE =
  "lg:grid-cols-[5.5rem_minmax(0,1.15fr)_minmax(0,1.5fr)_5.5rem_5.5rem_minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-x-5";

/**
 * Una vendita. Da 1024px è una riga di tabella; sotto, una scheda: il nome e
 * l'importo in alto, cosa sotto, e lo stato con i suoi gesti in fondo, a
 * portata di pollice.
 */
function RigaVendita({ vendita: v, conAnno }: { vendita: Vendita; conAnno: boolean }) {
  const aMano = v.origine === "mano";
  const href = aMano ? `/admin/conti/vendite/${v.id}` : "/admin/ordini";
  const spedizione = v.consegna === "spedizione";
  const data = conAnno
    ? new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "2-digit", timeZone: "UTC" }).format(
        new Date(`${v.giorno}T00:00:00Z`),
      )
    : giornoBreve(v.giorno);

  return (
    <li
      id={v.chiave}
      className={`scroll-mt-24 border-b border-line py-4 target:bg-paper-deep/70 lg:grid lg:items-start lg:py-3 ${COLONNE}`}
    >
      {/* Data e numero */}
      <div className="figures hidden text-xs lg:block">
        <span className="block text-ink-soft">{data}</span>
        <span className="mt-0.5 block text-ink-faint">{aMano ? v.numero.replace(/^V-\d{4}-/, "V-") : `#${v.id}`}</span>
      </div>

      {/* Cliente; sul telefono porta anche l'importo */}
      <div className="flex items-baseline justify-between gap-4 lg:block lg:min-w-0">
        <span className="min-w-0">
          <Link
            href={href}
            className="link-underline block truncate text-[0.9375rem] text-ink transition-colors hover:text-accent lg:text-sm"
          >
            {v.nome}
          </Link>
          {(v.email || v.telefono) && (
            <span className="mt-0.5 block truncate text-xs text-ink-faint">{v.email ?? v.telefono}</span>
          )}
        </span>
        <span className="figures shrink-0 text-[0.9375rem] text-ink lg:hidden">{prezzo(v.importo)}</span>
      </div>

      {/* Cosa */}
      <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-ink-soft lg:mt-0">{v.cosa}</p>

      {/* Canale; sul telefono con data e numero */}
      <p className="mt-1.5 text-xs text-ink-faint lg:mt-0 lg:text-sm lg:text-ink-soft">
        {NOME_CANALE[v.canale]}
        {v.origine === "sito" && (
          <>
            {" · "}
            <Link href="/admin/ordini" className="inline-flex items-center gap-1 transition-colors hover:text-ink">
              <span className="link-underline">sito web</span>
              <ArrowUpRight size={12} />
            </Link>
          </>
        )}
        <span className="figures lg:hidden">
          {" "}
          · {data} · {v.numero}
        </span>
      </p>

      {/* Importo */}
      <p className="figures hidden text-right text-sm text-ink lg:block">{prezzo(v.importo)}</p>

      {/* Pagamento e consegna: lo stato, e il gesto per chiuderlo */}
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3 lg:contents">
        <Stato
          fatto={v.pagatoIl}
          etichettaFatto="Pagata"
          daFare="Da incassare"
          gesto={aMano ? { id: v.id, cosa: "pagata", testo: v.canale === "bonifico" ? "È arrivato" : "Ha pagato" } : null}
        />
        <Stato
          prima={spedizione ? "Spedizione" : "A mano"}
          fatto={v.consegnatoIl}
          etichettaFatto={spedizione ? "Spedita" : "Consegnata"}
          daFare={spedizione ? "Da spedire" : "Da consegnare"}
          gesto={
            aMano
              ? { id: v.id, cosa: "consegnata", testo: spedizione ? "È partita" : "L’ha ricevuta" }
              : null
          }
          rimando={!aMano && v.consegnatoIl === null ? "In Ordini" : null}
        />
      </div>
      {!daFare(v) && <span className="sr-only">Chiusa.</span>}
    </li>
  );
}

function Stato({
  prima,
  fatto,
  etichettaFatto,
  daFare,
  gesto,
  rimando = null,
}: {
  prima?: string;
  fatto: string | null;
  etichettaFatto: string;
  daFare: string;
  gesto: { id: number; cosa: "pagata" | "consegnata"; testo: string } | null;
  rimando?: string | null;
}) {
  return (
    <div className="text-xs leading-relaxed">
      {prima && <span className="block text-ink-soft">{prima}</span>}
      {fatto ? (
        <span className="figures block text-ink-faint">
          {etichettaFatto} il {giornoBreve(fatto)}
        </span>
      ) : (
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-accent">
            <span aria-hidden="true" className="block h-1 w-1 rounded-full bg-accent" />
            {daFare}
          </span>
          {gesto && (
            <form action={segnaVenditaAzione}>
              <input type="hidden" name="id" value={gesto.id} />
              <input type="hidden" name="cosa" value={gesto.cosa} />
              <button
                type="submit"
                className="border border-line px-2 py-1 text-[0.6875rem] text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                {gesto.testo}
              </button>
            </form>
          )}
          {rimando && (
            <Link href="/admin/ordini" className="link-underline text-ink-soft hover:text-ink">
              {rimando}
            </Link>
          )}
        </span>
      )}
    </div>
  );
}

function Filtro({ href, attivo, children }: { href: string; attivo: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={attivo ? "true" : undefined}
      className="area-tocco inline-flex items-baseline gap-1.5 text-ink-faint transition-colors hover:text-ink aria-[current=true]:text-ink"
    >
      <span className="link-underline text-inherit" data-active={attivo}>
        {children}
      </span>
    </Link>
  );
}

function Avviso({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="link-underline figures text-accent transition-colors hover:text-ink">
      {children}
    </Link>
  );
}

function Cifra({ nome, valore, forte = false }: { nome: string; valore: string; forte?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-ink-faint">{nome}</dt>
      <dd className={`figures mt-1 text-lg leading-tight ${forte ? "text-ink" : "text-ink-soft"}`}>{valore}</dd>
    </div>
  );
}

/** Lo zero è un trattino pallido: in una colonna di mesi vuoti, si leggono solo quelli pieni. */
function Cella({ c, forte = false, netto = false }: { c: number; forte?: boolean; netto?: boolean }) {
  return (
    <td
      className={`py-2.5 pl-4 text-right whitespace-nowrap ${
        c === 0 ? "text-ink-faint" : netto && c < 0 ? "text-accent" : forte ? "text-ink" : "text-ink-soft"
      }`}
    >
      {c === 0 ? "—" : netto ? firmato(c) : prezzo(c)}
    </td>
  );
}
