import Link from "next/link";
import { ArrowLeft } from "@/components/Icon";
import { richiediAccesso } from "@/lib/auth";
import WorkForm from "../components/WorkForm";

export const metadata = { title: "Nuova opera" };

export default async function NuevaObraPage() {
  await richiediAccesso("/admin/nueva");
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
        <span className="link-underline">All&apos;archivio</span>
      </Link>

      <WorkForm />
    </section>
  );
}
