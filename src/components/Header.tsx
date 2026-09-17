"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, site } from "@/data/site";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Si la pantalla crece hasta desktop, el menú móvil deja de tener sentido.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Bloquea el scroll del fondo mientras el menú está abierto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <div className="shell flex h-16 items-center justify-between md:h-20">
          <Link
            href="/"
            className="font-display text-xl tracking-tight lowercase md:text-2xl"
            aria-label={`${site.name} — inicio`}
          >
            {site.name}
          </Link>

          <nav
            className="hidden items-center gap-10 md:flex"
            aria-label="Navegación principal"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-active={isActive(item.href)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="link-underline text-sm text-ink-soft transition-colors hover:text-ink data-[active=true]:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-movil"
            className="-mr-2 flex h-10 w-10 items-center justify-center md:hidden"
          >
            <span className="sr-only">
              {open ? "Cerrar menú" : "Abrir menú"}
            </span>
            <span aria-hidden="true" className="relative block h-3 w-5">
              <span
                className={`absolute left-0 block h-px w-full bg-ink transition-all duration-300 ${
                  open ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 block h-px w-full bg-ink transition-all duration-300 ${
                  open ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Menú móvil a pantalla completa. Hermano del header, no descendiente. */}
      <div
        id="menu-movil"
        hidden={!open}
        className="fixed inset-x-0 top-16 bottom-0 z-30 bg-paper md:hidden"
      >
        <nav
          className="shell flex flex-col gap-2 pt-8"
          aria-label="Navegación principal"
        >
          {nav.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="border-b border-line py-5 font-display text-3xl tracking-tight"
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={`mailto:${site.email}`}
            onClick={() => setOpen(false)}
            className="mt-8 text-sm text-ink-soft"
          >
            {site.email}
          </a>
        </nav>
      </div>
    </>
  );
}
