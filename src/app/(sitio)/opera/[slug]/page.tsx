import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stampeDellOpera } from "@/lib/prodotti";
import { getWork, listSlugs } from "@/lib/works";
import { site } from "@/data/site";
import { immagineFerma } from "@/lib/video";
import { briciole, descrizioneBreve, JsonLd, openGraphPagina } from "@/lib/seo";
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

  // Senza testo, la descrizione dice almeno cos'è e di chi: «Illustrazione
  // digitale del 2025 di Benedetta Zibetti, illustratrice a Foligno».
  const detalle = `${work.tecnica} (${work.year}), di ${site.name}, ${site.role.toLowerCase()} a ${site.zona}.`;
  const description = work.description ? descrizioneBreve(work.description) : detalle;

  return {
    title: work.title,
    description,
    alternates: { canonical: `/opera/${slug}` },
    // Un'anteprima condivisa è sempre un'immagine: se la copertina è un
    // video, esce il suo fotogramma (lo fa `anteprimaOpera`).
    openGraph: openGraphPagina({
      path: `/opera/${slug}`,
      title: `${work.title} · ${site.name}`,
      description,
      immagine: work.image[0],
    }),
  };
}

export default async function OperaPage({ params }: Params) {
  const { slug } = await params;
  const work = await getWork(slug);
  if (!work) notFound();

  // Sin la tabla `prodotti` (base todavía sin migrar) la obra se ve igual,
  // sin el aviso de la stampa.
  const [stampa] = await stampeDellOpera(work.slug).catch(() => []);

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
    // Tutte le tavole, non solo la copertina: è da qui che Google Immagini
    // e Lens risalgono a questa pagina partendo da una qualunque di loro.
    image: work.image.map(immagineFerma),
    dateCreated: String(work.year),
    artMedium: work.tecnica,
    creator: { "@type": "Person", "@id": `${site.url}/#person`, name: site.signature },
    url: `${site.url}/opera/${slug}`,
  };

  return (
    <article className="shell pt-8 pb-12 md:pt-12">
      <JsonLd
        dati={[
          datiOpera,
          briciole([
            { nome: "Opere", path: "/" },
            { nome: work.title, path: `/opera/${slug}` },
          ]),
        ]}
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
