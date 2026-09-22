"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Pencil, Trash } from "@/components/Icon";
import { borrarObra } from "../actions";
import PlacaObra from "./PlacaObra";
import type { Work } from "@/lib/works";

/**
 * Una obra en la grilla del admin.
 *
 * Es la celda del sitio con dos cosas encima: los controles, que aparecen al
 * apoyarse, y la confirmación de borrado, que ocupa el renglón de la ficha en
 * vez de abrir una ventana.
 *
 * **Por qué no hay modal para borrar.** Una ventana sobre la pantalla para
 * una pregunta de dos palabras tapa justo lo que hay que mirar antes de
 * contestarla, que es la obra. Acá la pregunta sale debajo de su propia
 * imagen: se ve qué se está por borrar mientras se decide.
 *
 * Es cliente por dos estados que no pueden vivir en el servidor: si el puntero
 * está encima y si el borrado está preguntado.
 *
 * `manija` es el botón de arrastrar, y llega desde afuera en vez de dibujarse
 * acá porque mover una pieza es lo único de esta celda que no se resuelve
 * dentro de ella: hace falta saber dónde están las otras. La celda decide
 * dónde va el control —primero del grupo, con el lápiz y la papelera— y
 * `ArchivoOrdenable` decide qué hace.
 */
export default function ObraEditable({ obra, manija }: { obra: Work; manija?: ReactNode }) {
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div className="group/obra relative">
      {/*
        La imagen lleva al editor. Toda la pieza es el objetivo de click, como
        en el sitio toda la pieza lleva a la obra: el gesto es el mismo, lo que
        cambia es a dónde llega.
      */}
      <Link
        href={`/admin/${obra.id}`}
        className="block focus-visible:outline-none"
        aria-label={`Editar ${obra.title}`}
      >
        <PlacaObra obra={obra} />
      </Link>

      {/*
        Los controles, en dos lugares distintos según haya puntero o no.

        **Con puntero** se apoyan sobre la imagen, arriba a la derecha, y no
        se ven hasta que entra el mouse o llega el teclado: la grilla queda
        limpia y los controles aparecen sobre la pieza que se está mirando.
        Siguen alcanzables por tabulador aunque no se vean, porque
        `opacity-0` no saca nada del orden de foco.

        **Sin puntero** bajan al renglón de la ficha, al lado del título y el
        año. Ahí el hover no ocurre nunca, así que tienen que estar siempre; y
        si estuvieran siempre encima de la imagen, cada obra del archivo
        quedaría con dos chapitas tapándola, que es lo contrario de ver el
        archivo como se publica. Abajo están a la vista y no cubren nada.

        El `@media (hover: hover)` pregunta por el dispositivo y no por el
        ancho: una tableta es ancha y se toca igual.

        La manija entra primera del grupo porque es la única de las tres que
        se sostiene en vez de tocarse: la mano va a ella, no a ella después de
        pasar por las otras dos.
      */}
      <div className="mt-2 flex justify-end gap-1 [@media(hover:hover)]:absolute [@media(hover:hover)]:right-2 [@media(hover:hover)]:top-2 [@media(hover:hover)]:mt-0 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:transition-opacity [@media(hover:hover)]:duration-300 [@media(hover:hover)]:group-hover/obra:opacity-100 [@media(hover:hover)]:group-focus-within/obra:opacity-100">
        {manija}

        {/*
          El lápiz es el mismo destino que la celda entera, así que para el
          teclado y el lector de pantalla está de más: sin esto, tabular por
          la grilla anuncia «Editar Giardino notturno» dos veces seguidas y la
          segunda no lleva a ningún lado nuevo. Queda como señal visual —dice
          que la pieza se edita— y sale del recorrido con `tabIndex={-1}`,
          que es lo que hace admisible el `aria-hidden` de al lado.
        */}
        <Link
          href={`/admin/${obra.id}`}
          title="Editar"
          aria-hidden="true"
          tabIndex={-1}
          className="flex h-8 w-8 items-center justify-center bg-paper/95 text-ink-soft transition-colors hover:text-ink"
        >
          <Pencil size={16} />
        </Link>

        <button
          type="button"
          onClick={() => setConfirmando(true)}
          title="Borrar"
          className="flex h-8 w-8 items-center justify-center bg-paper/95 text-ink-soft transition-colors hover:text-accent focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        >
          <span className="sr-only">Borrar {obra.title}</span>
          <Trash size={16} />
        </button>
      </div>

      {/*
        La confirmación tapa la ficha, no la obra. Papel pleno sobre filete
        terracota: es el único momento del admin en que el color toma un
        borde entero, y toma uno porque lo que sigue no se puede deshacer.
      */}
      {confirmando && (
        <div className="absolute inset-x-0 bottom-0 border-t border-accent bg-paper p-3">
          <p className="text-xs text-ink">
            Se borra «{obra.title}» y{" "}
            {obra.image.length === 1 ? "su imagen" : `sus ${obra.image.length} imágenes`}. No se
            puede deshacer.
          </p>

          <div className="mt-2.5 flex items-center gap-4 text-xs">
            <form action={borrarObra}>
              <input type="hidden" name="id" value={obra.id} />
              <button
                type="submit"
                className="link-underline text-accent transition-opacity hover:opacity-70"
              >
                Borrar
              </button>
            </form>

            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="link-underline text-ink-soft transition-colors hover:text-ink"
            >
              Dejarla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
