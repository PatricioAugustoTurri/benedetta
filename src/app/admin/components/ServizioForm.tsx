"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { MAX_ARCHIVO_MB, MAX_VIDEO_MB } from "@/lib/limites";
import type { Servizio } from "@/lib/servizi";
import type { EstadoFormulario } from "../actions";
import { guardaServizio } from "../shop/actions";
import CampoImmagini, { type StatoImmagini } from "./CampoImmagini";
import { CONTROL, LABEL } from "./campo";

/**
 * Il modulo di un servizio: Illustrazioni Personalizzate o Ritratti
 * Illustrati.
 *
 * Più corto di quello di una stampa perché un servizio non ha niente da
 * vendere: nome, testo e immagini. Non c'è l'indirizzo —è fisso, è la
 * categoria— né la pubblicazione: il servizio esiste sempre, e quello che si
 * fa qui è aggiornare come si mostra.
 *
 * Il testo è il cuore della pagina: è quello che chi vuole un ritratto legge
 * prima di scriverle. Per questo il campo è grande, e una riga vuota lo
 * divide in paragrafi nella pagina.
 */
export default function ServizioForm({ servizio }: { servizio: Servizio }) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(guardaServizio, {});
  const idBase = useId();
  const [statoImmagini, setStatoImmagini] = useState<StatoImmagini>({
    subiendo: false,
    falladas: 0,
    pesadas: 0,
  });
  const { subiendo, falladas, pesadas } = statoImmagini;
  const bloqueado = subiendo || falladas > 0 || pesadas > 0;

  return (
    <form action={enviar} className="grid gap-12 md:grid-cols-12 md:gap-16">
      <input type="hidden" name="slug" value={servizio.slug} />

      <div className="md:col-span-7">
        <h1 className="display-lead font-display text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15]">
          {servizio.title}
        </h1>

        {(falladas > 0 || pesadas > 0) && (
          <p
            role="alert"
            className="mt-5 border-l border-accent bg-paper-deep/60 py-2 pl-3 text-sm text-accent"
          >
            {pesadas > 0
              ? `Un file supera il peso massimo: ${MAX_ARCHIVO_MB} MB per le immagini, ${MAX_VIDEO_MB} MB per i video.`
              : "Un file non è stato caricato. Toglilo e riprova."}
          </p>
        )}

        {estado.error && (
          <p
            role="alert"
            className="mt-5 border-l border-accent bg-paper-deep/60 py-2 pl-3 text-sm text-accent"
          >
            {estado.error}
          </p>
        )}

        <div className="mt-8 space-y-7">
          <div className="group/campo">
            <label htmlFor={`${idBase}-title`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
              Nome
            </label>
            <input
              id={`${idBase}-title`}
              name="title"
              defaultValue={servizio.title}
              required
              autoComplete="off"
              className={`${CONTROL} mt-2`}
            />
          </div>

          <div className="group/campo">
            <label
              htmlFor={`${idBase}-description`}
              className={`${LABEL} group-has-[:focus]/campo:text-ink`}
            >
              Testo
            </label>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
              Di cosa si tratta e come funziona: è quello che si legge prima di scriverti. Lascia
              una riga vuota per andare a capo con un paragrafo nuovo.
            </p>
            <textarea
              id={`${idBase}-description`}
              name="description"
              rows={10}
              defaultValue={servizio.description ?? ""}
              className={`${CONTROL} mt-2 field-sizing-content resize-y leading-relaxed`}
            />
          </div>
        </div>

        <CampoImmagini
          iniziali={servizio.image}
          onStato={setStatoImmagini}
          nota={
            <>
              Il primo pezzo è la copertina: quello che esce nello Shop, in verticale 4:5. Gli
              altri si vedono nella pagina del servizio. Cambiale quando vuoi rinnovarla.
            </>
          }
        />

        <div className="mt-10 flex items-center gap-6 border-t border-line pt-6">
          <button
            type="submit"
            disabled={enviando || bloqueado}
            className="bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {enviando ? "Salvataggio…" : subiendo ? "Caricamento in corso…" : "Salva le modifiche"}
          </button>
          <Link
            href="/admin/shop"
            className="link-underline text-sm text-ink-soft transition-colors hover:text-ink"
          >
            Annulla
          </Link>
        </div>
      </div>

      <aside className="md:col-span-3 md:col-start-9">
        <h2 className="label">Dove uscirà</h2>
        <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
          <li>Nello Shop, fra i lavori su commissione.</li>
          <li>
            Nella sua pagina:{" "}
            <span className="break-all text-xs tracking-[0.01em] text-ink">/shop/{servizio.slug}</span>
          </li>
          <li>Con «Chiedi info», che porta al modulo di contatto con il nome già scritto.</li>
        </ul>
        <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-ink-faint">
          I servizi sono due e sempre gli stessi: non si aggiungono né si cancellano. Qui si
          cambia solo come si mostrano.
        </p>
      </aside>
    </form>
  );
}
