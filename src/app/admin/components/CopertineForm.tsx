"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ShopCategoria } from "@/data/shop";
import type { GruppoLibreria, Porta } from "@/lib/copertine";
import type { WorkImage } from "@/lib/works";
import type { EstadoFormulario } from "../actions";
import { guardaCopertine } from "../shop/actions";

/** Una miniatura leggera: Cloudinary la taglia in 4:5 alla misura della griglia. */
function miniatura(url: string): string {
  return url.includes("res.cloudinary.com")
    ? url.replace("/upload/", "/upload/c_fill,g_auto,w_320,h_400,q_auto,f_auto/")
    : url;
}

/**
 * Le copertine della pagina /shop, scelte fra le immagini già caricate.
 *
 * In alto le porte come escono nel sito, una accanto all'altra; quella
 * attiva porta il filetto terracotta. Sotto, la biblioteca: tutte le immagini
 * dei servizi, delle stampe e delle opere. Un clic su un'immagine la mette
 * nella porta attiva, e si vede subito accanto alle altre due, che è il
 * motivo per cui si scelgono insieme.
 *
 * Il pulsante di salvataggio resta attaccato in fondo allo schermo: la
 * biblioteca è lunga, e salvare non deve voler dire tornare su.
 */
export default function CopertineForm({ porte, libreria }: { porte: Porta[]; libreria: GruppoLibreria[] }) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(guardaCopertine, {});
  const [scelte, setScelte] = useState<Partial<Record<ShopCategoria, string>>>(() =>
    Object.fromEntries(porte.filter((p) => p.scelta && p.immagine).map((p) => [p.categoria.slug, p.immagine!.url])),
  );
  const [attiva, setAttiva] = useState<ShopCategoria>(porte[0].categoria.slug);
  const etichetta = porte.find((p) => p.categoria.slug === attiva)!.categoria.label;

  const perUrl = new Map(libreria.flatMap((g) => g.immagini.map((i) => [i.url, i] as const)));
  const sceltaDi = (cat: ShopCategoria): WorkImage | null => {
    const url = scelte[cat];
    return url ? (perUrl.get(url) ?? null) : null;
  };

  return (
    <form action={enviar}>
      {porte.map((p) => (
        <input key={p.categoria.slug} type="hidden" name={`copertina-${p.categoria.slug}`} value={scelte[p.categoria.slug] ?? ""} />
      ))}

      <div className="grid gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-8">
          <h1 className="display-lead font-display text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15]">
            Copertine dello Shop
          </h1>
          <p className="mt-3 max-w-[56ch] text-sm leading-relaxed text-ink-soft">
            Tocca una categoria, poi scegli la sua immagine fra quelle già caricate nel sito.
          </p>

          {estado.error && (
            <p role="alert" className="mt-5 nota">
              {estado.error}
            </p>
          )}

          {/* Le porte, come escono nella pagina /shop. */}
          <ul className="mt-8 grid grid-cols-3 gap-3 md:gap-5">
            {porte.map((p) => {
              const cat = p.categoria.slug;
              const scelta = sceltaDi(cat);
              const mostrata = scelta ?? p.riserva;
              const eAttiva = cat === attiva;
              return (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => setAttiva(cat)}
                    aria-pressed={eAttiva}
                    className="group block w-full text-left focus-visible:outline-none"
                  >
                    <span
                      className={`block overflow-hidden bg-paper-deep outline-offset-[3px] transition-[outline-color] group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-ink ${
                        eAttiva ? "outline outline-2 outline-accent" : ""
                      }`}
                    >
                      {mostrata ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={miniatura(mostrata.url)}
                          alt=""
                          className={`aspect-[4/5] w-full object-cover transition-opacity ${scelta ? "" : "opacity-60"}`}
                        />
                      ) : (
                        <span className="block aspect-[4/5] w-full" />
                      )}
                    </span>
                    <span
                      className={`mt-2.5 block text-[0.8125rem] leading-snug transition-colors md:text-sm ${
                        eAttiva ? "text-accent" : "text-ink group-hover:text-accent"
                      }`}
                    >
                      {p.categoria.label}
                    </span>
                  </button>
                  <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-xs text-ink-faint">
                    {scelta ? "Scelta da te" : "Di riserva"}
                    {scelta && (
                      <button
                        type="button"
                        onClick={() => setScelte((s) => ({ ...s, [cat]: undefined }))}
                        className="link-underline text-ink-soft transition-colors hover:text-accent"
                      >
                        Togli
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="md:col-span-3 md:col-start-10">
          <h2 className="label">Come funziona</h2>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-ink-soft">
            <li>Le immagini vengono dai servizi, dalle stampe (anche i mockup) e dalle opere.</li>
            <li>Senza una scelta, la porta usa la prima immagine del servizio o della prima stampa: è quella in pallido.</li>
            <li>Scegliere una copertina non sposta né cancella l&apos;immagine da dove viene.</li>
          </ul>
        </div>
      </div>

      {/* La biblioteca. */}
      <section aria-labelledby="libreria" className="mt-14 border-t border-line pt-8">
        <h2 id="libreria" className="display-section font-display text-xl leading-tight">
          Scegli per «{etichetta}»
        </h2>

        {libreria.length === 0 && (
          <p className="mt-4 text-sm text-ink-faint">
            Non c&apos;è ancora nessuna immagine caricata nel sito.
          </p>
        )}

        {libreria.map((g) => (
          <div key={g.titolo} className="mt-8">
            <h3 className="label">
              {g.titolo} <span className="figures ml-1 text-ink-faint">{g.immagini.length}</span>
            </h3>
            <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
              {g.immagini.map((img) => {
                const presa = scelte[attiva] === img.url;
                return (
                  <li key={img.url}>
                    <button
                      type="button"
                      onClick={() => setScelte((s) => ({ ...s, [attiva]: img.url }))}
                      aria-pressed={presa}
                      title={img.fonte}
                      className={`group relative block w-full overflow-hidden bg-paper-deep outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink ${
                        presa ? "outline outline-2 outline-accent" : ""
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={miniatura(img.url)}
                        alt=""
                        loading="lazy"
                        className="aspect-[4/5] w-full object-cover transition-opacity group-hover:opacity-80"
                      />
                      <span className="sr-only">
                        {presa ? "Scelta: " : "Scegli "}
                        {img.fonte}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      {/* Il salvataggio resta in vista mentre si scorre la biblioteca. */}
      <div className="sticky bottom-0 z-10 -mx-[var(--gutter)] mt-12 border-t border-line bg-paper/95 px-[var(--gutter)] py-4 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          {/*
            Le tre porte in piccolo: mentre si scorre la biblioteca si vede
            sempre per quale si sta scegliendo, e si cambia senza tornare su.
          */}
          <ul className="flex items-center gap-2">
            {porte.map((p) => {
              const cat = p.categoria.slug;
              const mostrata = sceltaDi(cat) ?? p.riserva;
              const eAttiva = cat === attiva;
              return (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => setAttiva(cat)}
                    aria-pressed={eAttiva}
                    title={p.categoria.label}
                    className={`block w-8 overflow-hidden bg-paper-deep outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink ${
                      eAttiva ? "outline outline-2 outline-accent" : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    {mostrata ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={miniatura(mostrata.url)} alt="" className="aspect-[4/5] w-full object-cover" />
                    ) : (
                      <span className="block aspect-[4/5] w-full" />
                    )}
                    <span className="sr-only">{p.categoria.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <span className="hidden min-w-0 flex-1 truncate text-sm text-ink-soft md:block">
            Stai scegliendo per <span className="text-accent">{etichetta}</span>
          </span>

          <button
            type="submit"
            disabled={enviando}
            className="ml-auto whitespace-nowrap bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50 md:ml-0"
          >
            {enviando ? "Salvataggio…" : "Salva le copertine"}
          </button>
          <span className="hidden sm:inline">
            <Link href="/admin/shop" className="link-underline text-sm text-ink-soft transition-colors hover:text-ink">
              Annulla
            </Link>
          </span>
        </div>
      </div>
    </form>
  );
}
