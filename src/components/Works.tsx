import Image from "next/image";
import Link from "next/link";
import { site } from "@/data/site";
import type { Work } from "@/lib/works";

/**
 * La obra: grilla simétrica de tres columnas.
 *
 * Plana, sin agrupar. Llegó a estar partida en bandas de año —con el año en
 * una espina fija y el resto del archivo atenuándose al apoyarse en una
 * pieza— y se sacó a pedido del cliente. El año no desapareció: volvió a la
 * ficha de cada obra, al lado del título, que es donde estaba antes.
 *
 * **Sólo obra, en todos los anchos.** No hay título, ni año, ni técnica: la
 * grilla no dibuja una palabra. Llegó a tener las tres cosas y se fueron de a
 * una, a pedido del cliente, hasta quedar esto. Lo que cada obra es se lee al
 * abrirla; acá se la mira.
 *
 * **Las celdas son verticales en todos los anchos**, en 4:5. Llegó a haber una
 * costura en 640px —mosaico vertical abajo, cuadrado arriba— y se sacó a
 * pedido del cliente: la misma obra se veía con dos encuadres distintos según
 * la pantalla desde la que se la mirara.
 *
 * El recorte es real y está elegido sabiéndolo. La obra de este archivo es
 * cuadrada, así que el cuadrado no recortaba nada y el 4:5 se come un quinto
 * del ancho de cada pieza, ahora en todas las pantallas y no sólo en el
 * teléfono. Por eso se queda en 4:5 y no en 3:4, que se comería un cuarto: es
 * el peldaño más suave que todavía se lee como vertical. Quien la quiera ver
 * entera la abre, que es donde la lámina sale sin recortar.
 *
 * Recibe las obras en vez de buscarlas: así la portada decide una sola vez
 * qué pide a la base, y este componente sigue siendo dibujo puro.
 *
 * Movimiento: cada pieza entra desde su columna —la izquierda desde la
 * izquierda, la del medio desde abajo, la derecha desde la derecha— y se
 * asienta escalando de 0.965 a 1. La dirección la da la posición en la
 * grilla, no el azar, y la resuelve `globals.css` con los mismos cortes que
 * arman la grilla: acá no se puede saber en qué columna cae una pieza sin
 * saber el ancho de la pantalla, y este componente corre en el servidor.
 */
export default function Works({ works }: { works: Work[] }) {
  /*
    El archivo vacío tiene que decir algo. Sin esto, una tabla sin filas
    dibuja una lista vacía y la portada queda con una franja de papel en
    blanco entre la cabecera y el pie: no se lee como «todavía no hay obra»,
    se lee como una página rota.

    Lo dice en italiano y en la voz del sitio, porque esto sí lo ve el
    visitante —no es la pantalla de trabajo— y no invita a hacer nada: el
    archivo está por abrirse, no hay nada que pedirle a quien llegó.
  */
  if (works.length === 0) {
    return (
      <div className="shell flex min-h-[46vh] flex-col justify-center pt-8 pb-8 md:pt-14">
        <p className="prose-measure text-lg leading-relaxed text-ink-soft">
          L&apos;archivio è in preparazione.
        </p>
        <p className="prose-measure mt-3 text-sm text-ink-faint">
          Le prime opere arrivano presto. Nel frattempo, scrivimi:{" "}
          <a
            href={`mailto:${site.email}`}
            className="link-underline text-ink-soft transition-colors hover:text-ink"
          >
            {site.email}
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="shell pt-8 pb-8 md:pt-14">
      {/*
        Dos columnas desde el teléfono, tres desde 1024px. Nunca una: un
        archivo de una sola columna en el teléfono obliga a un gesto por obra
        para ver la siguiente, y lo que hace que esto se lea como un archivo
        —y no como una obra atrás de otra— es ver varias juntas.

        El aire entre obras ya no separa: junta. Con la ficha puesta, cada
        celda era un registro y el blanco alrededor era lo que la volvía una
        pieza distinta de la de al lado; sacada la ficha, ese mismo blanco deja
        las obras flotando sueltas sobre el papel. Las dos decisiones son una:
        no se puede quitar el texto y conservar el aire que lo acompañaba.

        Por eso el paso es el mismo en todos los anchos, medido en proporción
        y no en píxeles: ~2% del ancho de la celda en cualquier pantalla —4px
        sobre los 169px del teléfono, 8px sobre los 373px del escritorio—. Es
        lo mínimo que impide que dos obras de fondo claro se fundan en una sola
        mancha, y con eso la grilla se lee como una pared de obra.
      */}
      <ul className="grid grid-cols-2 gap-1 sm:gap-1.5 md:gap-2 lg:grid-cols-3">
        {works.map((item, i) => {
          const portada = item.image[0];
          if (!portada) return null;

          const eager = i < 3;

          return (
            <li key={item.slug} className="rivista-piece">
              {/*
                El nombre accesible lo pone el enlace y no el `alt` de la
                imagen. Es lo único que nombra a la obra en esta página: la
                grilla no dibuja una sola palabra, así que sin esto se
                anunciaría como una tirada de descripciones de ilustración sin
                un solo nombre. La descripción de la pieza queda para su
                página, que es donde la imagen es el contenido y no un acceso.
              */}
              <Link
                href={`/opera/${item.slug}`}
                aria-label={`${item.title}, ${item.year}`}
                className="group block focus-visible:outline-none"
              >
                {/* El foco se dibuja sobre la imagen, que es lo que el visitante mira. */}
                <span className="block overflow-hidden bg-paper-deep group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[3px] group-focus-visible:outline-accent">
                  <Image
                    src={portada.url}
                    alt=""
                    width={portada.width}
                    height={portada.height}
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    priority={eager}
                    loading={eager ? undefined : "lazy"}
                    className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />
                </span>

              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
