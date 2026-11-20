"use client";

import Link from "next/link";
import { useActionState, useId, useRef, useState, type ReactNode } from "react";
import { Close, Plus } from "@/components/Icon";
import type { Canale, Cliente, Vendita } from "@/lib/conti";
import { importoScritto } from "@/lib/importi";
import { salvaVenditaAzione, type EsitoVendita } from "../conti/actions";
import { CONTROL, LABEL } from "./campo";

/** Una stampa che si può togliere dal magazzino, con le copie di ogni formato (null: non contata). */
export type StampaDelCassetto = {
  id: number;
  titolo: string;
  categoria: string;
  formati: { formato: string; copie: number | null }[];
};

type RigaMagazzino = { chiave: number; prodottoId: number | ""; formato: string; copie: string };

/**
 * Il modulo di una vendita in contanti, con bonifico o con SumUp: chi, cosa, quanto,
 * come ha pagato, come la riceve, e a che punto è.
 *
 * Le spunte «pagata» e «consegnata» si accendono da sole con la scelta più
 * probabile —contanti e SumUp si incassano subito, un bonifico arriva dopo; a mano
 * si consegna subito, una spedizione parte dopo— finché lei non le tocca: da
 * lì in poi decide lei.
 *
 * «Scrivi e aggiungine un'altra» resta sul modulo con il giorno, il canale e
 * la consegna di prima: è il ritorno dal mercato, dieci vendite di fila.
 */
