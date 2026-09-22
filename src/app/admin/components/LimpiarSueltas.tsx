"use client";

import { useState, useTransition } from "react";
import { limpiarSueltas, type Limpieza } from "../actions";

/** El resultado, dicho en una línea. */
function Resultado({ r }: { r: Limpieza }) {
  if (r.error) return <span className="text-accent">{r.error}</span>;

  const cifra = (n: number) => <span className="figures text-ink-soft">{n}</span>;

  return (
    <>
      {r.borradas > 0 && (
        <>
          Se {r.borradas === 1 ? "borró" : "borraron"} {cifra(r.borradas)}
          {r.borradas === 1 ? " imagen" : " imágenes"} ·{" "}
          {cifra(Number((r.bytes / 1024 / 1024).toFixed(1)))} MB liberados.
        </>
      )}

      {r.borradas === 0 && r.recientes === 0 && "No había ninguna."}

      {/*
        Las recientes se nombran aparte y siempre. Decir «no había ninguna»
        cuando hay tres esperando el margen haría que quien lo lee dé la
        cuenta por limpia y no vuelva a mirar.
      */}
      {r.recientes > 0 && (
        <>
          {r.borradas > 0 ? " Quedan " : "Hay "}
          {cifra(r.recientes)} de hace menos de una hora, sin tocar. Probá de nuevo más tarde.
        </>
      )}
    </>
  );
}

/**
 * Sacar de Cloudinary las imágenes que ninguna obra usa.
 *
 * Va al pie del archivo, en tinta pálida y sin adorno: es mantenimiento, se
 * usa cada tanto, y no tiene por qué competir con cargar una obra.
 *
 * No se ejecuta sola al abrir el admin, aunque podría. Preguntarle a
 * Cloudinary qué hay guardado es una llamada de red, y ponerla en cada carga
 * de la pantalla haría más lenta la tarea de todos los días para resolver
 * algo que pasa de vez en cuando.
 */
export default function LimpiarSueltas() {
  const [resultado, setResultado] = useState<Limpieza | null>(null);
  const [corriendo, empezar] = useTransition();

  return (
    <div className="mt-16 border-t border-line pt-5">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <button
          type="button"
          disabled={corriendo}
          onClick={() => empezar(async () => setResultado(await limpiarSueltas()))}
          className="link-underline text-xs text-ink-faint transition-colors hover:text-ink disabled:opacity-50"
        >
          {corriendo ? "Buscando…" : "Limpiar imágenes sueltas"}
        </button>

        {/*
          El resultado va en la misma línea y con el mismo cuerpo: es una
          respuesta, no un anuncio. `aria-live` lo hace llegar a quien no está
          mirando esta esquina de la pantalla.
        */}
        <span aria-live="polite" className="text-xs text-ink-faint">
          {resultado && <Resultado r={resultado} />}
        </span>
      </div>

      <p className="mt-2 max-w-[52ch] text-xs leading-relaxed text-ink-faint">
        Las imágenes suben apenas las elegís, así que si alguna vez cerrás el formulario sin
        guardar, quedan ocupando la cuenta sin pertenecer a ninguna obra. Esto las saca. No
        toca las de menos de una hora, por si estás cargando algo en otra pestaña.
      </p>
    </div>
  );
}
