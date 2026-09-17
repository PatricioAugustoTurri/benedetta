import Link from "next/link";
import { nav, site } from "@/data/site";

export default function Footer() {
  return (
    <footer className="mt-32 border-t border-line">
      <div className="shell flex flex-col gap-10 py-14 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-2xl tracking-tight">{site.name}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {site.role} · {site.location}
          </p>
          <a
            href={`mailto:${site.email}`}
            className="link-underline mt-4 inline-block text-sm text-ink"
          >
            {site.email}
          </a>
        </div>

        <div className="flex flex-col gap-8 sm:flex-row sm:gap-16">
          <nav aria-label="Secciones">
            <p className="eyebrow mb-3">Sitio</p>
            <ul className="space-y-2 text-sm">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="link-underline text-ink-soft hover:text-ink">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="eyebrow mb-3">Redes</p>
            <ul className="space-y-2 text-sm">
              {site.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link-underline text-ink-soft hover:text-ink"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="shell border-t border-line py-6">
        <p className="text-xs text-ink-faint">
          © {new Date().getFullYear()} {site.name}. Todas las ilustraciones son obra de su autora.
        </p>
      </div>
    </footer>
  );
}
