"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { prezzo, prezzoScontato } from "@/data/shop";
import type { Sconto } from "@/lib/sconti";
import type { EstadoFormulario } from "../actions";
import { cancellaScontoAzione, salvaScontoAzione } from "../shop/actions";
import { CONTROL, LABEL } from "./campo";

/** Una stampa nel selettore: quello che serve per riconoscerla e calcolarne il prezzo. */
export type StampaSceglibile = {
  id: number;
  title: string;
  immagine: string | null;
  /** Il prezzo più basso, in centesimi. */
  minimo: number | null;
  pubblicato: boolean;
};

function miniatura(url: string): string {
  return url.includes("res.cloudinary.com")
    ? url.replace("/upload/", "/upload/c_fill,g_auto,w_240,h_300,q_auto,f_auto/")
    : url;
}

/**
 * Uno sconto di stagione: il nome, la percentuale, le due date e le stampe.
 *
 * Le stampe si scelgono toccandole nella griglia, e il numero sull'angolo è
 * l'ordine in cui usciranno nello Shop: la prima toccata è la prima. Sotto
 * ognuna scelta si vede subito il prezzo scontato, così la percentuale si
 * giudica in euro e non in astratto.
 */
export default function ScontoForm({
  sconto,
  stampe,
}: {
  sconto?: Sconto;
  stampe: StampaSceglibile[];
}) {
  const [estado, azione, inCorso] = useActionState<EstadoFormulario, FormData>(salvaScontoAzione, {});
  const base = useId();
  const [scelte, setScelte] = useState<number[]>(sconto?.stampe ?? []);
  const [percentuale, setPercentuale] = useState(sconto?.percentuale ?? 20);
  const [confermaCancella, setConfermaCancella] = useState(false);

  const cambia = (id: number) =>
    setScelte((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const pubblicate = stampe.filter((s) => s.pubblicato);
  const valida = Number.isInteger(percentuale) && percentuale >= 1 && percentuale <= 90;

  return (
    <div className="grid gap-12 md:grid-cols-12 md:gap-16">
      <form action={azione} className="md:col-span-8">
        {sconto && <input type="hidden" name="id" value={sconto.id} />}
        <input type="hidden" name="stampe" value={JSON.stringify(scelte)} />

        <h1 className="display-lead font-display text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15]">
          {sconto ? sconto.titolo : "Nuovo sconto"}
        </h1>

        {estado.error && (
          <p role="alert" className="nota mt-5">
            {estado.error}
          </p>
        )}

        <div className="mt-8 space-y-7">
          <div className="group/campo">
            <label htmlFor={`${base}-t`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
              Nome
            </label>
            <input
              id={`${base}-t`}
              name="titolo"
              defaultValue={sconto?.titolo ?? ""}
              placeholder="Sconti di Natale"
              maxLength={80}
              required
              autoComplete="off"
              className={`${CONTROL} mt-2`}
            />
          </div>

          <div className="group/campo">
            <label htmlFor={`${base}-x`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
              Testo
            </label>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
              Facoltativo. Una o due righe sotto il nome.
            </p>
            <textarea
              id={`${base}-x`}
              name="testo"
              rows={2}
              maxLength={400}
              defaultValue={sconto?.testo ?? ""}
              placeholder="Le stampe da regalare, a un prezzo speciale fino alla Vigilia."
              className={`${CONTROL} mt-2 field-sizing-content resize-y leading-relaxed`}
            />
          </div>

          <div className="grid gap-7 sm:grid-cols-3">
            <div className="group/campo">
              <label htmlFor={`${base}-p`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
                Sconto
              </label>
              <div className="mt-2 flex items-baseline gap-1 border-b border-line transition-colors focus-within:border-ink">
                <span className="text-ink-faint">−</span>
                <input
                  id={`${base}-p`}
                  name="percentuale"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={90}
                  required
                  value={Number.isNaN(percentuale) ? "" : percentuale}
                  onChange={(e) => setPercentuale(e.target.valueAsNumber)}
                  className="figures w-full border-0 bg-transparent py-2.5 text-base text-ink outline-none"
                />
                <span className="text-ink-faint">%</span>
              </div>
            </div>
            <div className="group/campo">
              <label htmlFor={`${base}-d`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
                Dal
              </label>
              <input
                id={`${base}-d`}
                name="dal"
                type="date"
                required
                defaultValue={sconto?.dal ?? ""}
                className={`${CONTROL} mt-2`}
              />
            </div>
            <div className="group/campo">
              <label htmlFor={`${base}-a`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
                Al (compreso)
              </label>
              <input
                id={`${base}-a`}
                name="al"
                type="date"
                required
                defaultValue={sconto?.al ?? ""}
                className={`${CONTROL} mt-2`}
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="attivo"
              defaultChecked={sconto?.attivo ?? true}
              className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-accent)]"
            />
            <span>
              <span className="block text-sm text-ink">Acceso</span>
              <span className="mt-1 block text-xs leading-relaxed text-ink-faint">
                Si accende da solo il primo giorno e si spegne dopo l&apos;ultimo. Togli la spunta per
                fermarlo prima, senza cancellarlo.
              </span>
            </span>
          </label>
        </div>

        {/* ------------------------------------------------------ le stampe */}
        <div className="mt-12 border-t border-line pt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="label text-ink">Stampe in sconto</h2>
            <div className="flex items-baseline gap-4 text-xs">
              <span className="figures text-ink-faint">
                {scelte.length === 1 ? "1 scelta" : `${scelte.length} scelte`}
              </span>
              <button
                type="button"
                onClick={() => setScelte(pubblicate.map((s) => s.id))}
                className="area-tocco link-underline text-ink-soft transition-colors hover:text-ink"
              >
                Tutte
              </button>
              <button
                type="button"
                onClick={() => setScelte([])}
                className="area-tocco link-underline text-ink-soft transition-colors hover:text-ink"
              >
                Nessuna
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
            Toccale nell&apos;ordine in cui vuoi che escano: il numero è il loro posto.
          </p>

          <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {stampe.map((s) => {
              const posto = scelte.indexOf(s.id);
              const scelta = posto !== -1;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => cambia(s.id)}
                    aria-pressed={scelta}
                    className="group block w-full text-left focus-visible:outline-none"
                  >
                    <span
                      className={`relative block overflow-hidden bg-paper-deep outline-offset-2 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-ink ${
                        scelta ? "outline outline-2 outline-accent" : ""
                      }`}
                    >
                      {s.immagine && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={miniatura(s.immagine)}
                          alt=""
                          loading="lazy"
                          className={`aspect-[4/5] w-full object-cover transition-opacity ${
                            scelta ? "" : "opacity-70 group-hover:opacity-100"
                          }`}
                        />
                      )}
                      {scelta && (
                        <span className="figures absolute top-1.5 left-1.5 flex h-5 min-w-5 items-center justify-center bg-accent px-1 text-[0.6875rem] text-paper">
                          {posto + 1}
                        </span>
                      )}
                    </span>
                    <span className="mt-1.5 block truncate text-xs text-ink">{s.title}</span>
                    <span className="figures block truncate text-xs text-ink-faint">
                      {!s.pubblicato
                        ? "Bozza: non esce"
                        : s.minimo === null
                          ? "—"
                          : scelta && valida
                            ? `da ${prezzo(s.minimo)} → ${prezzo(prezzoScontato(s.minimo, percentuale))}`
                            : `da ${prezzo(s.minimo)}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="sticky bottom-0 z-10 -mx-[var(--gutter)] mt-12 flex items-center gap-6 border-t border-line bg-paper/95 px-[var(--gutter)] py-4 backdrop-blur-sm md:mx-0 md:px-0">
          <button
            type="submit"
            disabled={inCorso}
            className="whitespace-nowrap bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {inCorso ? "Salvataggio…" : "Salva lo sconto"}
          </button>
          <Link href="/admin/shop" className="link-underline text-sm text-ink-soft transition-colors hover:text-ink">
            Annulla
          </Link>
        </div>
      </form>

      <div className="md:col-span-3 md:col-start-10">
        <h2 className="label">Come funziona</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
          <li>Nello Shop esce una sezione sotto le categorie, con il nome, lo sconto e le stampe scelte.</li>
          <li>
            Il prezzo scontato vale davvero: nella scheda della stampa, nel carrello e nel pagamento.
          </li>
          <li>Puoi prepararlo prima: resta programmato e si accende da solo il primo giorno.</li>
        </ul>
        <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-ink-faint">
          Per legge, il prezzo barrato deve essere il più basso degli ultimi 30 giorni: non cambiare il
          prezzo di queste stampe nel mese prima dello sconto.
        </p>

        {sconto && (
          <div className="mt-10 border-t border-line pt-4">
            {confermaCancella ? (
              <form action={cancellaScontoAzione}>
                <input type="hidden" name="id" value={sconto.id} />
                <p className="text-xs text-ink">Si cancella «{sconto.titolo}». Non si può disfare.</p>
                <div className="mt-2.5 flex gap-4 text-xs">
                  <button type="submit" className="link-underline text-accent">
                    Cancella
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfermaCancella(false)}
                    className="link-underline text-ink-soft hover:text-ink"
                  >
                    Lascialo
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setConfermaCancella(true)}
                className="area-tocco link-underline text-xs text-ink-faint transition-colors hover:text-accent"
              >
                Cancella lo sconto
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
