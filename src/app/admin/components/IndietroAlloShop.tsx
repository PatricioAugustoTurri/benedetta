import Link from "next/link";
import { ArrowLeft } from "@/components/Icon";

export default function IndietroAlloShop() {
  return (
    <Link
      href="/admin/shop"
      className="group mb-8 inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
    >
      <ArrowLeft
        size={16}
        className="shrink-0 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-x-0.5"
      />
      <span className="link-underline">Allo Shop</span>
    </Link>
  );
}
