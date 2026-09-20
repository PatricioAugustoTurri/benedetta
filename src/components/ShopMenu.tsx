"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "@/components/Icon";
import { shopCategories, shopHref } from "@/data/shop";

/**
 * "Shop" en la barra: un rótulo que hace dos cosas.
 *
 * Son dos controles, no uno con dos significados. La palabra es un link a
 * `/shop`, el índice completo de categorías; el chevron de al lado es un
 * botón que asoma la hoja. Se ven como una sola cosa —el subrayado y el
 * cambio de tinta los recorren juntos— pero cada uno tiene su propio destino,
 * su propio foco y su propia área de toque.
 *
 * Partirlo es lo que hace que el gesto no sea ambiguo. Un solo elemento que
 * navegue al hacer click y despliegue al pasar el mouse deja sin salida al
 * que no tiene mouse: en una tablet el mismo toque tendría que elegir entre
 * ir a la página y abrir el menú, y elija lo que elija se lleva puesto el
 * otro. Con dos controles, el dedo toca lo que quiere.
 *
 * Los tres gestos, entonces:
 *
 * - **Mouse:** apoyarlo en cualquier parte del conjunto asoma la hoja, con
 *   140ms de demora para que cruzar el rótulo camino a otro no la dispare, y
 *   220ms al salir, para que el viaje del cursor desde el rótulo hasta la
 *   hoja no la cierre en el medio. El viaje es corto —el hueco es el margen
 *   de abajo del cartel— así que 220ms alcanzan. El click va a la página.
 * - **Teclado:** el link navega con Enter; el chevron es un `button` con
 *   `aria-expanded`, así que abre con Enter o Espacio. No abre al recibir
 *   foco: un panel que se despliega solo por tabular sorprende. Mientras el
 *   foco esté adentro queda abierto; al salir del conjunto se cierra, y
 *   Escape lo cierra devolviendo el foco al chevron, que es lo que lo abrió.
 * - **Dedo:** la palabra lleva a la página, el chevron abre la hoja. Por eso
 *   la entrada del puntero sólo cuenta si `pointerType` es mouse — si no, el
 *   mismo toque abriría y cerraría.
 *
 * Cerrada, la hoja queda `inert`: fuera del orden de tabulación y del árbol
 * de accesibilidad, para que no se pueda tabular a categorías invisibles.
 */
