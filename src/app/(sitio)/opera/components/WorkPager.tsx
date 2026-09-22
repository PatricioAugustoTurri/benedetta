import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@/components/Icon";
import { neighbours, type Work } from "@/lib/works";

/**
 * Seguir recorriendo sin volver al archivo.
 *
 * Recibe el slug y busca a los vecinos por su cuenta: quién está antes y
 * quién después es asunto de este bloque, y la página no gana nada sabiéndolo.
 * El orden es el que ella le dio al archivo en /admin, el mismo de la grilla:
 * si acá fuera otro, el paginado contradiría a la página de la que se salió.
 *
 * Las dos columnas se dibujan siempre, aunque una esté vacía —la primera obra
 * no tiene anterior y la última no tiene siguiente—: así "Successiva" no se
 * corre al centro al llegar a las puntas del archivo.
 *
 * **Cada vecina se muestra.** Un nombre solo no dice a qué se va: el visitante
 * está acá por la obra, no por cómo se llama, y "Carnevale andino" no le
 * adelanta nada a quien no la vio. Con la pieza a la vista, seguir de largo es
 * una decisión y no una apuesta.
 */
export default async function WorkPager({ slug }: { slug: string }) {
  const { prev, next } = await neighbours(slug);

  return (
    <nav className="mt-14 border-t border-line pt-6 md:mt-20" aria-label="Altre opere">
      {/*
        El filete cruza toda la medida, porque cierra la página; el par vive en
        una banda más angosta y centrada debajo.

        No es un capricho de ancho. Repartidas al medio de las 82rem del
        contenedor, las dos vecinas quedaban clavadas contra los bordes
        opuestos con ochocientos píxeles de papel vacío entremedio: dejaban de
        leerse como dos opciones entre las que se elige y pasaban a ser dos
        cosas sueltas que casualmente comparten renglón. Acotado, el par se ve
        de una mirada, que es lo que hace falta para decidir a cuál seguir.
      */}
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-8">
        <Vecina obra={prev} sentido="anterior" />
        <Vecina obra={next} sentido="siguiente" />
      </div>
    </nav>
  );
}

/**
 * Una de las dos columnas. Se dibuja aunque no haya obra: es el hueco que
 * mantiene a la otra en su lado de la página.
 *
 * Las dos son la misma función y no dos bloques casi iguales, porque eran casi
 * iguales y esa es la forma en que dos columnas se despegan: alguien corrige el
 * tamaño de una lámina y deja la otra como estaba.
 */
function Vecina({ obra, sentido }: { obra: Work | null; sentido: "anterior" | "siguiente" }) {
  if (!obra) return <div />;

  const siguiente = sentido === "siguiente";
  const portada = obra.image[0];

  return (
    <div className={siguiente ? "text-right" : undefined}>
      {/*
        Columna en flex y de alto completo para que las dos láminas compartan
        la línea de abajo. Sin eso, la columna cuyo título ocupa tres renglones
        —en el teléfono, donde cada una mide media pantalla— empuja su lámina
        más abajo que la de al lado y el par queda desparejo. Con `mt-auto` la
        diferencia la absorbe el aire entre el título y la lámina, que es donde
        no se nota.

        `items-end` del lado de la siguiente, y no `text-right` a secas: un
        hijo de un contenedor flex no lo alinea el `text-align` del padre, así
        que la etiqueta «Successiva» se estiraba a todo el ancho de la columna
        y quedaba a medio camino de su propio título.
      */}
      <Link
        href={`/opera/${obra.slug}`}
        className={`group flex h-full flex-col ${siguiente ? "items-end" : "items-start"}`}
      >
        <span className="label inline-flex items-center gap-1.5">
          {!siguiente && <ArrowLeft size={14} className="shrink-0" />}
          {siguiente ? "Successiva" : "Precedente"}
          {siguiente && <ArrowRight size={14} className="shrink-0" />}
        </span>

        <span className="display-section mt-1.5 block font-display text-lg transition-colors group-hover:text-accent">
          {obra.title}
        </span>

        {/*
          La lámina es la celda del archivo, no una miniatura nueva: misma
          proporción 4:5, mismo fondo de papel profundo, misma escala de 1.03
          en 900ms al apoyarse. Si el archivo cambia de encuadre, esto cambia
          con él —son el mismo objeto, y verlos distintos haría que la vecina
          no se reconozca como la pieza que después se va a encontrar. Que sea el mismo objeto es el punto — quien baja
          hasta acá reconoce la pieza como una del archivo y sabe qué va a
          pasar si la toca.

          Recortada por lo mismo que la grilla: lo que se compara entre una
          obra y la vecina es la obra, no la forma del marco. La lámina de
          arriba, que es la obra de esta página, sigue saliendo entera y sin
          recortar: ahí se viene a mirar, acá a elegir.
        */}
        {portada && (
          <span className="mt-auto block pt-4">
            <span className="block w-28 overflow-hidden bg-paper-deep md:w-36">
              <Image
                src={portada.url}
                alt=""
                width={portada.width}
                height={portada.height}
                sizes="(max-width: 768px) 112px, 144px"
                loading="lazy"
                className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              />
            </span>
          </span>
        )}
      </Link>
    </div>
  );
}
