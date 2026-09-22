import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWork, listSlugs } from "@/lib/works";
import { site } from "@/data/site";
import BackToArchive from "../components/BackToArchive";
import WorkDetails from "../components/WorkDetails";
import WorkPager from "../components/WorkPager";
import WorkPlate from "../components/WorkPlate";
import WorkTitle from "../components/WorkTitle";

type Params = { params: Promise<{ slug: string }> };

/**
 * Las páginas de obra se generan en el build, una por fila de la tabla.
 *
 * Una obra cargada después del build no queda afuera: Next la resuelve en la
 * primera visita, porque `dynamicParams` viene en true. Y el admin llama a
 * `revalidatePath` en cada guardado, así que una corrección se ve enseguida
 * sin volver a construir el sitio.
 */
export async function generateStaticParams() {
  const slugs = await listSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWork(slug);
  if (!work) return {};

  const detalle = [work.tecnica, String(work.year)].join(" · ");
  const portada = work.image[0];

  return {
    title: work.title,
    description: work.description ?? detalle,
    openGraph: {
      title: `${work.title} · ${site.name}`,
      description: work.description ?? detalle,
      images: portada
        ? [
            {
              url: portada.url,
              width: portada.width,
              height: portada.height,
              alt: portada.alt,
            },
          ]
        : [],
    },
  };
}

export default async function OperaPage({ params }: Params) {
  const { slug } = await params;
  const work = await getWork(slug);
  if (!work) notFound();

  return (
    <article className="shell pt-8 pb-12 md:pt-12">
      {/*
        El orden de la página, que es una decisión y no el orden en que se
        fueron escribiendo los componentes: vuelta al archivo, nombre, obra,
        texto, y las vecinas. Se sabe qué se está por mirar antes de mirarlo, y
        lo que se lee después es contexto de algo ya visto.
      */}
      <BackToArchive />
      <WorkTitle work={work} />
      <WorkPlate work={work} />
      <WorkDetails work={work} />
      <WorkPager slug={slug} />
    </article>
  );
}
