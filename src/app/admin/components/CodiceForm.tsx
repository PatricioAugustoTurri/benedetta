"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { FORMATI_BASE, prezzo, prezzoScontato } from "@/data/shop";
import type { Codice } from "@/lib/codici";
import type { EstadoFormulario } from "../actions";
import { cancellaCodiceAzione, salvaCodiceAzione } from "../shop/actions";
import { CONTROL, LABEL } from "./campo";

/**
 * Un codice sconto: la parola, la percentuale e se vale.
 *
 * Sotto la percentuale si vede subito cosa paga chi lo usa sul listino base,
 * così il 15% si giudica in euro e non in astratto, come negli sconti di
 * stagione.
 */
export default function CodiceForm({ codice }: { codice?: Codice }) {
  const [estado, azione, inCorso] = useActionState<EstadoFormulario, FormData>(salvaCodiceAzione, {});
  const base = useId();
  const [scritto, setScritto] = useState(codice?.codice ?? "");
  const [percentuale, setPercentuale] = useState(codice?.percentuale ?? 15);
  const [confermaCancella, setConfermaCancella] = useState(false);
  const valida = Number.isInteger(percentuale) && percentuale >= 1 && percentuale <= 90;
  // Cambiare la parola di un codice che è già sui biglietti spediti li spegne.
  const rinominato = Boolean(codice) && scritto.replace(/\s+/g, "").toUpperCase() !== codice?.codice;

  return (
    <div className="grid gap-12 md:grid-cols-12 md:gap-16">
      <form action={azione} className="md:col-span-6">
        {codice && <input type="hidden" name="id" value={codice.id} />}

        <h1 className="display-lead font-display text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15]">
          {codice ? codice.codice : "Nuovo codice"}
        </h1>
        {codice && (
          <p className="figures mt-2 text-sm text-ink-faint">
            {codice.usatoOrdineId !== null
              ? `Usato nell’ordine #${codice.usatoOrdineId}: non vale più.`
              : codice.usi === 0
                ? "Ancora nessun ordine con questo codice."
                : codice.usi === 1
                  ? "Usato in 1 ordine."
                  : `Usato in ${codice.usi} ordini.`}
          </p>
        )}

        {estado.error && (
          <p role="alert" className="nota mt-5">
            {estado.error}
          </p>
        )}

        <div className="mt-8 space-y-7">
          <div className="group/campo">
            <label htmlFor={`${base}-c`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
              Codice
            </label>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
              Lettere, numeri e trattini. Chi compra può scriverlo in minuscolo: vale lo stesso.
            </p>
            <input
              id={`${base}-c`}
              name="codice"
              value={scritto}
              onChange={(e) => setScritto(e.target.value)}
              placeholder="BENZIBET98"
              maxLength={30}
              required
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-describedby={rinominato ? `${base}-avviso` : undefined}
              className={`${CONTROL} figures mt-2 tracking-[0.06em] uppercase`}
            />
            {rinominato && (
              <p id={`${base}-avviso`} className="mt-2 text-xs leading-relaxed text-accent">
                I biglietti già spediti con «{codice?.codice}» smetteranno di valere.
              </p>
            )}
          </div>

          <div className="group/campo max-w-48">
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

          <div className="group/campo max-w-64">
            <label htmlFor={`${base}-s`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
              Scade il
            </label>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
              Facoltativo. L&apos;ultimo giorno in cui vale, compreso. Vuota: non scade.
            </p>
            <input
              id={`${base}-s`}
              name="scade"
              type="date"
              defaultValue={codice?.scade ?? ""}
              className={`${CONTROL} figures mt-2`}
            />
          </div>

          {/* Il listino base con il codice: quello che si paga davvero. */}
          <dl className="border-t border-line">
            {FORMATI_BASE.map((f) => (
              <div key={f.formato} className="flex items-baseline justify-between gap-6 border-b border-line py-2.5">
                <dt className="text-sm text-ink-soft">{f.formato}</dt>
                <dd className="figures text-sm">
                  <span className="text-ink-faint line-through">{prezzo(f.prezzo)}</span>
                  <span className="ml-3 text-ink">
                    {valida ? prezzo(prezzoScontato(f.prezzo, percentuale)) : "—"}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="monouso"
              defaultChecked={codice?.monouso ?? false}
              className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-accent)]"
            />
            <span>
              <span className="block text-sm text-ink">Vale una volta sola</span>
              <span className="mt-1 block text-xs leading-relaxed text-ink-faint">
                Per un codice personale, da regalare a una persona: dopo il primo ordine resta qui,
                segnato, e non vale più. Senza spunta vale per tutti, quante volte vogliono.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="attivo"
              defaultChecked={codice?.attivo ?? true}
              className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-accent)]"
            />
            <span>
              <span className="block text-sm text-ink">Acceso</span>
              <span className="mt-1 block text-xs leading-relaxed text-ink-faint">
                Togli la spunta per fermarlo senza cancellarlo: chi lo scrive saprà che non vale più.
              </span>
            </span>
          </label>
        </div>

        <div className="sticky bottom-0 z-10 -mx-[var(--gutter)] mt-12 flex items-center gap-6 border-t border-line bg-paper/95 px-[var(--gutter)] py-4 backdrop-blur-sm md:mx-0 md:px-0">
          <button
            type="submit"
            disabled={inCorso}
            className="whitespace-nowrap bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {inCorso ? "Salvataggio…" : "Salva il codice"}
          </button>
          <Link href="/admin/shop" className="link-underline text-sm text-ink-soft transition-colors hover:text-ink">
            Annulla
          </Link>
        </div>
      </form>

      <div className="md:col-span-4 md:col-start-9">
        <h2 className="label">Come funziona</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
          <li>Chi compra lo scrive nel carrello, sotto la spedizione, prima di andare a pagare.</li>
          <li>Vale sulle stampe, non sulla spedizione.</li>
          <li>
            Non si somma agli sconti di stagione: le stampe già scontate restano al loro prezzo.
          </li>
          <li>
            Senza «una volta sola» vale per tutti, in più ordini, finché è acceso e non è scaduto.
          </li>
          <li>
            I biglietti degli ordini non sono qui: ogni ordine ha il suo, e si cambia dalla pagina
            Ordini.
          </li>
          <li>Nella pagina di Stripe e nella ricevuta compare come riga a sé.</li>
        </ul>

        {codice && (
          <div className="mt-10 border-t border-line pt-4">
            {confermaCancella ? (
              <form action={cancellaCodiceAzione}>
                <input type="hidden" name="id" value={codice.id} />
                <p className="text-xs leading-relaxed text-ink">
                  Si cancella «{codice.codice}». Gli ordini fatti con questo codice lo ricordano, ma non si può
                  disfare. Per fermarlo e basta, togli la spunta «Acceso».
                </p>
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
                Cancella il codice
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
