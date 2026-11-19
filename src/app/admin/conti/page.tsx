import Link from "next/link";
import { prezzo } from "@/data/shop";
import { ArrowLeft, ArrowRight } from "@/components/Icon";
import { richiediAccesso } from "@/lib/auth";
import { contiAnno, listMovimenti, nettoDi, venditeDi, type ContoMese, type Movimento } from "@/lib/conti";
import { oggiInItalia } from "@/lib/oggi";
import { pingDb } from "@/lib/works";
import CancellaMovimento from "../components/CancellaMovimento";
import MovimentoForm from "../components/MovimentoForm";
import Sezione from "../components/Sezione";

export const metadata = { title: "Conti" };

type Props = { searchParams: Promise<{ mese?: string }> };

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

/**
 * I conti, un mese alla volta: in alto si scrive, sotto si guarda il mese
 * scelto, e in fondo l'anno intero, una riga per mese.
 *
 * Le vendite sono tre: contanti e bonifici li scrive lei; quelle del sito le
 * portano gli ordini pagati, spedizione compresa e rimborsati esclusi. Le
 * spese le scrive lei. È un conto per lei, non la contabilità del
 * commercialista.
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

  const { mese: richiesto } = await searchParams;
  const valido = richiesto && /^\d{4}-(0[1-9]|1[0-2])$/.test(richiesto);
  const anno = valido ? Number(richiesto.slice(0, 4)) : annoOggi;
  const mese = valido ? Number(richiesto.slice(5, 7)) : meseOggi;

  const [conti, movimenti] = await Promise.all([contiAnno(anno), listMovimenti(anno, mese)]);
  const questo = conti[mese - 1];

  // Dell'anno in corso si vedono i mesi fino a oggi; di un anno passato tutti;
  // di uno futuro solo quelli che hanno già qualcosa.
  const righe = conti.filter((c) =>
    anno < annoOggi
      ? true
      : anno === annoOggi
        ? c.mese <= meseOggi || venditeDi(c) + c.spese > 0
        : venditeDi(c) + c.spese > 0,
  );
  const totaleAnno = conti.reduce<ContoMese>(
    (t, c) => ({
      mese: 0,
      contanti: t.contanti + c.contanti,
      bonifico: t.bonifico + c.bonifico,
      sito: t.sito + c.sito,
      ordini: t.ordini + c.ordini,
      spese: t.spese + c.spese,
    }),
    { mese: 0, contanti: 0, bonifico: 0, sito: 0, ordini: 0, spese: 0 },
  );

  const [annoPrima, mesePrima] = sposta(anno, mese, -1);
  const [annoDopo, meseDopo] = sposta(anno, mese, 1);

  return (
    <section className="shell pt-8 pb-24 md:pt-12">
      <h1 className="sr-only">Conti</h1>
      <div className="space-y-20 md:space-y-28">
        <Sezione
          id="conti-nuovo"
          titolo="Scrivi"
          accanto="Contanti, bonifici e spese"
          testo={
            <>
              <p>Una vendita fuori dal sito —al mercato, in negozio, a un amico— o una spesa.</p>
              <p>Puoi scriverle una per una, o una sola col totale della giornata.</p>
            </>
          }
        >
          <MovimentoForm oggi={oggi} />
        </Sezione>

        <Sezione
          id="conti-mese"
          titolo={`${NOMI_MESI[mese - 1]} ${anno}`}
          accanto={`Netto ${firmato(nettoDi(questo))}`}
          azione={
            <nav aria-label="Altri mesi" className="flex items-center gap-4 text-sm">
              <Link
                href={`/admin/conti?mese=${chiaveMese(annoPrima, mesePrima)}`}
                className="area-tocco group inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
              >
                <ArrowLeft size={14} />
                <span className="link-underline">{NOMI_MESI[mesePrima - 1]}</span>
              </Link>
              <Link
                href={`/admin/conti?mese=${chiaveMese(annoDopo, meseDopo)}`}
                className="area-tocco group inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
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
            <Cifra
              nome="Sito web"
              valore={prezzo(questo.sito)}
              sotto={questo.ordini === 1 ? "1 ordine" : `${questo.ordini} ordini`}
            />
            <Cifra nome="Vendite" valore={prezzo(venditeDi(questo))} forte />
            <Cifra nome="Spese" valore={prezzo(questo.spese)} />
            <Cifra nome="Netto" valore={firmato(nettoDi(questo))} forte />
          </dl>

          <div className="mt-10">
            <h3 className="label text-ink">Scritti a mano</h3>
            {movimenti.length === 0 ? (
              <p className="mt-3 border-t border-line pt-4 text-sm text-ink-faint">
                Nessuna vendita in contanti o bonifico e nessuna spesa in questo mese.
              </p>
            ) : (
              <ul className="mt-3 border-t border-line">
                {movimenti.map((m) => (
                  <RigaMovimento key={m.id} movimento={m} />
                ))}
              </ul>
            )}
            {questo.ordini > 0 && (
              <p className="mt-4 text-xs text-ink-faint">
                Le vendite del sito arrivano dagli ordini, spedizione compresa.{" "}
                <Link href="/admin/ordini" className="link-underline text-ink-soft transition-colors hover:text-ink">
                  Vedi gli ordini
                </Link>
              </p>
            )}
          </div>
        </Sezione>

        <Sezione
          id="conti-anno"
          titolo={String(anno)}
          accanto={`Netto ${firmato(nettoDi(totaleAnno))}`}
          testo={<p>Un mese per riga. Toccane uno per vederlo sopra.</p>}
          azione={
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
          }
        >
          <div className="-mx-4 overflow-x-auto px-4 lg:-mt-4">
            <table className="figures w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-faint">
                  <th scope="col" className="py-2 pr-4 font-normal">
                    Mese
                  </th>
                  {["Contanti", "Bonifico", "Sito web", "Vendite", "Spese", "Netto"].map((t) => (
                    <th key={t} scope="col" className="py-2 pl-4 text-right font-normal">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {righe.map((c) => {
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
                      <Cella c={c.sito} />
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
                  <Cella c={totaleAnno.sito} forte />
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

function Cifra({ nome, valore, sotto, forte = false }: { nome: string; valore: string; sotto?: string; forte?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-ink-faint">{nome}</dt>
      <dd className={`figures mt-1 text-lg leading-tight ${forte ? "text-ink" : "text-ink-soft"}`}>{valore}</dd>
      {sotto && <dd className="figures mt-0.5 text-xs text-ink-faint">{sotto}</dd>}
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

const giornoBreve = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );

function RigaMovimento({ movimento: m }: { movimento: Movimento }) {
  const tipo = m.tipo === "spesa" ? "Spesa" : m.canale === "bonifico" ? "Bonifico" : "Contanti";
  return (
    <li className="flex items-center gap-4 border-b border-line py-3">
      <span className="figures w-14 shrink-0 text-xs text-ink-faint">{giornoBreve(m.giorno)}</span>
      <span className="min-w-0 flex-1">
        <span className={`block text-xs ${m.tipo === "spesa" ? "text-ink-faint" : "text-ink-soft"}`}>{tipo}</span>
        {m.nota && <span className="block truncate text-sm text-ink">{m.nota}</span>}
      </span>
      <span className={`figures shrink-0 text-sm ${m.tipo === "spesa" ? "text-ink-soft" : "text-ink"}`}>
        {m.tipo === "spesa" ? `−${prezzo(m.importo)}` : prezzo(m.importo)}
      </span>
      <CancellaMovimento id={m.id} descrizione={`${tipo.toLowerCase()} di ${prezzo(m.importo)}`} />
    </li>
  );
}
