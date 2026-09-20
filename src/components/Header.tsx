"use client";

import Image from "next/image";
import Link from "next/link";
import ShopMenu from "@/components/ShopMenu";
import { ArrowRight, ChevronDown } from "@/components/Icon";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { nav, site } from "@/data/site";
import { shopCategories, shopHref } from "@/data/shop";

/*
  La clase del renglón del cajón vive acá para que el rótulo Shop, que es un
  botón y no un link, no tenga que repetirla y pueda desincronizarse.

  Los rótulos entran escalonados desde el borde derecho, en el mismo sentido
  en que llega el cajón. Al cerrar se van juntos y rápido: salir no es un
  momento, volver a la obra sí.

  No declara `display`: una ruta es `block` y Shop es `flex`, y si la clase
  compartida trajera uno de los dos, cuál gana lo decidiría el orden del CSS
  y no el que escribe el componente.
*/
const ITEM_DRAWER =
  "relative translate-x-5 border-b border-line py-4 font-display text-[clamp(0.625rem,3vw,0.875rem)] font-medium leading-tight text-ink-soft opacity-0 transition-[translate,opacity,color] duration-500 ease-[var(--ease-out-soft)] hover:text-ink data-[active=true]:text-ink group-data-[open=true]/drawer:translate-x-0 group-data-[open=true]/drawer:opacity-100";

/* Las filas de adentro del desplegable: sangradas, más chicas de tinta. */
const SUBITEM_DRAWER =
  "border-b border-line py-3 pl-3 text-[clamp(0.625rem,3vw,0.875rem)] leading-tight transition-colors hover:text-ink";

