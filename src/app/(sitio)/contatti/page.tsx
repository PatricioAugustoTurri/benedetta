import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { getWork } from "@/lib/works";
import Reveal from "@/components/Reveal";
import ContactAside from "./components/ContactAside";
import ContactIntro from "./components/ContactIntro";
import ContactNote from "./components/ContactNote";

export const metadata: Metadata = {
  title: "Contatti",
  description: "Encargos, colaboraciones y consultas por impresiones.",
};

/**
 * `?opera=<slug>` es lo que deja «Chiedi info» al traer a alguien desde una
 * obra, y lo único que hace es precargar el asunto.
 *
 * **Viaja el slug y no el título.** Con el título en la URL, el asunto del
 * formulario sería texto que cualquiera puede escribir en la barra de
 * direcciones: nadie se rompe por eso, pero un link armado a mano podría
 * poner cualquier cosa en el campo y hacerlo pasar por el nombre de una obra.
 * Con el slug, el título lo busca el servidor en la tabla, así que es siempre
 * el que ella cargó, y sigue siendo el correcto aunque haya renombrado la
 * obra después de que alguien guardara el link.
 *
 * Un slug que ya no existe no rompe nada: no hay obra, no hay asunto, y el
 * formulario sale vacío como si se hubiera entrado por el menú.
 *
 * Sin el parámetro no se toca la base. La página se sirve por petición porque
 * mira `searchParams`, pero quien entra por el menú no paga una consulta.
 */
export default async function ContattiPage({
  searchParams,
}: {
  searchParams: Promise<{ opera?: string }>;
}) {
  const { opera } = await searchParams;
  const obra = opera ? await getWork(opera) : null;

  return (
    <section className="shell pt-12 pb-8 md:pt-20">
      {/* Medida de 7 columnas y lateral en la 9: el marco que comparten
          Contatti y About me. */}
      <div className="grid gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7">
          <ContactIntro />
          <Reveal delay={170}>
            <ContactForm asuntoInicial={obra?.title} />
          </Reveal>
          <ContactNote desdeUnaObra={obra !== null} />
        </div>

        <ContactAside />
      </div>
    </section>
  );
}
