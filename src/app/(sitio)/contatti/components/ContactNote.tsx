import Link from "next/link";
import Reveal from "@/components/Reveal";

/**
 * El otro camino, el de quien viene por una obra puntual. Va al pie y en
 * tinta pálida porque es una nota, no una alternativa en igualdad de
 * condiciones: el formulario es el camino.
 *
 * No se dibuja cuando el visitante llegó justamente por ahí. Contarle cómo
 * hacer lo que acaba de hacer no es ayuda: es ruido, y encima lo hace dudar
 * de si le salió bien.
 */
export default function ContactNote({ desdeUnaObra = false }: { desdeUnaObra?: boolean }) {
  if (desdeUnaObra) return null;

  return (
    <Reveal delay={240}>
      {/*
        El filete va en el contenedor y la medida de lectura en el texto: si
        el filete la heredara, cortaría antes que los de los campos y el borde
        derecho de la columna quedaría dentado.
      */}
      <div className="mt-12 border-t border-line pt-6">
        <p className="prose-measure text-xs leading-relaxed text-ink-faint">
          Si tu consulta es por una obra en particular, el botón{" "}
          <span className="text-ink-soft">Chiedi info</span> que hay en cada una te trae acá
          con el asunto ya puesto. Están todas en{" "}
          <Link href="/" className="link-underline text-ink-soft transition-colors hover:text-ink">
            el archivo
          </Link>
          .
        </p>
      </div>
    </Reveal>
  );
}
