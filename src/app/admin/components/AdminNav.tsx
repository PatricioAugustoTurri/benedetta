"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Le tre parti dell'admin. Client solo per sapere dove si è: la parte attiva
 * va in inchiostro pieno con la sottolineatura fissa, le altre in pallido.
 *
 * Il numero accanto è quanto c'è dentro —opere, prodotti, ordini da
 * spedire, novità da annunciare— in cifre tabulari, perché si legga senza
 * aprire la pagina. Ordini e newsletter contano solo quello che chiede di fare
 * qualcosa, e per questo vanno in terracotta.
 */
export default function AdminNav({
  conti,
}: {
  conti: { opere: number; prodotti: number; daSpedire: number; novita: number | null } | null;
}) {
  const pathname = usePathname();
  const voci = [
    { href: "/admin", label: "Opere", n: conti?.opere, attiva: !/^\/admin\/(shop|ordini|newsletter)/.test(pathname) },
    { href: "/admin/shop", label: "Shop", n: conti?.prodotti, attiva: pathname.startsWith("/admin/shop") },
    { href: "/admin/ordini", label: "Ordini", n: conti?.daSpedire, attiva: pathname.startsWith("/admin/ordini") },
    {
      href: "/admin/newsletter",
      label: "Newsletter",
      n: conti?.novita ?? undefined,
      attiva: pathname.startsWith("/admin/newsletter"),
    },
  ];

  return (
    <nav aria-label="Admin" className="flex min-w-0 items-baseline gap-3.5 overflow-x-auto [scrollbar-width:none] sm:gap-5">
      {voci.map((v) => (
        <Link
          key={v.href}
          href={v.href}
          aria-current={v.attiva ? "page" : undefined}
          className="group flex shrink-0 items-baseline gap-1.5 text-ink-faint transition-colors hover:text-ink aria-[current=page]:text-ink"
        >
          <span className="label link-underline text-inherit" data-active={v.attiva}>
            {v.label}
          </span>
          {v.n !== undefined && v.n > 0 && (
            <span
              className={`figures text-xs ${v.label === "Ordini" || v.label === "Newsletter" ? "text-accent" : "text-ink-faint"}`}
            >
              {v.n}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
