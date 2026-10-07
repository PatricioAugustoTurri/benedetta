import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stampeDellOpera } from "@/lib/prodotti";
import { getWork, listSlugs } from "@/lib/works";
import { site } from "@/data/site";
import { immagineFerma } from "@/lib/video";
import BackToArchive from "../components/BackToArchive";
import WorkAside from "../components/WorkAside";
import WorkPager from "../components/WorkPager";
import WorkPlate, { WorkPlates } from "../components/WorkPlate";
import WorkTitle from "../components/WorkTitle";
import Visore from "../components/Visore";

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
    alternates: { canonical: `/opera/${slug}` },
    openGraph: {
      title: `${work.title} · ${site.name}`,
      description: work.description ?? detalle,
      images: portada
        ? [
            {
              // Un'anteprima condivisa è sempre un'immagine: se la copertina
              // è un video, esce il suo fotogramma.
              url: immagineFerma(portada),
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

  const portada = work.image[0];
  const [stampa] = await stampeDellOpera(work.slug);

  /*
    Dati strutturati per questa opera: quello che permette a Google Immagini
    e alla ricerca normale di sapere che questa non è una pagina qualsiasi ma
    un'opera —con autrice, tecnica e anno— invece di doverlo indovinare dal
    testo. `creator` ripete `site.signature` e non un link a `StructuredData`:
    quel componente descrive lei come persona una volta sola nel layout,
    questo descrive il pezzo.
  */
  const datiOpera = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: work.title,
    description: work.description ?? undefined,
    image: portada ? immagineFerma(portada) : undefined,
    dateCreated: String(work.year),
    artMedium: work.tecnica,
    creator: { "@type": "Person", name: site.signature },
    url: `${site.url}/opera/${slug}`,
  };

  return (
    <article className="shell pt-8 pb-12 md:pt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datiOpera) }}
      />
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
      <Visore titolo={work.title} immagini={work.image}>
        <div className="opera">
          <WorkTitle work={work} />
          <WorkPlate work={work} />
          <WorkPlates work={work} />
          <WorkAside work={work} stampa={stampa ?? null} />
        </div>
      </Visore>
      <WorkPager slug={slug} />
    </article>
  );
}
