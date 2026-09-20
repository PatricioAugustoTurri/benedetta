import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getIllustration, illustrations } from "@/data/illustrations";
import { site } from "@/data/site";
import BackToArchive from "../components/BackToArchive";
import WorkDetails from "../components/WorkDetails";
import WorkPager from "../components/WorkPager";
import WorkPlate from "../components/WorkPlate";

type Params = { params: Promise<{ slug: string }> };

/** Las doce páginas se generan estáticas en el build. */
export function generateStaticParams() {
  return illustrations.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const item = getIllustration(slug);
  if (!item) return {};

  const detail = [item.client, item.medium, item.year].filter(Boolean).join(" · ");
  return {
    title: item.title,
    description: item.story ?? detail,
    openGraph: {
      title: `${item.title} · ${site.name}`,
      description: item.story ?? detail,
      images: [{ url: item.src, width: item.width, height: item.height, alt: item.alt }],
    },
  };
}

export default async function OperaPage({ params }: Params) {
  const { slug } = await params;
  const item = getIllustration(slug);
  if (!item) notFound();

  return (
    <article className="shell pt-8 md:pt-12">
      <BackToArchive />
      <WorkPlate item={item} />
      <WorkDetails item={item} />
      <WorkPager slug={slug} />
    </article>
  );
}
