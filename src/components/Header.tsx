"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Cart, Close } from "@/components/Icon";
import { nav, site } from "@/data/site";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Sin scroll no hay obra pasando por debajo, así que el fondo y el filete
  // sobran: la barra arranca limpia sobre el papel y toma cuerpo sólo cuando
  // empieza a haber algo que tapar.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  // "Work" vive en la raíz, así que también manda dentro de /opera/<slug>.
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/opera") : pathname.startsWith(href);

  return (
    <>
      <header
        data-scrolled={scrolled}
        className="sticky top-0 z-40 border-b border-transparent transition-colors duration-300 data-[scrolled=true]:border-line/70 data-[scrolled=true]:bg-paper/85 data-[scrolled=true]:backdrop-blur-md"
      >
        {/*
          Tres columnas con los costados del mismo ancho: así el menú queda
          centrado respecto de la página y no respecto del hueco que dejan
          el logotipo y el carrito, que miden distinto.
        */}
        <div className="shell grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-20">
          <Link
            href="/"
            className="col-start-1 justify-self-start font-mark text-[2rem] leading-none lowercase md:text-[2.5rem]"
            aria-label={`${site.name} — archivio`}
          >
            {site.name}
          </Link>

          <nav
            className="col-start-2 hidden items-center gap-10 md:flex"
            aria-label="Navigazione principale"
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

          {/*
            col-start-3 explícito: al ocultarse el menú en móvil su celda deja de
            existir y, sin esto, los íconos se corren a la columna del medio.
          */}
          <div className="col-start-3 flex items-center justify-end gap-1">
            {/*
              Todavía no hay tienda: la compra se arregla por mail. El carrito
              lleva a contacto para no ser un control que no hace nada.
            */}
            <Link
              href="/contatti"
              className="-mr-2 flex h-10 w-10 items-center justify-center text-ink-soft transition-colors hover:text-ink md:mr-0"
              aria-label="Consultar por una obra"
            >
              <Cart size={24} />
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="menu-movil"
              className="-mr-2 flex h-10 w-10 items-center justify-center md:hidden"
            >
              <span className="sr-only">{open ? "Chiudi menu" : "Apri menu"}</span>
              {open ? (
                <Close size={22} />
              ) : (
                /* Dos filetes del mismo grosor que el trazo de los íconos. */
                <span aria-hidden="true" className="relative block h-2.5 w-5">
                  <span className="absolute left-0 top-0 block h-px w-full bg-ink" />
                  <span className="absolute bottom-0 left-0 block h-px w-full bg-ink" />
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Menú móvil a pantalla completa. Hermano del header, no descendiente. */}
      <div
        id="menu-movil"
        hidden={!open}
        className="fixed inset-x-0 top-16 bottom-0 z-30 bg-paper md:hidden"
      >
        <nav className="shell flex flex-col gap-2 pt-8" aria-label="Navigazione principale">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="border-b border-line py-5 font-display text-3xl tracking-tight"
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
