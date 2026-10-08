"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { shopCategories, type ShopCategoria } from "@/data/shop";
import type { Copertine } from "@/lib/copertine";
import { MAX_ARCHIVO_MB } from "@/lib/limites";
import type { EstadoFormulario } from "../actions";
import { guardaCopertine } from "../shop/actions";
import CampoImmagini, { type StatoImmagini } from "./CampoImmagini";

/**
 * Le copertine della pagina /shop: un'immagine per categoria, tutte nello
 * stesso modulo, perché si scelgono pensando a come stanno una accanto
 * all'altra.
 *
 * Ogni categoria ha il suo campo, con lo stesso componente del mockup di una
 * stampa: un pezzo solo, solo immagini, caricato su Cloudinary appena si
 * sceglie.
 */
export default function CopertineForm({ copertine }: { copertine: Copertine }) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(guardaCopertine, {});
  const [stati, setStati] = useState<Partial<Record<ShopCategoria, StatoImmagini>>>({});

  // Uno per categoria e stabile: CampoImmagini lo chiama dentro un effetto.
  const [onStato] = useState(() =>
    Object.fromEntries(
      shopCategories.map((c) => [c.slug, (s: StatoImmagini) => setStati((p) => ({ ...p, [c.slug]: s }))]),
    ) as Record<ShopCategoria, (s: StatoImmagini) => void>,
  );

  const somma = (k: keyof StatoImmagini) =>
    Object.values(stati).reduce((n, s) => n + Number(s?.[k] ?? 0), 0);
  const subiendo = somma("subiendo") > 0;
  const falladas = somma("falladas");
  const pesadas = somma("pesadas");
  const bloqueado = subiendo || falladas > 0 || pesadas > 0;

  return (
    <form action={enviar} className="grid gap-12 md:grid-cols-12 md:gap-16">
      <div className="md:col-span-7">
        <h1 className="display-lead font-display text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15]">
          Copertine dello Shop
        </h1>

        {(falladas > 0 || pesadas > 0) && (
          <p
            role="alert"
            className="mt-5 border-l border-accent bg-paper-deep/60 py-2 pl-3 text-sm text-accent"
          >
            {pesadas > 0
              ? `Un file supera il peso massimo: ${MAX_ARCHIVO_MB} MB.`
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

        {shopCategories.map((c) => {
          const attuale = copertine[c.slug];
          return (
            <CampoImmagini
              key={c.slug}
              campo={`copertina-${c.slug}`}
              titolo={c.label}
              singola={{ etichetta: "Copertina", scegli: "Scegli la copertina" }}
              iniziali={attuale ? [attuale] : []}
              onStato={onStato[c.slug]}
              nota={
                <>
                  Verticale 4:5. Senza, esce la prima immagine{" "}
                  {c.slug === "stampe" ? "della prima stampa pubblicata" : "del servizio"}.
                </>
              }
            />
          );
        })}

        <div className="mt-10 flex items-center gap-6 border-t border-line pt-6">
          <button
            type="submit"
            disabled={enviando || bloqueado}
            className="bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {enviando ? "Salvataggio…" : subiendo ? "Caricamento in corso…" : "Salva le copertine"}
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
        <h2 className="label">Dove usciranno</h2>
        <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
          <li>
            Nella pagina <span className="text-xs tracking-[0.01em] text-ink">/shop</span>, una
            accanto all&apos;altra, con il nome della categoria sotto.
          </li>
          <li>Ognuna porta alla pagina della sua categoria.</li>
        </ul>
        <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-ink-faint">
          Non cambiano le immagini dei servizi né delle stampe: queste sono solo le porte.
        </p>
      </aside>
    </form>
  );
}
