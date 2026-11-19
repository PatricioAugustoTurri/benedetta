import Link from "next/link";
import { ArrowLeft } from "@/components/Icon";

export default function IndietroAiConti({ mese }: { mese?: string }) {
  return (
    <Link
      href={mese ? `/admin/conti?mese=${mese}` : "/admin/conti"}
      className="group mb-8 inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
    >
      <ArrowLeft
        size={16}
        className="shrink-0 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-x-0.5"
      />
      <span className="link-underline">Ai conti</span>
    </Link>
  );
}