/*
  El escalonado del cajón, con el paso de 70ms del resto del sitio. Se numera
  a mano y no por índice de `nav` porque Shop se intercala después de Work sin
  estar en la lista: por índice, Shop y About compartían los 210ms y entraban
  pisadas. Al cerrar, todos a cero: salir no es un momento.
*/
const stagger = (open: boolean, n: number) => (open ? `${140 + n * 70}ms` : "0ms");

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
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
        La cabecera toma material en dos casos, y `:has()` cubre el segundo sin
        una sola variable de estado más:

        - Con obra pasando por debajo (`data-scrolled`) toma papel al 85% y
          desenfoque: es una barra, y una barra deja ver lo que pasa detrás.
        - Con la hoja de Shop abierta toma papel pleno. No es decoración: la
          hoja cuelga del filete de abajo del cartel —ése es el borde que le
          hace de tapa— así que arriba del todo, con la barra transparente,
          colgaría de nada. Y va plena, no al 85%, porque la hoja es plena y
          un escalón de tono en la juntura delataría que son dos cosas.

        El `!` es necesario: los dos selectores pesan lo mismo y sin él el
        orden del CSS decidiría cuál gana, que es exactamente lo que no se
        quiere que decida.
      */}
      <header
        data-scrolled={scrolled}
        className="sticky top-0 z-40 border-b border-transparent transition-[background-color,border-color,backdrop-filter] duration-300 has-[[data-shop-open=true]]:border-line/70 has-[[data-shop-open=true]]:bg-paper! data-[scrolled=true]:border-line/70 data-[scrolled=true]:bg-paper/85 data-[scrolled=true]:backdrop-blur-md"
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
              <Fragment key={item.href}>
                <Link
                  href={item.href}
                  data-active={isActive(item.href)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="link-underline text-[0.9375rem] text-ink-soft transition-colors hover:text-ink data-[active=true]:text-ink"
                >
                  {item.label}
                </Link>
                {/*
                  Shop va después de Work y no sale de `nav` porque no es una
                  ruta: es un disparador sin página propia.
                */}
                {item.href === "/" && <ShopMenu />}
              </Fragment>
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
            <Fragment key={item.href}>
            <Link
              href={item.href}
              onClick={() => close(false)}
              data-drawer-item
              data-active={isActive(item.href)}
              aria-current={isActive(item.href) ? "page" : undefined}
              /*
                El cuerpo va chico a pedido: la mitad exacta de lo que medía
                (10px en el teléfono más angosto, 14px al borde del cajón). Ya
                no lleva `display-section` porque a este tamaño dejó de ser un
                titular: el rastreo negativo de ese peldaño es corrección para
                cuerpos grandes y acá perjudicaría la lectura. Queda el peso
                500, que es lo que sostiene la legibilidad a 10px.
                El `py-4` no se toca: el área que se toca sigue midiendo lo
                mismo aunque la palabra sea más chica.
              */
              style={{ transitionDelay: stagger(open, i === 0 ? 0 : i + 1) }}
              className={`block ${ITEM_DRAWER}`}
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

            {/*
              En el cajón Shop no se parte como en la barra: el renglón entero
              despliega. Acá no hay hover que separe los dos gestos, así que un
              renglón partido pondría dos blancos de toque de 11px de alto uno
              al lado del otro —el que quiere ver las categorías y el que quiere
              la página— y errarle sería normal. Un solo control ancho abre, y
              la salida a /shop es la última fila de lo que abre.

              Y no se asoma una hoja: se abre en el sitio y empuja al resto
              hacia abajo. Mismo contenido, el gesto que el dedo sí tiene.
            */}
            {item.href === "/" && (
              <>
                <button
                  type="button"
                  data-drawer-item
                  aria-expanded={shopOpen}
                  aria-controls="shop-cajon"
                  data-open={shopOpen}
                  data-active={isActive("/shop")}
                  onClick={() => setShopOpen((v) => !v)}
                  style={{ transitionDelay: stagger(open, 1) }}
                  className={`group/shop flex w-full items-center justify-between gap-2 ${ITEM_DRAWER}`}
                >
                  <span>Shop</span>
                  {/*
                    El mismo chevron que el rótulo Shop de la barra, girado
                    180° al abrir. Es el mismo control diciendo lo mismo en
                    dos anchos de pantalla: dos signos distintos para eso
                    serían dos idiomas en la misma cabecera.
                  */}
                  <ChevronDown className="shrink-0 transition-transform duration-[380ms] ease-[var(--ease-out-soft)] group-data-[open=true]/shop:rotate-180" />
                </button>

                <ul
                  id="shop-cajon"
                  data-open={shopOpen}
                  className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-[380ms] ease-[var(--ease-out-soft)] data-[open=true]:grid-rows-[1fr]"
                >
                  <li className="min-h-0 overflow-hidden">
                    <ul>
                      {shopCategories.map((c) => (
                        <li key={c.slug}>
                          <a
                            href={shopHref(c)}
                            onClick={() => close(false)}
                            className={`block text-ink-faint ${SUBITEM_DRAWER}`}
                          >
                            {c.label}
                          </a>
                        </li>
                      ))}

                      {/*
                        La última fila cierra la lista y sale de ella: es la
                        única del grupo que lleva a una página —las categorías
                        abren el mail— y en el cajón es la única puerta a
                        /shop, porque acá el rótulo Shop despliega en vez de
                        navegar.

                        Se distingue por dos cosas y ninguna es color: la tinta
                        sube un escalón, de `ink-faint` a `ink-soft`, y lleva
                        la flecha dibujada al margen. La flecha hereda
                        `currentColor`, así que viaja con el renglón al pasar
                        por encima en vez de tener un estado propio.
                      */}
                      <li>
                        <Link
                          href="/shop"
                          onClick={() => close(false)}
                          data-active={isActive("/shop")}
                          aria-current={isActive("/shop") ? "page" : undefined}
                          className={`flex items-center justify-between gap-2 text-ink-soft data-[active=true]:text-ink ${SUBITEM_DRAWER}`}
                        >
                          <span>All</span>
                          <ArrowRight size={16} className="shrink-0" />
                        </Link>
                      </li>
                    </ul>
                  </li>
                </ul>
              </>
            )}
            </Fragment>
          ))}
        </nav>

        <div
          data-drawer-item
          className="translate-x-5 opacity-0 transition-[translate,opacity] duration-500 ease-[var(--ease-out-soft)] group-data-[open=true]/drawer:translate-x-0 group-data-[open=true]/drawer:opacity-100"
          style={{ transitionDelay: stagger(open, nav.length + 1) }}
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
