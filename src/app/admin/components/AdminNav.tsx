"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Le tre parti dell'admin. Client solo per sapere dove si è: la parte attiva
 * va in inchiostro pieno con la sottolineatura fissa, le altre in pallido.
 *
 * Il numero accanto è quanto c'è dentro —opere, prodotti, ordini da
 * spedire— in cifre tabulari, perché si legga senza aprire la pagina. Gli
 * ordini contano solo quelli da spedire: è l'unico numero dell'admin che
 * chiede di fare qualcosa.
 */
export default function AdminNav({
  conti,
}: {
  conti: { opere: number; prodotti: number; daSpedire: number } | null;
}) {
  const pathname = usePathname();
  const voci = [
    { href: "/admin", label: "Opere", n: conti?.opere, attiva: !/^\/admin\/(shop|ordini)/.test(pathname) },
    { href: "/admin/shop", label: "Shop", n: conti?.prodotti, attiva: pathname.startsWith("/admin/shop") },
    { href: "/admin/ordini", label: "Ordini", n: conti?.daSpedire, attiva: pathname.startsWith("/admin/ordini") },
  ];

  return (
    <nav aria-label="Admin" className="flex items-baseline gap-5">
      {voci.map((v) => (
        <Link
          key={v.href}
          href={v.href}
          aria-current={v.attiva ? "page" : undefined}
          className="group flex items-baseline gap-1.5 text-ink-faint transition-colors hover:text-ink aria-[current=page]:text-ink"
        >
          <span className="label link-underline text-inherit" data-active={v.attiva}>
            {v.label}
          </span>
          {v.n !== undefined && v.n > 0 && (
            <span
              className={`figures text-xs ${v.label === "Ordini" ? "text-accent" : "text-ink-faint"}`}
            >
              {v.n}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
