import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@/components/Icon";
import { getWorkById } from "@/lib/works";
import WorkForm from "../components/WorkForm";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  const obra = await getWorkById(Number(id));
  return { title: obra ? obra.title : "Obra" };
}

export default async function EditarObraPage({ params }: Params) {
  const { id } = await params;

  // `Number("nueva")` da NaN, no 0: sin esta guarda, una dirección inventada
  // llegaría a la base como consulta en vez de terminar en un 404.
  const numero = Number(id);
  if (!Number.isInteger(numero)) notFound();

  const obra = await getWorkById(numero);
  if (!obra) notFound();

  return (
    <section className="shell pt-8 pb-16 md:pt-12">
      <Link
        href="/admin"
        className="group mb-8 inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft
          size={16}
          className="shrink-0 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-x-0.5"
        />
        <span className="link-underline">Al archivo</span>
      </Link>

      <WorkForm obra={obra} />
    </section>
  );
}
