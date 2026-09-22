import Link from "next/link";
import { Plus } from "@/components/Icon";

/**
 * El hueco de alta: la primera celda de la grilla.
 *
 * Tiene la medida y la proporción de una obra, con filete punteado en vez de
 * imagen. Es la acción primaria de la pantalla y está donde el ojo empieza a
 * leer la grilla, sin necesidad de un botón flotante ni una barra de acciones:
 * el lugar vacío donde va a ir la obra *es* el control para cargarla.
 *
 * El punteado no es decoración. Un filete lleno lo haría leer como una pieza
 * más, todavía sin cargar; punteado dice que no hay nada y que se puede poner.
 */
export default function NuevaObra() {
  return (
    <Link
      href="/admin/nueva"
      className="group block focus-visible:outline-none"
    >
      {/*
        En el teléfono la grilla es de una sola columna, así que el hueco no
        tiene con quién alinearse y una celda vertical se come más que la
        pantalla entera antes de que aparezca la primera obra. Ahí va apaisado;
        desde 640px, donde la grilla se arma de verdad, toma la proporción de
        una pieza, que es 4:5 como en el sitio.
      */}
      <span className="flex aspect-[2/1] w-full flex-col items-center justify-center gap-3 border border-dashed border-line bg-paper-deep/40 sm:aspect-[4/5] transition-colors duration-300 group-hover:border-accent/50 group-hover:bg-paper-deep/70 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[3px] group-focus-visible:outline-accent">
        <Plus
          size={24}
          className="text-ink-faint transition-colors duration-300 group-hover:text-accent"
        />
        <span className="label text-ink-faint transition-colors duration-300 group-hover:text-ink-soft">
          Nueva obra
        </span>
      </span>

      {/*
        Los dos renglones vacíos reservan lo que en una obra cargada ocupan el
        título y la técnica, para que las celdas de una misma fila terminen a
        la misma altura. Sólo existen desde 640px: en una columna no hay fila
        que emparejar y acá abajo serían cuarenta píxeles de nada entre el
        hueco y la primera obra.
      */}
      <span aria-hidden="true" className="mt-3 hidden text-base leading-normal sm:block">
        &nbsp;
      </span>
      <span aria-hidden="true" className="mt-0.5 hidden text-xs leading-normal sm:block">
        &nbsp;
      </span>
    </Link>
  );
}
