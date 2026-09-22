import Image from "next/image";
import { Work } from "@/lib/works";

/**
 * El dibujo de una obra en la grilla del admin: la placa y su ficha.
 *
 * Existe como pieza aparte porque ahora se dibuja en dos lugares —la celda
 * de la grilla y la copia que sigue al dedo mientras se arrastra— y esos dos
 * tienen que ser la misma obra, no dos versiones parecidas. Un duplicado se
 * empieza a separar en la primera corrección que alguien hace en uno solo.
 *
 * La proporción es la del sitio, 4:5, y tiene que seguirla cuando cambie: esta
 * pantalla existe para juzgar cómo se va a ver la pieza publicada, y mostrarla
 * con otro encuadre la deja sirviendo para lo contrario de lo que justifica su
 * forma.
 *
 * Todo son `<span>` y no `<div>`: en la celda esto vive adentro de un `<a>`,
 * que no admite contenido de bloque. En la copia flotante da igual, y la
 * regla la marca el caso que sí obliga.
 *
 * `enMano` es la pieza levantada. Lleva el filete terracota y el título en
 * terracota, no como decoración sino porque en este sistema el color marca
 * estado, y una obra en el aire es estado: es la que se está moviendo. Fuera
 * de la mano ese mismo filete lo pone el hover, y por eso acá se apaga.
 */
export default function PlacaObra({ obra, enMano = false }: { obra: Work; enMano?: boolean }) {
  const portada = obra.image[0];

  return (
    <>
      <span className="relative block overflow-hidden bg-paper-deep">
        {portada ? (
          <Image
            src={portada.url}
            alt={portada.alt}
            width={portada.width}
            height={portada.height}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              enMano ? "" : "group-hover/obra:scale-[1.03]"
            }`}
          />
        ) : (
          /*
            No debería pasar —el formulario exige una imagen— pero si una fila
            entró por psql sin ninguna, la grilla lo dice en vez de dibujar un
            rectángulo gris sin explicación.
          */
          <span className="flex aspect-[4/5] w-full items-center justify-center text-xs text-accent">
            Sin imagen
          </span>
        )}

        {/*
          El filete que marca la pieza apuntada. Va por dentro del borde con
          `inset` y no como `border`, para no correr la imagen un píxel al
          aparecer: el salto delataría que es una capa agregada.

          Detrás de `@media (hover: hover)` como los controles, y por lo mismo:
          en una pantalla táctil el `:hover` se queda pegado después de tocar,
          así que sin esto una pieza en reposo quedaba con el filete y el
          título en terracota. El sistema reserva ese color para el estado;
          pegado, pasa a ser decoración.

          En la mano el filete está puesto y no depende de nada: ahí el estado
          es cierto en cualquier dispositivo, porque la pieza está agarrada.
        */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 border transition-colors duration-300 ${
            enMano
              ? "border-accent"
              : "border-accent/0 [@media(hover:hover)]:group-hover/obra:border-accent/60 [@media(hover:hover)]:group-focus-within/obra:border-accent/60"
          }`}
        />
      </span>

      <span className="mt-3 flex items-baseline justify-between gap-4">
        <span
          className={`display-title font-display text-base transition-colors ${
            enMano ? "text-accent" : "[@media(hover:hover)]:group-hover/obra:text-accent"
          }`}
        >
          {obra.title}
        </span>
        <span className="label figures shrink-0">{obra.year}</span>
      </span>

      <span className="mt-0.5 block text-xs text-ink-soft">
        {obra.tecnica}
        <span aria-hidden="true"> · </span>
        <span className="figures">{obra.image.length}</span>
        {obra.image.length === 1 ? " imagen" : " imágenes"}

        {/*
          Lo que falta, dicho en la grilla. El texto es el único campo que
          puede quedar vacío sin que la obra deje de guardarse, así que es el
          único que se puede tener a medias sin enterarse: la página de la
          obra sale sin una línea y nada lo avisa.

          En terracota porque el sistema usa ese color para el estado, y esto
          es estado: no es un error —la obra está bien cargada— es una obra a
          la que todavía le falta algo.
        */}
        {!obra.description && (
          <>
            <span aria-hidden="true"> · </span>
            <span className="text-accent">sin texto</span>
          </>
        )}
      </span>
    </>
  );
}
