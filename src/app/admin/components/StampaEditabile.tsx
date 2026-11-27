"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Pencil, Trash } from "@/components/Icon";
import { prodottoHref } from "@/data/shop";
import type { Prodotto } from "@/lib/prodotti";
import { cancellaProdotto } from "../shop/actions";
import PlacaStampa from "./PlacaStampa";
import QrRecensione from "./QrRecensione";

/**
 * Una stampa nella griglia dell'admin. È `ObraEditable` con un'opera diversa
 * dentro: la cella intera porta alla scheda, i controlli si appoggiano
 * sull'immagine al passaggio del puntatore (e scendono sotto senza
 * puntatore), e la cancellazione chiede conferma sulla cella stessa.
 *
 * In più c'è «Vedi nel sito», che le opere non hanno perché nell'archivio
 * sono sempre pubblicate. Sta fuori dal link della cella —un link dentro un
 * link non si può— sulla riga dove, senza puntatore, cadono i controlli.
 *
 * E c'è il QR della recensione, per chi l'ha comprata al mercato o in
 * negozio: solo pubblicata, perché la recensione esce nella sua pagina. Senza
 * puntatore la matita non scende con gli altri: la cella intera porta già
 * alla scheda, e su mezzo schermo di telefono quattro controlli e «Nel sito»
 * non entrano in una riga.
 */
export default function StampaEditabile({ stampa: p, manija }: { stampa: Prodotto; manija?: ReactNode }) {
  const [confermando, setConfermando] = useState(false);

  return (
    <div className="group/stampa relative">
      <Link
        href={`/admin/shop/${p.id}`}
        className="block focus-visible:outline-none"
        aria-label={`Modifica ${p.title}${p.pubblicato ? "" : ", bozza"}`}
      >
        <PlacaStampa stampa={p} />
      </Link>

      <div className="mt-1.5 flex min-h-5 items-center justify-between gap-2">
        {p.pubblicato ? (
          <Link
            href={prodottoHref(p)}
            className="area-tocco whitespace-nowrap text-xs text-ink-faint transition-colors hover:text-ink"
          >
            {/*
              Sul telefono la cella è larga mezzo schermo e qui accanto
              cadono i tre controlli: la frase intera andava a capo.
            */}
            {/* `link-underline` fissa il suo display: il nascondere va sul contenitore. */}
            <span className="sm:hidden">
              <span className="link-underline">Nel sito</span>
            </span>
            <span className="hidden sm:inline">
              <span className="link-underline">Vedi nel sito</span>
            </span>
          </Link>
        ) : (
          <span />
        )}

        <div className="flex gap-1 [@media(hover:hover)]:absolute [@media(hover:hover)]:right-2 [@media(hover:hover)]:top-2 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:transition-opacity [@media(hover:hover)]:duration-300 [@media(hover:hover)]:group-hover/stampa:opacity-100 [@media(hover:hover)]:group-focus-within/stampa:opacity-100">
          {manija}
          {p.pubblicato && <QrRecensione prodotto={{ id: p.id, title: p.title, slug: p.slug }} aspetto="icona" />}
          <Link
            href={`/admin/shop/${p.id}`}
            title="Modifica"
            aria-hidden="true"
            tabIndex={-1}
            className="flex h-8 w-8 [@media(hover:none)]:hidden items-center justify-center bg-paper/95 text-ink-soft transition-colors hover:text-ink"
          >
            <Pencil size={16} />
          </Link>
          <button
            type="button"
            onClick={() => setConfermando(true)}
            title="Cancella"
            className="flex h-8 w-8 items-center justify-center bg-paper/95 text-ink-soft transition-colors hover:text-accent focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
          >
            <span className="sr-only">Cancella {p.title}</span>
            <Trash size={16} />
          </button>
        </div>
      </div>

      {confermando && (
        <div className="absolute inset-x-0 bottom-0 border-t border-accent bg-paper p-3">
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
              Lasciala
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
