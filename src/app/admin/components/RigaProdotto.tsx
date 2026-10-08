"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Pencil, Trash } from "@/components/Icon";
import { prezzo, prodottoHref } from "@/data/shop";
import type { Prodotto } from "@/lib/prodotti";
import { immagineFerma } from "@/lib/video";
import { cancellaProdotto, spostaProdottoAzione } from "../shop/actions";

/**
 * Un prodotto nella lista dell'admin: copertina, nome, stato, listino, e i
 * controlli a destra.
 *
 * Una riga e non una cella di griglia come le opere: qui quello da giudicare
 * non è come sta l'immagine accanto alle altre, ma se il prodotto è
 * pubblicato e a quanto si vende. Sono parole e cifre, e si leggono meglio in
 * fila.
 *
 * La cancellazione chiede conferma sulla riga stessa, come quella delle opere:
 * si vede cosa si sta per cancellare mentre si decide.
 */
export default function RigaProdotto({
  prodotto: p,
  primo,
  ultimo,
}: {
  prodotto: Prodotto;
  primo: boolean;
  ultimo: boolean;
}) {
  const [confermando, setConfermando] = useState(false);
  const portada = p.image[0];

  return (
    <li className="border-b border-line py-4">
      <div className="flex items-center gap-4">
        <Link href={`/admin/shop/${p.id}`} className="block w-14 shrink-0 bg-paper-deep" tabIndex={-1} aria-hidden="true">
          {portada && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={immagineFerma(portada)} alt="" className="aspect-[4/5] w-full object-cover" />
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Link
              href={`/admin/shop/${p.id}`}
              className="area-tocco link-underline text-[0.9375rem] text-ink transition-colors hover:text-accent"
            >
              {p.title}
            </Link>
            {/*
              Lo stato con il punto della barra: terracotta per la bozza,
              perché è quella che chiede di essere guardata —non si vede nel
              sito—, e inchiostro pallido per il pubblicato, che non chiede
              niente.
            */}
            <span className="flex items-center gap-1.5 text-xs text-ink-faint">
              <span
                aria-hidden="true"
                className={`block h-1 w-1 rounded-full ${p.pubblicato ? "bg-ink-faint" : "bg-accent"}`}
              />
              {p.pubblicato ? "Pubblicato" : "Bozza"}
            </span>
          </div>
          <p className="figures mt-1 truncate text-xs text-ink-faint">
            {p.formati.map((f) => `${f.formato} ${prezzo(f.prezzo)}`).join(" · ")}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <form action={spostaProdottoAzione}>
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="verso" value="-1" />
            <button
              type="submit"
              disabled={primo}
              title="Sposta su"
              className="flex h-8 w-8 rotate-90 items-center justify-center text-ink-faint transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-30"
            >
              <span className="sr-only">Sposta su {p.title}</span>
              <ArrowLeft size={15} />
            </button>
          </form>
          <form action={spostaProdottoAzione}>
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="verso" value="1" />
            <button
              type="submit"
              disabled={ultimo}
              title="Sposta giù"
              className="flex h-8 w-8 rotate-90 items-center justify-center text-ink-faint transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-30"
            >
              <span className="sr-only">Sposta giù {p.title}</span>
              <ArrowRight size={15} />
            </button>
          </form>
          <Link
            href={`/admin/shop/${p.id}`}
            title="Modifica"
            aria-hidden="true"
            tabIndex={-1}
            className="flex h-8 w-8 items-center justify-center text-ink-soft transition-colors hover:text-ink"
          >
            <Pencil size={16} />
          </Link>
          <button
            type="button"
            onClick={() => setConfermando(true)}
            title="Cancella"
            className="flex h-8 w-8 items-center justify-center text-ink-soft transition-colors hover:text-accent"
          >
            <span className="sr-only">Cancella {p.title}</span>
            <Trash size={16} />
          </button>
        </div>
      </div>

      {p.pubblicato && !confermando && (
        <Link
          href={prodottoHref(p)}
          className="area-tocco ml-[4.5rem] mt-2 inline-block text-xs text-ink-faint transition-colors hover:text-ink"
        >
          <span className="link-underline">Vedi nel sito</span>
        </Link>
      )}

      {confermando && (
        <div className="ml-[4.5rem] mt-3 border-t border-accent pt-3">
          <p className="text-xs text-ink">
            Si cancella «{p.title}» con le sue immagini. Non si può disfare.
          </p>
          <div className="mt-2.5 flex items-center gap-4 text-xs">
            <form action={cancellaProdotto}>
              <input type="hidden" name="id" value={p.id} />
              <button type="submit" className="link-underline text-accent transition-opacity hover:opacity-70">
                Cancella
              </button>
            </form>
            <button
              type="button"
              onClick={() => setConfermando(false)}
              className="link-underline text-ink-soft transition-colors hover:text-ink"
            >
              Lascialo
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
