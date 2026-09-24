import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWork, listSlugs } from "@/lib/works";
import { site } from "@/data/site";
import BackToArchive from "../components/BackToArchive";
import WorkAside from "../components/WorkAside";
import WorkPager from "../components/WorkPager";
import WorkPlate, { WorkPlates } from "../components/WorkPlate";
import WorkTitle from "../components/WorkTitle";

type Params = { params: Promise<{ slug: string }> };

/**
 * Le pagine d'opera si generano in fase di build, una per riga della tabella.
 *
 * Un'opera caricata dopo la build non resta fuori: Next la risolve alla prima
 * visita, perché `dynamicParams` è true. E l'admin chiama `revalidatePath` a
 * ogni salvataggio, così una correzione si vede subito senza ricostruire il
 * sito.
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
        L'ordine della pagina, che è una decisione e non l'ordine in cui sono
        stati scritti i componenti: ritorno all'archivio, nome e testo, la
        prima tavola, le altre, la scheda e le vicine. È l'ordine del DOM e
        quello del telefono, dove tutto sta in fila.

        Da tablet in su lo stesso ordine si dispone in due colonne —la
        disposizione vive in `.opera`, in globals.css—: a sinistra nome,
        testo e scheda, a destra la prima tavola, e sotto le altre a due a
        due. Un solo albero per le due forme, così lettore di schermo e
        tastiera seguono sempre lo stesso filo.
      */}
      <BackToArchive />
      <div className="opera">
        <WorkTitle work={work} />
        <WorkPlate work={work} />
        <WorkPlates work={work} />
        <WorkAside work={work} />
      </div>
      <WorkPager slug={slug} />
    </article>
  );
}
