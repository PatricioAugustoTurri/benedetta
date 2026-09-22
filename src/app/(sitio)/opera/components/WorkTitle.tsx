import Reveal from "@/components/Reveal";
import type { Work } from "@/lib/works";

/**
 * El nombre de la obra, arriba de todo.
 *
 * Estaba debajo de las láminas, encabezando la descripción, y subió a pedido
 * del cliente. El orden que queda —nombre, obra, texto— es el de una ficha de
 * catálogo: se sabe qué se está por mirar antes de mirarlo, y lo que se lee
 * después es contexto de algo que ya se vio.
 *
 * Importa además por de dónde se llega. La grilla del archivo no dibuja una
 * sola palabra, así que el visitante toca una imagen sin saber cómo se llama;
 * si el nombre aparece recién pasadas las láminas, hay una pantalla entera en
 * la que no hay forma de saber dónde cayó.
 *
 * Alineado a la izquierda como el resto de la página, aunque la lámina de
 * abajo vaya centrada: la izquierda es el eje del sitio y la lámina es la
 * excepción, centrada porque su ancho depende de la proporción de cada obra.
 *
 * Más aire arriba que abajo, que es la regla de cualquier titular acá: el
 * blanco que lo separa de la vuelta al archivo lo presenta, y el que lo separa
 * de la lámina lo ata a la obra que nombra.
 */
export default function WorkTitle({ work }: { work: Work }) {
  return (
    <Reveal>
      <h1
        className="display-h1 mt-8 max-w-[30ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance md:mt-12"
        /*
          El tope de medida no es para los títulos que hay —ninguno llega—
          sino para el que va a entrar algún día: sin él, un nombre largo se
          estira en un solo renglón de 1300px, que a este cuerpo no se lee, se
          recorre. `text-balance` reparte los renglones cuando los hay.
        */
      >
        {work.title}
      </h1>
    </Reveal>
  );
}
