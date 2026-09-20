import Link from "next/link";
import { ArrowLeft } from "@/components/Icon";

/** La vuelta al archivo, arriba de todo y antes de la obra. */
export default function BackToArchive() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
    >
      <ArrowLeft size={16} className="shrink-0" />
      <span className="link-underline">Archivio</span>
    </Link>
  );
}