export default function ShopMenu() {
  const pathname = usePathname();
  const onShop = pathname.startsWith("/shop");
  const [open, setOpen] = useState(false);
  const [gap, setGap] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const disclosureRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const schedule = (next: boolean, delay: number) => {
    cancel();
    timer.current = setTimeout(() => setOpen(next), delay);
  };

  useEffect(() => cancel, [cancel]);

  /*
    La hoja cuelga del filete de abajo del cartel, no del rótulo: ése es el
    borde que le hace de tapa, y por eso no lleva borde arriba. El trecho que
    va del rótulo a ese filete es el margen inferior de la cabecera, que
    cambia con el breakpoint, así que se mide en vez de escribirse: se lee la
    distancia entre el pie de este bloque y el pie del cartel, y se vuelve a
    leer cuando la cabecera cambia de alto.

    Se posiciona `absolute` y no `fixed` a propósito: la cabecera toma
    `backdrop-filter` al hacer scroll, y un ancestro con filtro pasa a ser el
    bloque contenedor de todo descendiente `fixed`. Con `absolute` el ancla es
    este bloque —el rótulo— y la hoja queda centrada sobre él pase lo que pase
    con la cabecera.
  */
  useEffect(() => {
    const root = rootRef.current;
    const header = root?.closest("header");
    if (!root || !header) return;
    const measure = () =>
      setGap(header.getBoundingClientRect().bottom - root.getBoundingClientRect().bottom);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      cancel();
      setOpen(false);
      disclosureRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, cancel]);

  return (
    /*
      `data-shop-open` lo lee la cabecera con `:has()` para tomar papel, filete
      y desenfoque mientras la hoja está abierta, aunque la página esté arriba
      del todo. Sin eso la hoja colgaría de un borde que no está dibujado.
    */
    <div
      ref={rootRef}
      data-shop-open={open}
      className="relative"
      onPointerEnter={(e) => e.pointerType === "mouse" && schedule(true, 140)}
      onPointerLeave={(e) => e.pointerType === "mouse" && schedule(false, 220)}
      onFocus={cancel}
      onBlur={(e) => {
        // No cierra al pasar de una categoría a la siguiente dentro de la hoja.
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        cancel();
        setOpen(false);
      }}
    >
      {/*
        Los dos controles viven en el mismo renglón y comparten estado visual:
        `link-underline-host` hace que el subrayado de la palabra se dibuje
        también cuando el mouse o el foco están en el chevron, así el par se
        lee como un rótulo y no como dos cosas que quedaron pegadas.
      */}
      {/*
        Dos atributos y no uno: `data-open` es el estado de la hoja y lo lee
        sólo el giro del chevron; `data-active` es "acá estás", que vale con
        la hoja abierta y también parado en /shop. Juntos, el chevron
        aparecería girado al entrar a la página con el menú cerrado.
      */}
      <div
        data-open={open}
        data-active={open || onShop}
        className="group/shop link-underline-host flex items-center text-[0.9375rem] text-ink-soft transition-colors hover:text-ink data-[active=true]:text-ink"
      >
        <Link
          href="/shop"
          aria-current={onShop ? "page" : undefined}
          /*
            Cerrar al navegar. Es el único link de este conjunto que lleva a
            una página —las categorías abren el mail y no mueven nada— y al
            hacerle click el mouse se queda encima, así que el cierre por
            salida del puntero no llega nunca. Sin esto, la hoja quedaba
            abierta encima del índice que acababa de abrir: el mismo contenido
            dos veces.
          */
          onClick={() => {
            cancel();
            setOpen(false);
          }}
          /*
            El subrayado va en la palabra y no en el conjunto: si lo llevara
            el conjunto, la línea pasaría también por debajo del chevron.
            Se dibuja con la hoja abierta igual que con la página abierta —en
            este sitio el estado activo es el mismo trazo que el hover, así
            que estar mirando las categorías se ve como ya haberlas tocado.
          */
          className="link-underline"
          data-active={open || onShop}
        >
          Shop
        </Link>

        {/*
          El botón que asoma la hoja. Va con `pl-1.5 pr-1 -mr-1` y no con un
          `gap`: el hueco entre la palabra y el chevron tiene que ser área
          tocable del botón, no tierra de nadie, y el margen negativo devuelve
          el relleno de la derecha para que el rótulo siga midiendo lo que se
          ve y los 2.5rem de separación del menú no se corran.
        */}
        <button
          ref={disclosureRef}
          type="button"
          aria-expanded={open}
          aria-controls="shop-submenu"
          aria-label="Categorie"
          onClick={() => {
            cancel();
            setOpen((v) => !v);
          }}
          className="-mr-1 flex items-center py-1 pl-1.5 pr-1"
        >
          {/*
            Gira 180° con el mismo beat de 420ms con el que se desenrolla la
            hoja: es un solo movimiento contado dos veces, no dos animaciones.
          */}
          <ChevronDown className="shrink-0 transition-transform duration-[420ms] ease-[var(--ease-out-soft)] group-data-[open=true]/shop:rotate-180" />
        </button>
      </div>

      {/*
        Una hoja de 19rem centrada bajo el rótulo, no una banda de borde a
        borde. Chica necesita costados, y en este sistema no hay sombras que
        se los dibujen: se los dibujan tres filetes de `line` —izquierda,
        derecha y pie— mientras la tapa es el filete de la cabecera, del que
        cuelga. Son tres bordes de un hilo, no un recuadro de cuatro lados:
        arriba no hay nada que cerrar porque no hay nada que separar.

        El papel va pleno, no al 95% con desenfoque como la barra. Una barra es
        algo a través de lo cual se ve; una hoja no. Al 95% la obra de atrás se
        adivinaba entre los nombres, y una obra fantasma bajo un menú no es
        material, es suciedad. Por eso la cabecera también pasa a papel pleno
        mientras la hoja está abierta: el cartel y lo que cuelga de él son la
        misma hoja, sin escalón de tono en la juntura.

        Y se superpone en vez de empujar: un menú que corre la página hacia
        abajo al pasar el mouse es una trampa, no una transición.
      */}
      <div
        id="shop-submenu"
        inert={!open}
        data-open={open}
        style={{ top: `calc(100% + ${gap}px)` }}
        className="group/panel pointer-events-none absolute left-1/2 z-10 w-[19rem] -translate-x-1/2 border-x border-b border-line/0 bg-paper/0 transition-[background-color,border-color] duration-[420ms] ease-[var(--ease-out-soft)] data-[open=true]:pointer-events-auto data-[open=true]:border-line data-[open=true]:bg-paper"
      >
        {/*
          El desenrollado: la fila pasa de 0fr a 1fr, así el alto lo pone el
          contenido y no un número mágico que se desactualiza cuando cambian
          las categorías.
        */}
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-[420ms] ease-[var(--ease-out-soft)] group-data-[open=true]/panel:grid-rows-[1fr]">
          <div className="min-h-0 overflow-hidden">
            <div className="px-5 pb-5 pt-2">
              {/*
                Sin rótulo "Categorie" encima: la hoja ya lleva el nombre del
                control que la abrió, y un título adentro sería decirlo dos
                veces. El nombre accesible de la lista lo pone `aria-label`.
              */}
              <ul aria-label="Categorie">
                {shopCategories.map((c, i) => (
                  <li key={c.slug}>
                    <a
                      href={shopHref(c)}
                      data-shop-item
                      /*
                        Entran escalonadas con el paso de 70ms del resto del
                        sitio, arrancando a los 90ms para que la última llegue
                        antes de que termine el desenrollado. Al cerrar se van
                        juntas y sin retardo: salir no es un momento.
                      */
                      style={{ transitionDelay: open ? `${90 + i * 70}ms` : "0ms" }}
                      className="group relative block -translate-y-1.5 border-b border-line py-3 opacity-0 transition-[translate,opacity] duration-500 ease-[var(--ease-out-soft)] group-data-[open=true]/panel:translate-y-0 group-data-[open=true]/panel:opacity-100"
                    >
                      {/*
                        La marca del lugar, en el margen para que los nombres
                        queden a plomo: terracota como marca, nunca como campo.
                      */}
                      <span
                        aria-hidden="true"
                        className="absolute -left-2.5 top-[1.0625rem] block h-1 w-1 rounded-full bg-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      />
                      <span className="block text-[0.9375rem] leading-snug text-ink-soft transition-colors group-hover:text-ink">
                        {c.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-faint">
                        {c.note}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              <p
                data-shop-item
                style={{
                  transitionDelay: open ? `${90 + shopCategories.length * 70}ms` : "0ms",
                }}
                className="mt-4 -translate-y-1.5 text-balance text-xs leading-relaxed text-ink-faint opacity-0 transition-[translate,opacity] duration-500 ease-[var(--ease-out-soft)] group-data-[open=true]/panel:translate-y-0 group-data-[open=true]/panel:opacity-100"
              >
                Todavía no hay tienda: cada categoría abre un mail.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
