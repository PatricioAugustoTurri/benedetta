import Link from "next/link";
import { salir } from "../actions";
import { listWorks, pingDb } from "@/lib/works";

/**
 * La barra del admin: qué hay cargado, si la base responde, y la salida.
 *
 * Fija arriba y de una sola línea. Lleva el mismo filete y las mismas
 * versalitas que la ficha de una obra en el sitio: no es una barra de
 * herramientas de otra aplicación, es el encabezado del archivo cuando se lo
 * está editando.
 *
 * El estado de la base se consulta de verdad en cada carga. Es la diferencia
 * entre «no hay obras todavía» y «la base no contesta», que en pantalla se
 * ven igual y significan cosas opuestas: la primera se arregla cargando, la
 * segunda levantando Postgres.
 */
export default async function AdminBar() {
  const viva = await pingDb();
  const obras = viva ? await listWorks() : [];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="shell flex h-12 items-center justify-between gap-4">
        <div className="flex items-baseline gap-4">
          <Link href="/admin" className="label text-ink">
            Archivio
          </Link>

          {/*
            El punto es el único color de la barra, y dice estado: terracota
            cuando la base no contesta, tinta pálida cuando todo está en orden.
            Nunca verde: en este sistema el color marca lo que pide atención,
            y «funciona» no pide ninguna.
          */}
          <span className="flex items-center gap-1.5 text-xs text-ink-faint">
            <span
              aria-hidden="true"
              className={`block h-1 w-1 rounded-full ${viva ? "bg-ink-faint" : "bg-accent"}`}
            />
            {viva ? (
              <>
                <span className="figures">{obras.length}</span>
                {obras.length === 1 ? " obra" : " obras"}
              </>
            ) : (
              "la base no contesta"
            )}
          </span>
        </div>

        <div className="flex items-center gap-5 text-xs">
          <Link
            href="/"
            className="link-underline text-ink-soft transition-colors hover:text-ink"
          >
            Ver el sitio
          </Link>

          {/*
            Un formulario y no un link: cerrar sesión cambia algo en el
            servidor, y lo que cambia el estado se manda con POST. Un <a> que
            borra la sesión se dispara solo con cualquier cosa que precargue.
          */}
          <form action={salir}>
            <button
              type="submit"
              className="link-underline text-ink-soft transition-colors hover:text-ink"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
