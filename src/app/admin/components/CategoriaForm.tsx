"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import type { CategoriaAdmin } from "@/lib/categorie";
import type { EstadoFormulario } from "../actions";
import { cancellaCategoriaAzione, creaCategoriaAzione, salvaCategoriaAzione } from "../shop/actions";
import { CONTROL, LABEL } from "./campo";

/** Da nome a indirizzo, come per le opere e le stampe: segue il nome finché non lo si tocca. */
function aIndirizzo(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Una categoria dello Shop. Nuova: il nome e l'indirizzo, e basta, perché
 * tutto il resto —formati, prezzi, carrello— è quello di Stampe. Esistente:
 * il nome e se si vede nel sito. L'indirizzo non si cambia più, ed è detto
 * accanto al campo e non scoperto dopo.
 */
export default function CategoriaForm({ categoria, fissa = false }: { categoria?: CategoriaAdmin; fissa?: boolean }) {
  const [estado, azione, inCorso] = useActionState<EstadoFormulario, FormData>(
    categoria ? salvaCategoriaAzione : creaCategoriaAzione,
    {},
  );
  const base = useId();
  const [nome, setNome] = useState(categoria?.label ?? "");
  const [indirizzo, setIndirizzo] = useState(categoria?.slug ?? "");
  const [toccato, setToccato] = useState(false);
  const [confermaCancella, setConfermaCancella] = useState(false);

  const pubblicati = categoria ? categoria.prodotti - categoria.bozze : 0;
  const slug = categoria?.slug ?? indirizzo;

  return (
    <div className="grid gap-12 md:grid-cols-12 md:gap-16">
      <form action={azione} className="md:col-span-6">
        {categoria && <input type="hidden" name="slug" value={categoria.slug} />}

        <h1 className="display-lead font-display text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15]">
          {categoria ? categoria.label : "Nuova categoria"}
        </h1>
        {categoria && (
          <p className="figures mt-2 text-sm text-ink-faint">
            {!categoria.vendita
              ? "Su commissione: una pagina sola, che porta al modulo."
              : categoria.prodotti === 0
                ? "Ancora vuota."
                : `${categoria.prodotti} ${categoria.prodotti === 1 ? "prodotto" : "prodotti"}, ${pubblicati} ${
                    pubblicati === 1 ? "pubblicato" : "pubblicati"
                  }.`}
          </p>
        )}

        {estado.error && (
          <p role="alert" className="nota mt-5">
            {estado.error}
          </p>
        )}

        <div className="mt-8 space-y-7">
          <div className="group/campo">
            <label htmlFor={`${base}-n`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
              Nome
            </label>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
              Come esce nel menu, nel footer e sulla porta dello Shop.
            </p>
            <input
              id={`${base}-n`}
              name="label"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                if (!categoria && !toccato) setIndirizzo(aIndirizzo(e.target.value));
              }}
              placeholder="Calendario 2027"
              maxLength={60}
              required
              autoComplete="off"
              className={`${CONTROL} mt-2`}
            />
          </div>

          <div className="group/campo">
            <label htmlFor={`${base}-s`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
              Indirizzo
            </label>
            {categoria ? (
              <>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
                  Non si cambia: è nel link di tutto quello che contiene.
                </p>
                <p id={`${base}-s`} className="mt-2 border-b border-line py-2.5 text-sm tracking-[0.01em] text-ink-soft">
                  /shop/{categoria.slug}
                </p>
              </>
            ) : (
              <>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
                  Quello che va dopo /shop/. Minuscole, numeri e trattini. Dopo non si cambia più:
                  sceglilo pensando a un link che resta.
                </p>
                <input
                  id={`${base}-s`}
                  name="slug"
                  value={indirizzo}
                  onChange={(e) => {
                    setToccato(true);
                    setIndirizzo(e.target.value);
                  }}
                  placeholder="calendario-2027"
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  autoComplete="off"
                  spellCheck={false}
                  className={`${CONTROL} mt-2 text-sm tracking-[0.01em]`}
                />
              </>
            )}
          </div>

          {categoria && (
            <label className="flex cursor-pointer items-start gap-3 border-t border-line pt-6">
              <input
                type="checkbox"
                name="visibile"
                defaultChecked={categoria.visibile}
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-accent)]"
              />
              <span>
                <span className="block text-sm text-ink">Nel menu e nello Shop</span>
                <span className="mt-1 block text-xs leading-relaxed text-ink-faint">
                  {categoria.vendita && pubblicati === 0
                    ? "Non ha ancora niente di pubblicato: accesa, la sua pagina dirà che non c’è niente in vendita. Meglio accenderla quando c’è."
                    : "Senza spunta resta tutto com’è, ma nel sito non esce: né nel menu, né fra le porte, né su Google."}
                </span>
              </span>
            </label>
          )}
        </div>

        <div className="sticky bottom-0 z-10 -mx-[var(--gutter)] mt-12 flex items-center gap-6 border-t border-line bg-paper/95 px-[var(--gutter)] py-4 backdrop-blur-sm md:mx-0 md:px-0">
          <button
            type="submit"
            disabled={inCorso}
            className="whitespace-nowrap bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {inCorso ? "Salvataggio…" : categoria ? "Salva le modifiche" : "Crea la categoria"}
          </button>
          <Link href="/admin/shop" className="link-underline text-sm text-ink-soft transition-colors hover:text-ink">
            Annulla
          </Link>
        </div>
      </form>

      <div className="md:col-span-4 md:col-start-9">
        <h2 className="label">Come funziona</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
          {categoria && !categoria.vendita ? (
            <>
              <li>È uno dei due lavori su commissione: non ha prodotti né prezzi.</li>
              <li>
                Il testo e le immagini della sua pagina si cambiano in{" "}
                <Link
                  href={`/admin/shop/servizi/${categoria.slug}`}
                  className="link-underline text-ink transition-colors hover:text-accent"
                >
                  Su commissione
                </Link>
                .
              </li>
            </>
          ) : (
            <>
              <li>Funziona come Stampe: ogni prodotto ha i suoi formati, con il prezzo, e va nel carrello.</li>
              <li>
                La sua pagina è{" "}
                <span className="break-all text-xs tracking-[0.01em] text-ink">/shop/{slug || "…"}</span>, e ogni
                prodotto ha la sua sotto.
              </li>
              {!categoria && (
                <li>
                  Nasce nascosta e in fondo al menu. La riempi con calma, e la accendi quando è pronta.
                </li>
              )}
              <li>I codici sconto e gli sconti di stagione valgono anche qui, come sulle stampe.</li>
            </>
          )}
          <li>La copertina della sua porta si sceglie in Copertine, come per le altre.</li>
        </ul>

        {categoria && !fissa && (
          <div className="mt-10 border-t border-line pt-4">
            {categoria.prodotti > 0 ? (
              <p className="text-xs leading-relaxed text-ink-faint">
                Per cancellarla, prima sposta in un&apos;altra categoria o cancella{" "}
                {categoria.prodotti === 1 ? "il suo prodotto" : `i suoi ${categoria.prodotti} prodotti`}. Per
                toglierla dal sito e basta, togli la spunta «Nel menu».
              </p>
            ) : confermaCancella ? (
              <form action={cancellaCategoriaAzione}>
                <input type="hidden" name="slug" value={categoria.slug} />
                <p className="text-xs leading-relaxed text-ink">
                  Si cancella «{categoria.label}», con la sua copertina. Non si può disfare.
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
                    Lasciala
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setConfermaCancella(true)}
                className="area-tocco link-underline text-xs text-ink-faint transition-colors hover:text-accent"
              >
                Cancella la categoria
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