export default function VenditaForm({
  vendita,
  oggi,
  clienti,
  stampe,
}: {
  vendita?: Vendita;
  oggi: string;
  clienti: Cliente[];
  stampe: StampaDelCassetto[];
}) {
  const base = useId();
  const nuova = !vendita;
  const primoCampo = useRef<HTMLInputElement>(null);

  const [giorno, setGiorno] = useState(vendita?.giorno ?? oggi);
  const [nome, setNome] = useState(vendita?.nome ?? "");
  const [email, setEmail] = useState(vendita?.email ?? "");
  const [telefono, setTelefono] = useState(vendita?.telefono ?? "");
  const [cosa, setCosa] = useState(vendita?.cosa ?? "");
  const [importo, setImporto] = useState(vendita ? importoScritto(vendita.importo) : "");
  const [canale, setCanale] = useState<Canale>(vendita?.canale ?? "contanti");
  const [consegna, setConsegna] = useState<"mano" | "spedizione">(vendita?.consegna ?? "mano");
  const [pagata, setPagata] = useState(vendita ? vendita.pagatoIl !== null : true);
  const [pagatoIl, setPagatoIl] = useState(vendita?.pagatoIl ?? "");
  const [consegnata, setConsegnata] = useState(vendita ? vendita.consegnatoIl !== null : true);
  const [consegnatoIl, setConsegnatoIl] = useState(vendita?.consegnatoIl ?? "");
  // Una spunta toccata a mano non la sposta più nessuno.
  const [toccate, setToccate] = useState({ pagata: !nuova, consegnata: !nuova });
  const [magazzino, setMagazzino] = useState<RigaMagazzino[]>([]);
  const [prossima, setProssima] = useState(1);

  const [esito, azione, inCorso] = useActionState<EsitoVendita, FormData>(async (p, fd) => {
    const r = await salvaVenditaAzione(p, fd);
    if (r.ok) {
      setNome("");
      setEmail("");
      setTelefono("");
      setCosa("");
      setImporto("");
      setMagazzino([]);
      setToccate({ pagata: false, consegnata: false });
      setPagata(canale !== "bonifico");
      setConsegnata(consegna === "mano");
      primoCampo.current?.focus();
    }
    return r;
  }, {});

  const scegliCanale = (c: Canale) => {
    setCanale(c);
    if (!toccate.pagata) setPagata(c !== "bonifico");
  };
  const scegliConsegna = (c: "mano" | "spedizione") => {
    setConsegna(c);
    if (!toccate.consegnata) setConsegnata(c === "mano");
  };

  // Un cliente già visto: si completa email e telefono, se sono ancora vuoti.
  const scriviNome = (valore: string) => {
    setNome(valore);
    const c = clienti.find((x) => x.nome.toLowerCase() === valore.trim().toLowerCase());
    if (c) {
      if (!email && c.email) setEmail(c.email);
      if (!telefono && c.telefono) setTelefono(c.telefono);
    }
  };

  const aggiungiRiga = () => {
    setMagazzino((m) => [...m, { chiave: prossima, prodottoId: "", formato: "", copie: "1" }]);
    setProssima((n) => n + 1);
  };
  const cambiaRiga = (chiave: number, cambio: Partial<RigaMagazzino>) =>
    setMagazzino((m) => m.map((r) => (r.chiave === chiave ? { ...r, ...cambio } : r)));

  const spedizione = consegna === "spedizione";
  const id = (s: string) => `${base}-${s}`;

  return (
    <form action={azione} className="space-y-10">
      {vendita && <input type="hidden" name="id" value={vendita.id} />}
      <input
        type="hidden"
        name="magazzino"
        value={JSON.stringify(
          magazzino
            .filter((r) => r.prodottoId && r.formato)
            .map((r) => ({ prodottoId: r.prodottoId, formato: r.formato, copie: Number(r.copie) || 0 })),
        )}
      />

      <Gruppo titolo="Chi">
        <div className="grid gap-6 sm:grid-cols-3">
          <Campo id={id("nome")} etichetta="Nome">
            <input
              ref={primoCampo}
              id={id("nome")}
              name="nome"
              value={nome}
              onChange={(e) => scriviNome(e.target.value)}
              list={id("clienti")}
              required
              maxLength={120}
              autoComplete="off"
              placeholder="Giulia Rossi"
              className={`${CONTROL} mt-1 py-1.5 text-sm`}
            />
            <datalist id={id("clienti")}>
              {clienti.map((c) => (
                <option key={c.nome} value={c.nome} />
              ))}
            </datalist>
          </Campo>
          <Campo id={id("email")} etichetta="Email" facoltativo>
            <input
              id={id("email")}
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={200}
              autoComplete="off"
              className={`${CONTROL} mt-1 py-1.5 text-sm`}
            />
          </Campo>
          <Campo id={id("tel")} etichetta="Telefono" facoltativo>
            <input
              id={id("tel")}
              name="telefono"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              maxLength={40}
              autoComplete="off"
              className={`${CONTROL} mt-1 py-1.5 text-sm`}
            />
          </Campo>
        </div>
      </Gruppo>

      <Gruppo titolo="Cosa">
        <Campo id={id("cosa")} etichetta="Cosa ha comprato">
          <textarea
            id={id("cosa")}
            name="cosa"
            value={cosa}
            onChange={(e) => setCosa(e.target.value)}
            rows={2}
            required
            maxLength={500}
            placeholder="2 stampe A4 «Pasta», 1 quaderno"
            className={`${CONTROL} mt-2 field-sizing-content resize-y text-sm leading-relaxed`}
          />
        </Campo>

        {nuova ? (
          stampe.length > 0 && (
            <div className="mt-6">
              {magazzino.length > 0 && (
                <ul className="mb-3 space-y-3">
                  {magazzino.map((r) => {
                    const stampa = stampe.find((s) => s.id === r.prodottoId);
                    return (
                      <li key={r.chiave} className="grid grid-cols-[1fr_auto] items-end gap-x-3 gap-y-3 sm:grid-cols-[1fr_9rem_4rem_auto]">
                        <label className="col-span-2 block sm:col-span-1">
                          <span className="sr-only">Stampa</span>
                          <select
                            value={r.prodottoId}
                            onChange={(e) =>
                              cambiaRiga(r.chiave, { prodottoId: e.target.value ? Number(e.target.value) : "", formato: "" })
                            }
                            className={`${CONTROL} py-1.5 text-sm`}
                          >
                            <option value="">Quale stampa…</option>
                            {[...new Set(stampe.map((s) => s.categoria))].map((cat) => (
                              <optgroup key={cat} label={cat}>
                                {stampe
                                  .filter((s) => s.categoria === cat)
                                  .map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.titolo}
                                    </option>
                                  ))}
                              </optgroup>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="sr-only">Formato</span>
                          <select
                            value={r.formato}
                            onChange={(e) => cambiaRiga(r.chiave, { formato: e.target.value })}
                            disabled={!stampa}
                            className={`${CONTROL} py-1.5 text-sm disabled:opacity-40`}
                          >
                            <option value="">Formato…</option>
                            {stampa?.formati.map((f) => (
                              <option key={f.formato} value={f.formato}>
                                {f.formato} · {f.copie === null ? "non contata" : `${f.copie} nel cassetto`}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="sr-only">Copie</span>
                          <input
                            value={r.copie}
                            onChange={(e) => cambiaRiga(r.chiave, { copie: e.target.value.replace(/[^\d]/g, "").slice(0, 3) })}
                            inputMode="numeric"
                            aria-label="Copie"
                            className={`${CONTROL} figures py-1.5 text-center text-sm`}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setMagazzino((m) => m.filter((x) => x.chiave !== r.chiave))}
                          className="flex h-8 w-8 items-center justify-center text-ink-faint transition-colors hover:text-accent"
                        >
                          <span className="sr-only">Togli questa riga</span>
                          <Close size={15} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <button
                type="button"
                onClick={aggiungiRiga}
                className="area-tocco inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
              >
                <Plus size={14} />
                <span className="link-underline">
                  {magazzino.length === 0 ? "Togli dal magazzino" : "Un’altra stampa"}
                </span>
              </button>
              <span className="ml-2 text-xs text-ink-faint">facoltativo</span>
            </div>
          )
        ) : (
          vendita.magazzino.length > 0 && (
            <p className="mt-4 text-xs leading-relaxed text-ink-faint">
              Tolte dal magazzino:{" "}
              {vendita.magazzino
                .map((s) => `${s.tolte} × ${s.titolo} ${s.formato}${s.tolte < s.copie ? ` (ne aveva chieste ${s.copie})` : ""}`)
                .join(", ")}
              . Se cancelli la vendita, tornano nel cassetto.
            </p>
          )
        )}
      </Gruppo>

      <Gruppo titolo="Quanto">
        <div className="grid gap-6 sm:grid-cols-[8rem_max-content_10rem] sm:items-end sm:gap-x-10">
          <Campo id={id("importo")} etichetta="Importo €">
            <input
              id={id("importo")}
              name="importo"
              value={importo}
              onChange={(e) => setImporto(e.target.value)}
              inputMode="decimal"
              required
              autoComplete="off"
              placeholder="40,00"
              className={`${CONTROL} figures mt-1 py-1.5 text-sm`}
            />
          </Campo>
          <Scelte
            legenda="Come ha pagato"
            nome="canale"
            valore={canale}
            scegli={scegliCanale}
            opzioni={[
              ["contanti", "Contanti"],
              ["bonifico", "Bonifico"],
              ["sumup", "SumUp"],
            ]}
          />
          <Campo id={id("giorno")} etichetta="Giorno">
            <input
              id={id("giorno")}
              type="date"
              name="giorno"
              value={giorno}
              onChange={(e) => setGiorno(e.target.value)}
              required
              className={`${CONTROL} mt-1 py-1.5 text-sm`}
            />
          </Campo>
        </div>
        <Spunta
          nome="pagata"
          acceso={pagata}
          cambia={(v) => {
            setPagata(v);
            setToccate((t) => ({ ...t, pagata: true }));
          }}
          etichetta={canale === "bonifico" ? "Il bonifico è arrivato" : "Ha già pagato"}
          spenta="Resta fra quelle da incassare."
          data={nuova ? null : { nome: "pagato_il", valore: pagatoIl || giorno, cambia: setPagatoIl }}
        />
      </Gruppo>

      <Gruppo titolo="Consegna">
        <Scelte
          legenda="Come la riceve"
          nome="consegna"
          valore={consegna}
          scegli={scegliConsegna}
          opzioni={[
            ["mano", "A mano"],
            ["spedizione", "Spedizione"],
          ]}
        />
        <Spunta
          nome="consegnata"
          acceso={consegnata}
          cambia={(v) => {
            setConsegnata(v);
            setToccate((t) => ({ ...t, consegnata: true }));
          }}
          etichetta={spedizione ? "È già partita" : "L’ha già ricevuta"}
          spenta={spedizione ? "Resta fra quelle da spedire." : "Resta fra quelle da consegnare."}
          data={nuova ? null : { nome: "consegnato_il", valore: consegnatoIl || giorno, cambia: setConsegnatoIl }}
        />
      </Gruppo>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-6">
        <button
          type="submit"
          name="dopo"
          value=""
          disabled={inCorso}
          className="border border-ink bg-ink px-4 py-2 text-xs text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {inCorso ? "Un momento…" : nuova ? "Scrivi la vendita" : "Salva le modifiche"}
        </button>
        {nuova && (
          <button
            type="submit"
            name="dopo"
            value="altra"
            disabled={inCorso}
            className="border border-line px-4 py-2 text-xs text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-50"
          >
            Scrivi e aggiungine un’altra
          </button>
        )}
        <Link href={`/admin/conti?mese=${giorno.slice(0, 7)}`} className="area-tocco link-underline text-xs text-ink-soft hover:text-ink">
          Annulla
        </Link>
        {esito.error && (
          <p role="alert" className="w-full text-xs text-accent">
            {esito.error}
          </p>
        )}
        {esito.ok && !inCorso && (
          <p role="status" className="w-full text-xs text-ink-soft">
            {esito.scritta} scritta. Puoi scrivere la prossima.
          </p>
        )}
      </div>
    </form>
  );
}

function Gruppo({ titolo, children }: { titolo: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-4 md:grid-cols-[7rem_1fr] md:gap-8">
      <legend className="sr-only">{titolo}</legend>
      <p aria-hidden="true" className="label text-ink">
        {titolo}
      </p>
      <div className="min-w-0 space-y-5">{children}</div>
    </fieldset>
  );
}

function Campo({
  id,
  etichetta,
  facoltativo = false,
  children,
}: {
  id: string;
  etichetta: string;
  facoltativo?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="group/campo">
      <label htmlFor={id} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
        {etichetta}
        {facoltativo && <span className="ml-1.5 normal-case tracking-normal text-ink-faint/80">· facoltativo</span>}
      </label>
      {children}
    </div>
  );
}

const SCELTA =
  "flex cursor-pointer items-center justify-center border border-line px-3 py-2 text-xs text-ink-soft transition-colors hover:text-ink has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2";

function Scelte<T extends string>({
  legenda,
  nome,
  valore,
  scegli,
  opzioni,
}: {
  legenda: string;
  nome: string;
  valore: T;
  scegli: (v: T) => void;
  opzioni: [T, string][];
}) {
  return (
    <div role="radiogroup" aria-label={legenda}>
      <span className={LABEL}>{legenda}</span>
      <div className="mt-2 flex">
        {opzioni.map(([v, testo], i) => (
          <label key={v} className={`${SCELTA} ${i > 0 ? "-ml-px" : ""}`}>
            <input type="radio" name={nome} value={v} checked={valore === v} onChange={() => scegli(v)} className="sr-only" />
            {testo}
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * Una spunta di stato —pagata, consegnata— con quello che succede se resta
 * spenta. Correggendo una vendita porta anche il giorno, che una vendita nuova
 * prende da quello della vendita.
 */
function Spunta({
  nome,
  acceso,
  cambia,
  etichetta,
  spenta,
  data,
}: {
  nome: string;
  acceso: boolean;
  cambia: (v: boolean) => void;
  etichetta: string;
  spenta: string;
  data: { nome: string; valore: string; cambia: (v: string) => void } | null;
}) {
  const id = useId();
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
        <input
          id={id}
          type="checkbox"
          name={nome}
          checked={acceso}
          onChange={(e) => cambia(e.target.checked)}
          className="h-4 w-4 accent-[var(--color-ink)]"
        />
        {etichetta}
      </label>
      {acceso && data && (
        <label className="flex items-center gap-2 text-xs text-ink-faint">
          il
          <input
            type="date"
            name={data.nome}
            value={data.valore}
            onChange={(e) => data.cambia(e.target.value)}
            className="figures border-0 border-b border-line bg-transparent py-0.5 text-xs text-ink focus:border-ink focus:outline-none"
          />
        </label>
      )}
      {!acceso && <span className="text-xs text-accent">{spenta}</span>}
    </div>
  );
}
