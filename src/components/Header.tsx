"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { nav, site } from "@/data/site";

/*
  La clase del renglón del cajón.

  Los rótulos entran escalonados desde el borde derecho, en el mismo sentido
  en que llega el cajón. Al cerrar se van juntos y rápido: salir no es un
  momento, volver a la obra sí.
*/
const ITEM_DRAWER =
  "relative block translate-x-5 border-b border-line py-4 font-display text-[clamp(0.875rem,4vw,1.125rem)] font-medium leading-tight text-ink-soft opacity-0 transition-[translate,opacity,color] duration-500 ease-[var(--ease-out-soft)] hover:text-ink data-[active=true]:text-ink group-data-[open=true]/drawer:translate-x-0 group-data-[open=true]/drawer:opacity-100";

/*
  El escalonado del cajón, con el paso de 70ms del resto del sitio. Al cerrar,
  todos a cero: salir no es un momento.
*/
const stagger = (open: boolean, n: number) => (open ? `${140 + n * 70}ms` : "0ms");

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  // Cerrar con Escape, con la cruz o tocando el velo devuelve el foco al
  // control que abrió. Cerrar navegando no: ahí el foco es de la página nueva.
  const restoreFocus = useRef(true);

  const close = (restore = true) => {
    restoreFocus.current = restore;
    setOpen(false);
  };

  // Sin scroll no hay obra pasando por debajo, así que el fondo y el filete
  // sobran: la barra arranca limpia sobre el papel y toma cuerpo sólo cuando
  // empieza a haber algo que tapar.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Si la pantalla crece hasta escritorio, el menú vuelve a estar a la vista
  // bajo el logotipo y el cajón deja de tener sentido.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return;

    // El cajón es modal: el archivo de atrás no se recorre mientras esté abierto.
    const previousOverflow = document.body.style.overflow;
    const toggle = toggleRef.current;
    document.body.style.overflow = "hidden";

    // El foco entra al cajón y queda adentro: el logotipo y el resto de la
    // página siguen en el DOM y sin esto el tabulador se iría detrás del velo.
    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [],
      );

    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (restoreFocus.current) toggle?.focus();
      restoreFocus.current = true;
    };
  }, [open]);

  // "Work" vive en la raíz, así que también manda dentro de /opera/<slug>.
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/opera") : pathname.startsWith(href);

  // El glifo de 20px queda alineado con el margen de página: el botón mide 40
  // y el ícono va centrado, así que el cuadro sobresale media diferencia.
  const controlInset = "right-[calc(var(--gutter)-0.625rem)] top-3";

  return (
    <>
      {/*
        La cabecera toma material sólo con obra pasando por debajo
        (`data-scrolled`): papel al 85% y desenfoque. Es una barra, y una
        barra deja ver lo que pasa detrás. Arriba del todo no hay nada que
        tapar, así que arranca limpia sobre el papel.
      */}
      <header
        data-scrolled={scrolled}
        className="sticky top-0 z-40 border-b border-transparent transition-[background-color,border-color,backdrop-filter] duration-300 data-[scrolled=true]:border-line/70 data-[scrolled=true]:bg-paper/85 data-[scrolled=true]:backdrop-blur-md"
      >
        {/*
          Cartel centrado: el logotipo manda y el menú se apoya justo debajo.
          En teléfono los rótulos se mudan al cajón y acá queda sólo la firma.
        */}
        <div className="shell relative flex flex-col items-center py-4 md:py-5">
          {/*
            El logotipo es la letra de ella, escaneada y recortada: no hay
            tipografía que lo componga. Va con alt vacío a propósito —el
            nombre accesible ya lo da el aria-label del link, y repetirlo en
            la imagen lo haría anunciar dos veces.
            width/height son los del archivo, para que el hueco esté reservado
            antes de que cargue y la cabecera no salte.
          */}
          <Link href="/" className="block" aria-label={`${site.name} — archivio`}>
            <Image
              src="/illustrando-wordmark.png"
              alt=""
              width={740}
              height={147}
              priority
              sizes="(min-width: 768px) 240px, 180px"
              className="h-auto w-[180px] md:w-[240px]"
            />
          </Link>

          {/*
            El hueco es chico y va medido desde el borde del logotipo: el
            recorte está ajustado a la tinta, sin margen horneado, así que
            este gap es exactamente el que se ve. Más aire y el menú dejaría
            de leerse como parte del mismo cartel.
          */}
          <nav
            className="mt-2 hidden items-center gap-8 md:mt-2.5 md:flex md:gap-10"
            aria-label="Navigazione principale"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-active={isActive(item.href)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="link-underline text-[0.9375rem] text-ink-soft transition-colors hover:text-ink data-[active=true]:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="menu-cajon"
            className={`absolute ${controlInset} flex h-10 w-10 items-center justify-center md:hidden`}
          >
            <span className="sr-only">Apri menu</span>
            {/* Dos filetes del mismo grosor que el trazo de los íconos. */}
            <span aria-hidden="true" className="relative block h-2.5 w-5">
              <span className="absolute left-0 top-0 block h-px w-full bg-ink" />
              <span className="absolute bottom-0 left-0 block h-px w-full bg-ink" />
            </span>
          </button>
        </div>
      </header>

      {/*
        Velo: la mitad que queda a la vista sigue siendo el archivo, pero
        atenuado y fuera de foco, así el cajón se lee como una capa encima
        y no como una columna más de la página.
      */}
      <div
        data-drawer-scrim
        data-open={open}
        onClick={() => close()}
        aria-hidden="true"
        className="fixed inset-0 z-50 bg-ink/20 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 ease-[var(--ease-out-soft)] data-[open=false]:pointer-events-none data-[open=true]:opacity-100 md:hidden"
      />

      {/*
        Cajón de media pantalla. Papel sobre papel: lo que lo separa del
        archivo es un filete y un escalón de tono, no una sombra.
      */}
      <div
        ref={panelRef}
        id="menu-cajon"
        data-drawer
        data-open={open}
        inert={!open}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="group/drawer fixed inset-y-0 right-0 z-50 flex w-1/2 translate-x-full flex-col justify-between overflow-y-auto overscroll-contain border-l border-line bg-paper px-[var(--gutter)] pb-10 pt-24 transition-transform duration-[440ms] ease-[var(--ease-out-soft)] data-[open=false]:duration-[280ms] data-[open=true]:translate-x-0 md:hidden"
      >
        <button
          type="button"
          onClick={() => close()}
          className={`absolute ${controlInset} flex h-10 w-10 items-center justify-center`}
        >
          <span className="sr-only">Chiudi menu</span>
          {/*
            Los mismos dos filetes del botón de abrir, ya cruzados: el control
            no cambia de forma al abrirse el cajón, cambia de estado.
          */}
          <span aria-hidden="true" className="relative block h-2.5 w-5">
            <span className="absolute left-0 top-1/2 block h-px w-full -translate-y-1/2 rotate-45 bg-ink" />
            <span className="absolute left-0 top-1/2 block h-px w-full -translate-y-1/2 -rotate-45 bg-ink" />
          </span>
        </button>

        <nav className="border-t border-line" aria-label="Navigazione principale">
          {nav.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => close(false)}
              data-drawer-item
              data-active={isActive(item.href)}
              aria-current={isActive(item.href) ? "page" : undefined}
              /*
                El cuerpo lo fija el cliente, y se movió dos veces: llegó a ser
                un titular, se pidió la mitad exacta (10px en el teléfono más
                angosto, 14px al borde del cajón) y ahora un peldaño para
                arriba, 14px a 18px. Ese es el punto donde se lee sin esfuerzo
                y todavía no vuelve a ser un titular que compita con el
                logotipo que tiene encima.

                Sigue sin `display-section`: el rastreo negativo de ese peldaño
                es corrección para cuerpos grandes y a este tamaño
                perjudicaría la lectura. Queda el peso 500.

                El `py-4` no se toca. El área que se toca la fija el padding y
                no la palabra, así que ya medía bien a 10px y mide igual acá:
                agrandar el rótulo mejora la lectura sin mover el blanco.
              */
              style={{ transitionDelay: stagger(open, i) }}
              className={ITEM_DRAWER}
            >
              {/*
                La marca del lugar donde está, en el margen para no comerle
                ancho al rótulo: terracota como marca, nunca como campo.
              */}
              {isActive(item.href) && (
                <span
                  aria-hidden="true"
                  className="absolute -left-3 top-1/2 block h-1 w-1 -translate-y-1/2 rounded-full bg-accent"
                />
              )}
              {item.label}
            </Link>
          ))}
        </nav>

        <div
          data-drawer-item
          className="translate-x-5 opacity-0 transition-[translate,opacity] duration-500 ease-[var(--ease-out-soft)] group-data-[open=true]/drawer:translate-x-0 group-data-[open=true]/drawer:opacity-100"
          style={{ transitionDelay: stagger(open, nav.length) }}
        >
          <p className="label">Scrivimi</p>
          <a
            href={`mailto:${site.email}`}
            onClick={() => close(false)}
            className="link-underline mt-2 block break-all text-xs text-ink-soft transition-colors hover:text-ink"
          >
            {site.email}
          </a>
        </div>
      </div>
    </>
  );
}
