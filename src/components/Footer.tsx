import Link from "next/link";
import { ArrowUpRight } from "@/components/Icon";
import { footerNav, site } from "@/data/site";

export default function Footer() {
  return (
    <footer className="mt-28 border-t border-line md:mt-36">
      <div className="shell flex flex-col gap-10 py-14 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mark text-3xl leading-none lowercase">{site.name}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {site.author} · {site.role} · {site.location}
          </p>
          <a
            href={`mailto:${site.email}`}
            className="link-underline mt-4 inline-block text-sm text-ink"
          >
            {site.email}
          </a>
        </div>

        <div className="flex flex-col gap-8 sm:flex-row sm:gap-16">
          <nav aria-labelledby="footer-sito">
            <h2 id="footer-sito" className="label mb-3">
              Sito
            </h2>
            <ul className="space-y-2 text-sm">
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="link-underline text-ink-soft hover:text-ink">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="label mb-3">Social</h2>
            <ul className="space-y-2 text-sm">
              {site.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group inline-flex items-center gap-1.5 text-ink-soft hover:text-ink"
                  >
                    <span className="link-underline">{s.label}</span>
                    <ArrowUpRight className="shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="shell border-t border-line py-6">
        <p className="figures text-xs text-ink-faint">
          © {new Date().getFullYear()} {site.name}. Todas las ilustraciones son obra de su autora.
        </p>
      </div>
    </footer>
  );
}
