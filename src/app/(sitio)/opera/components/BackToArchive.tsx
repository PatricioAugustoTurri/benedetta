import Link from "next/link";
import { ArrowLeft } from "@/components/Icon";

/** Il ritorno all'archivio, in cima a tutto e prima dell'opera. */
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
