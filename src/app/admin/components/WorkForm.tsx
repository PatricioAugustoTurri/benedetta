"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { guardarObra, type EstadoFormulario } from "../actions";
import CampoImmagini, { type StatoImmagini } from "./CampoImmagini";
import { CONTROL, LABEL } from "./campo";
import { MAX_ARCHIVO_MB, MAX_VIDEO_MB } from "@/lib/limites";
import type { Work } from "@/lib/works";

/**
 * Da un titolo a un indirizzo.
 *
 * È una proposta, non un'imposizione: il campo resta modificabile e smette di
 * seguire il titolo appena qualcuno lo tocca a mano. Un'opera già salvata non
 * lo ricalcola mai —il suo indirizzo può essere stato condiviso— quindi questo
 * gira solo mentre si carica un'opera nuova.
 */
function aDireccion(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function WorkForm({ obra }: { obra?: Work }) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(guardarObra, {});
  const idBase = useId();

  const [titulo, setTitulo] = useState(obra?.title ?? "");
  const [direccion, setDireccion] = useState(obra?.slug ?? "");
  // Un'opera salvata non segue il titolo; una nuova sì, finché non la toccano.
  const [direccionTocada, setDireccionTocada] = useState(Boolean(obra));

  const [statoImmagini, setStatoImmagini] = useState<StatoImmagini>({
    subiendo: false,
    falladas: 0,
    pesadas: 0,
  });
  const { subiendo, falladas, pesadas } = statoImmagini;
  const bloqueado = subiendo || falladas > 0 || pesadas > 0;

  return (
    <form action={enviar} className="grid gap-12 md:grid-cols-12 md:gap-16">
      {obra && <input type="hidden" name="id" value={obra.id} />}

      {/* --------------------------------------------- la scheda, 7 colonne */}
      <div className="md:col-span-7">
        <h1 className="display-lead font-display text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15]">
          {obra ? obra.title : "Nuova opera"}
        </h1>

        {/*
          L'avviso sulle immagini va prima dell'errore del server perché si
          vede senza aver inviato niente: corregge il problema invece di
          segnalarlo dopo che l'invio è fallito.
        */}
        {(falladas > 0 || pesadas > 0) && (
          <p
            role="alert"
            className="mt-5 nota"
          >
            {pesadas > 0
              ? `${pesadas === 1 ? "Un file supera" : `${pesadas} file superano`} il peso massimo: ${MAX_ARCHIVO_MB} MB per le immagini, ${MAX_VIDEO_MB} MB per i video. Esportali più leggeri e riscegli.`
              : `${falladas === 1 ? "Un file non è stato caricato" : `${falladas} file non sono stati caricati`}. Toglili e riprova, oppure controlla il dettaglio sotto ognuno.`}
          </p>
        )}

        {estado.error && (
          /*
            L'errore va in cima a tutto e non sotto il pulsante: se comparisse
            in fondo a un modulo lungo, chi l'ha inviato da metà pagina non lo
            vedrebbe mai. `role="alert"` fa sì che si annunci da solo.
          */
          <p
            role="alert"
            className="mt-5 nota"
          >
            {estado.error}
          </p>
        )}

        <div className="mt-8 space-y-7">
          <div className="group/campo">
            <label htmlFor={`${idBase}-title`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
              Titolo
            </label>
            <input
              id={`${idBase}-title`}
              name="title"
              value={titulo}
              onChange={(e) => {
                setTitulo(e.target.value);
                if (!direccionTocada) setDireccion(aDireccion(e.target.value));
              }}
              required
              autoComplete="off"
              className={`${CONTROL} mt-2`}
            />
          </div>

          <div className="group/campo">
            <label htmlFor={`${idBase}-slug`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
              Indirizzo
            </label>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
              Quello che va dopo /opera/. Minuscole, numeri e trattini. Se l&apos;opera è già
              stata condivisa, non cambiarlo: il link vecchio smetterebbe di funzionare.
            </p>
            <input
              id={`${idBase}-slug`}
              name="slug"
              value={direccion}
              onChange={(e) => {
                setDireccionTocada(true);
                setDireccion(e.target.value);
              }}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              autoComplete="off"
              className={`${CONTROL} mt-2 text-sm tracking-[0.01em]`}
            />
          </div>

          <div className="grid gap-7 sm:grid-cols-2">
            <div className="group/campo">
              <label htmlFor={`${idBase}-year`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
                Anno
              </label>
              <input
                id={`${idBase}-year`}
                name="year"
                type="number"
                inputMode="numeric"
                min={1900}
                max={2200}
                defaultValue={obra?.year ?? new Date().getFullYear()}
                required
                className={`${CONTROL} figures mt-2`}
              />
            </div>

            <div className="group/campo">
              <label
                htmlFor={`${idBase}-tecnica`}
                className={`${LABEL} group-has-[:focus]/campo:text-ink`}
              >
                Tecnica
              </label>
              <input
                id={`${idBase}-tecnica`}
                name="tecnica"
                defaultValue={obra?.tecnica ?? ""}
                required
                autoComplete="off"
                placeholder="Acquerello e inchiostro"
                className={`${CONTROL} mt-2`}
              />
            </div>
          </div>

          <div className="group/campo">
            <label
              htmlFor={`${idBase}-description`}
              className={`${LABEL} group-has-[:focus]/campo:text-ink`}
            >
              Testo
            </label>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
              Il contesto della commissione, per la pagina dell&apos;opera. Può restare vuoto.
            </p>
            <textarea
              id={`${idBase}-description`}
              name="description"
              rows={5}
              defaultValue={obra?.description ?? ""}
              className={`${CONTROL} mt-2 field-sizing-content resize-y leading-relaxed`}
            />
          </div>
        </div>

        {/* --------------------------------------------------- immagini */}
        <CampoImmagini
          iniziali={obra?.image}
          onStato={setStatoImmagini}
          nota={
            <>
              Il primo pezzo è la copertina: quello che esce nella griglia dell&apos;archivio.
              Ognuno sale su Cloudinary appena lo scegli, e da lì escono larghezza e altezza:
              non serve inserirle. I video vanno in MP4, fino a {MAX_VIDEO_MB} MB, e sul sito
              girano in loop senza audio.
            </>
          }
        />

        {/* ------------------------------------------------------ invio */}
        <div className="mt-10 flex items-center gap-6 border-t border-line pt-6">
          <button
            type="submit"
            disabled={enviando || bloqueado}
            className="bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {enviando
              ? "Salvataggio…"
              : subiendo
                ? "Caricamento in corso…"
                : obra
                  ? "Salva le modifiche"
                  : "Carica l'opera"}
          </button>

          <Link
            href="/admin"
            className="link-underline text-sm text-ink-soft transition-colors hover:text-ink"
          >
            Annulla
          </Link>
        </div>
      </div>

      {/* ------------------------------------------ la colonna laterale, col 9 */}
      <div className="md:col-span-3 md:col-start-9">
        <h2 className="label">Dove uscirà</h2>
        <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
          <li>Nella griglia della home, con il primo pezzo in verticale 4:5.</li>
          <li>
            Nella sua pagina:{" "}
            <span className="break-all text-xs tracking-[0.01em] text-ink">
              /opera/{direccion || "…"}
            </span>
          </li>
        </ul>

        {obra && (
          <p className="mt-6 border-t border-line pt-4 text-xs text-ink-faint">
            Caricata come{" "}
            <span className="figures text-ink-soft">#{obra.id}</span> nell&apos;archivio.
          </p>
        )}
      </div>
    </form>
  );
}
