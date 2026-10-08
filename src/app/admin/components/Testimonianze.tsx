"use client";

import { useActionState, useId, useRef } from "react";
import { Trash } from "@/components/Icon";
import type { Testimonianza } from "@/lib/testimonianze";
import type { EstadoFormulario } from "../actions";
import { aggiungiTestimonianzaAzione, cancellaTestimonianzaAzione } from "../shop/actions";
import { CONTROL, LABEL } from "./campo";

/**
 * Le testimonianze di un servizio, nell'admin: quelle che ci sono, ognuna con
 * il suo cestino, e il modulo per aggiungerne una. Si copiano da quello che le
 * hanno scritto —mail, messaggi, recensioni— con il permesso di chi le ha
 * scritte.
 */
export default function Testimonianze({ servizio, lista }: { servizio: string; lista: Testimonianza[] }) {
  const modulo = useRef<HTMLFormElement>(null);
  const [esito, azione, inCorso] = useActionState<EstadoFormulario, FormData>(async (p, fd) => {
    const r = await aggiungiTestimonianzaAzione(p, fd);
    if (r.ok) modulo.current?.reset();
    return r;
  }, {});
  const base = useId();

  return (
    <section aria-labelledby={`${base}-h`} className="mt-16 grid gap-12 border-t border-line pt-10 md:grid-cols-12 md:gap-16">
      <div className="md:col-span-7">
        <h2 id={`${base}-h`} className="display-section font-display text-xl leading-tight">
          Testimonianze
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">
          Escono nella pagina del servizio, dalla più recente. Senza testimonianze la sezione non si vede.
        </p>

        {lista.length > 0 && (
          <ul className="mt-5 border-t border-line">
            {lista.map((t) => (
              <li key={t.id} className="flex gap-4 border-b border-line py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed text-ink">«{t.testo}»</p>
                  <p className="mt-1.5 text-xs text-ink-faint">
                    {t.autore}
                    {t.dettaglio && ` · ${t.dettaglio}`}
                  </p>
                </div>
                <form action={cancellaTestimonianzaAzione}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="servizio" value={servizio} />
                  <button
                    type="submit"
                    title="Cancella"
                    className="flex h-8 w-8 items-center justify-center text-ink-faint transition-colors hover:text-accent"
                  >
                    <span className="sr-only">Cancella la testimonianza di {t.autore}</span>
                    <Trash size={15} />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form ref={modulo} action={azione} className="mt-8 space-y-6">
          <input type="hidden" name="servizio" value={servizio} />
          <div className="group/campo">
            <label htmlFor={`${base}-t`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
              Cosa ti hanno scritto
            </label>
            <textarea
              id={`${base}-t`}
              name="testo"
              rows={3}
              maxLength={800}
              required
              className={`${CONTROL} mt-2 field-sizing-content resize-y text-sm leading-relaxed`}
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="group/campo">
              <label htmlFor={`${base}-a`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
                Chi
              </label>
              <input id={`${base}-a`} name="autore" maxLength={80} required placeholder="Giulia" autoComplete="off" className={`${CONTROL} mt-1 py-1.5 text-sm`} />
            </div>
            <div className="group/campo">
              <label htmlFor={`${base}-d`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
                Dettaglio
              </label>
              <input id={`${base}-d`} name="dettaglio" maxLength={80} placeholder="Ritratto di famiglia, 2025" autoComplete="off" className={`${CONTROL} mt-1 py-1.5 text-sm`} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={inCorso}
              className="border border-ink bg-ink px-4 py-2 text-xs text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {inCorso ? "Un momento…" : "Aggiungi la testimonianza"}
            </button>
            {esito.error && <p role="alert" className="text-xs text-accent">{esito.error}</p>}
            {esito.ok && <p role="status" className="text-xs text-ink-soft">Aggiunta.</p>}
          </div>
        </form>
      </div>
    </section>
  );
}
