import Link from "next/link";
import { cloudinaryConfigurado } from "@/lib/cloudinary";
import { listWorks, pingDb } from "@/lib/works";
import ArchivoOrdenable from "./components/ArchivoOrdenable";
import LimpiarSueltas from "./components/LimpiarSueltas";
import NuevaObra from "./components/NuevaObra";

/**
 * El archivo, con la mano adentro.
 *
 * Es la grilla del sitio —mismas tres columnas, mismo cuadrado, mismo
 * aire— y no una tabla de administración. La razón es que lo que hay que
 * juzgar al cargar una obra no es si el año quedó bien escrito, sino cómo se
 * ve la pieza al lado de las otras; una lista de renglones de texto contesta
 * la primera pregunta y esconde la segunda.
 *
 * Lo único que se suma es la capa de control, y vive apoyada: los botones de
 * una pieza aparecen al pasar por encima, y el primer hueco de la grilla
 * —vacío, con filete punteado— es donde se carga una obra nueva.
 *
 * El orden de la grilla es el del sitio y se arrastra, así que la lista la
 * dibuja `ArchivoOrdenable`, que es cliente. El hueco de alta baja como
 * propiedad en vez de importarse allá adentro: no tiene un solo estado ni
 * escucha nada, y mandarlo desde acá lo deja donde estaba, del lado del
 * servidor.
 */
export default async function AdminPage() {
  const viva = await pingDb();

  if (!viva) {
    return (
      <section className="shell py-24">
        <h1 className="display-lead font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.15] text-balance">
          La base no contesta.
        </h1>
        <p className="prose-measure mt-5 text-ink-soft">
          El sitio necesita PostgreSQL levantado para leer el archivo. Arrancalo y volvé a
          cargar esta página.
        </p>
        {/*
          El comando exacto, porque el error útil es el que dice qué hacer.
          Va en un <code> y no en un bloque: es una línea, no un ejemplo.
        */}
        <p className="mt-6 text-sm text-ink-faint">
          En esta máquina:{" "}
          <code className="figures bg-paper-deep px-1.5 py-0.5 text-ink">
            brew services start postgresql@17
          </code>
        </p>
      </section>
    );
  }

  const obras = await listWorks();
  const conCloudinary = cloudinaryConfigurado();

  return (
    <section className="shell pt-8 pb-16 md:pt-12">
      {/*
        Sin las claves de Cloudinary se puede entrar, mirar y editar textos,
        pero no subir una imagen. El aviso va acá arriba y no escondido en el
        formulario: enterarse de que falta una variable de entorno recién
        después de elegir tres escaneos es enterarse tarde.
      */}
      {!conCloudinary && (
        <p className="mb-8 border-l border-accent bg-paper-deep/60 py-3 pl-4 text-sm text-ink">
          Faltan las claves de Cloudinary, así que no se pueden subir imágenes. Completá{" "}
          <code className="bg-paper px-1 py-0.5">CLOUDINARY_CLOUD_NAME</code>,{" "}
          <code className="bg-paper px-1 py-0.5">CLOUDINARY_API_KEY</code> y{" "}
          <code className="bg-paper px-1 py-0.5">CLOUDINARY_API_SECRET</code> en{" "}
          <code className="bg-paper px-1 py-0.5">.env.local</code> y reiniciá el servidor.
        </p>
      )}
      {/*
        Dos diferencias declaradas con la grilla del sitio, ninguna por
        olvido.

        La primera: allá la grilla no dibuja una sola palabra y acá cada pieza
        lleva título, año, técnica, cantidad de imágenes y el aviso de que le
        falta el texto. Es el punto de esta pantalla. Allá se viene a mirar la
        obra; acá se viene a saber cuál es cuál y qué le falta, y eso no se
        contesta mirando.

        La segunda: allá el teléfono muestra dos columnas y acá una. En media
        pantalla de teléfono, una celda con esa ficha más los tres controles
        que caen al pie cuando no hay puntero queda apretada.

        Lo que sí comparten, que es lo que hace que esta pantalla sirva, es el
        recorte y las proporciones de la celda: la pieza se ve acá como se va
        a ver publicada.
      */}
      <ArchivoOrdenable obras={obras} hueco={<NuevaObra />} />

      {/*
        El archivo vacío no dice «no hay nada»: dice qué pasa cuando haya algo.
        Sólo aparece cuando de verdad no hay obra cargada, y no compite con el
        hueco de alta, que ya está arriba a la izquierda.
      */}
      {obras.length === 0 && (
        <p className="prose-measure mt-10 text-sm text-ink-faint">
          El archivo está vacío. Cada obra que cargues aparece acá, y en el mismo orden y
          con el mismo recorte, en{" "}
          <Link href="/" className="link-underline text-ink-soft hover:text-ink">
            la portada del sitio
          </Link>
          .
        </p>
      )}

      {conCloudinary && <LimpiarSueltas />}
    </section>
  );
}
