import Image from "next/image";
import Link from "next/link";
import { ArrowUp, ArrowUpRight, Mail } from "@/components/Icon";
import NewsletterForm from "@/components/NewsletterForm";
import Reveal from "@/components/Reveal";
import { footerNav, site } from "@/data/site";
import { shopCategories, shopHref } from "@/data/shop";
import { posts } from "@/data/instagram";

/**
 * El pie.
 *
 * Tres franjas separadas por filetes:
 *
 *   1. El canal       — la cinta de Instagram, para quien todavía no escribe.
 *   2. El índice      — marca, dirección, rutas, tienda, alta al correo.
 *   3. La letra chica — copyright y volver arriba.
 *
 * **El pie no cierra el sitio con un pedido.** Hubo una franja de apertura
 * con una frase grande y el mail, y se sacó a pedido del cliente: el archivo
 * termina en la obra y el pie es un índice, no una última insistencia. La
 * consecuencia es que la dirección de correo tiene que estar a la vista acá
 * abajo —es la única que queda fuera de /contatti—, y por eso va en la
 * columna de la firma con el sobre dibujado, que es el mismo gesto del
 * "Chiedi info" de cada obra.
 *
 * El filete de apertura vive en cada franja y no en el `<footer>`: si la
 * cinta se queda sin publicaciones no se dibuja, y un borde en el elemento
 * padre habría quedado pegado al de la franja siguiente, con dos hairlines
 * donde el sistema tiene una.
 *
 * Esto es un componente de servidor. Lo único cliente es el alta al correo,
 * que es un formulario; el resto del pie de cada página se sirve como HTML.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-28 md:mt-36">
      {/*
        La cinta de Instagram: las tres piezas que eligió ella, en fila. No es
        una segunda galería y por eso no se parece a la grilla de obra —ahí
        cada pieza guarda su proporción 3:4 y tiene título y ficha; acá son
        cuadrados mudos, que es lo que son en Instagram. La cinta dice "hay
        más y sigue en otro lado", no "mirá estas tres".

        El número de columnas sale de la lista y no está escrito a mano: con
        tres piezas la fila es de tres, y si mañana entra una cuarta se
        reparte sola en vez de dejar un hueco al margen.
      */}
      {posts.length > 0 && (
        <section className="shell border-t border-line py-10 md:py-12" aria-labelledby="footer-social">
          <Reveal>
            {/*
              A lo ancho, la cinta se comía la mitad de la pantalla y dejaba
              de ser una cinta: cuatro cuadrados de 300px compiten con la
              grilla de obra en vez de rematarla. Desde 768px pasa a la
              geometría que ya usan las páginas interiores —rótulo en la
              columna angosta de la izquierda, lámina en las ocho de la
              derecha— y las piezas bajan a unos 200px. En el teléfono no hay
              dos columnas que repartir, así que el rótulo va arriba, la cinta
              debajo, y a ese tamaño ya es una cinta sin ayuda.
            */}
            <div className="md:grid md:grid-cols-12 md:items-start md:gap-8">
              <div className="flex items-baseline justify-between gap-6 md:col-span-3 md:block">
                <h2 id="footer-social" className="label">
                  Segui il lavoro
                </h2>

              {/*
                Recorre `site.socials` en vez de escribir Instagram a mano: hoy
                hay una sola cuenta, pero Behance existe y le falta la URL, y
                el día que llegue tiene que aparecer acá sin tocar el pie.
              */}
                <ul className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm md:mt-4 md:block md:space-y-2">
                  {site.socials.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
                      >
                        <span className="link-underline">{s.label}</span>
                        <ArrowUpRight className="shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <ul
                style={{ gridTemplateColumns: `repeat(${posts.length}, minmax(0, 1fr))` }}
                className="mt-5 grid gap-2 md:col-span-8 md:col-start-5 md:mt-0 md:gap-3"
              >
                {posts.map((post) => (
                  <li key={post.id}>
                    <a
                      href={post.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group block overflow-hidden bg-paper-deep"
                    >
                      <Image
                        src={post.src}
                        alt={post.alt}
                        width={post.width}
                        height={post.height}
                        sizes="(min-width: 768px) 21vw, 33vw"
                        loading="lazy"
                        className="aspect-square w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </section>
      )}

      {/*
        El índice. Cuatro bloques sobre la grilla de 12 del sitio, con los
        mismos cortes de columna que usan las páginas interiores. En el
        teléfono es una pila; a 640px son dos columnas; recién a 768px se
        abre la grilla completa.

        Todo lo que cuelga de unas versalitas va a 14px, que es la regla que
        ya siguen la ficha de una obra y la columna lateral de contacto.
      */}
      <div className="shell border-t border-line py-12 md:py-16">
        {/*
          Dos columnas ya en el teléfono, no recién a 640px: Sito y Shop son
          listas de cuatro y cinco renglones cortos y apiladas obligaban a
          recorrer medio pie para llegar al final. La firma y el alta al
          correo sí toman el ancho entero, porque las dos llevan una frase.
        */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-12">
          <div className="col-span-2 md:col-span-3">
            {/*
              El logotipo sin link: es la firma al pie de la hoja, no un botón
              de vuelta al inicio —eso ya lo hacen el logotipo de la cabecera y
              "Opera" acá mismo, dos filas a la derecha. Acá el `alt` sí lleva
              el nombre, porque no hay un link con aria-label que lo diga.
            */}
            <Image
              src="/illustrando-wordmark.png"
              alt={site.name}
              width={740}
              height={147}
              sizes="150px"
              className="h-auto w-[150px]"
            />

            <p className="mt-4 text-sm text-ink-soft">
              {site.author}, {site.role.toLowerCase()}
            </p>
            <p className="text-sm text-ink-soft">{site.location}</p>

            {/*
              La única afirmación que el pie hace sobre el trabajo, y es la
              posición de la marca: el papel primero. Va en tinta pálida y
              acotada a la medida de lectura para que sea una nota al pie de
              la firma y no un párrafo de presentación.
            */}
            <p className="prose-measure mt-5 max-w-[34ch] text-sm leading-relaxed text-ink-faint">
              {site.craft}
            </p>

            {/*
              La dirección, que sin la franja de cierre es la única salida a un
              mail que hay fuera de /contatti. Va con el dibujo de la acción
              principal del sistema —sobre en tinta pálida que pasa a terracota
              al apoyarse, palabra subrayada de forma permanente— pero a 14px,
              como todo lo que vive en una columna del pie: es una dirección
              disponible, no el remate de la página.
            */}
            <a href={`mailto:${site.email}`} className="group mt-6 flex items-center gap-2 text-ink">
              <Mail
                size={18}
                className="shrink-0 text-ink-faint transition-colors group-hover:text-accent"
              />
              <span className="link-underline break-all text-sm" data-active="true">
                {site.email}
              </span>
            </a>
          </div>

          <nav className="md:col-span-2 md:col-start-5" aria-labelledby="footer-sito">
            <h2 id="footer-sito" className="label">
              Sito
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="link-underline text-ink-soft transition-colors hover:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/*
            Las categorías de tienda, enteras. En la cabecera son un
            desplegable que hay que provocar; acá quedan escritas, que es para
            lo que sirve un pie. Cada una sale por `shopHref`, la misma función
            que usan la barra y la página: el día que la tienda exista, esas
            cinco filas dejan de abrir un mail sin que este archivo se entere.
          */}
          <div className="md:col-span-2 md:col-start-7">
            <h2 className="label">Shop</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {shopCategories.map((c) => (
                <li key={c.slug}>
                  <a
                    href={shopHref(c)}
                    className="link-underline text-ink-soft transition-colors hover:text-ink"
                  >
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-3 md:col-start-10">
            <h2 className="label">Newsletter</h2>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/*
        La letra chica. Una sola fila: a la izquierda lo que hay que declarar,
        a la derecha la vuelta arriba. En el teléfono se apilan y la vuelta
        queda última, que es donde el pulgar ya está.
      */}
      <div className="shell border-t border-line py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="figures text-xs leading-relaxed text-ink-faint">
            © {year} {site.name}
            <span aria-hidden="true"> · </span>
            Tutte le illustrazioni sono opera dell&apos;autrice.
          </p>

          {/*
            `#top` no necesita un elemento con ese id: el HTML lo define como
            el principio del documento. Así la vuelta arriba es un link de
            verdad —tabula, se abre en pestaña nueva, funciona sin JavaScript—
            en vez de un botón con un listener, y hereda el scroll suave que
            ya está en `html`, con la parada que le pone movimiento reducido.
          */}
          <a
            href="#top"
            /*
              `py-2 -my-2` no cambia nada de lo que se ve y lleva el blanco de
              toque de 16 a 32px: dos palabras de 12px son el objetivo más
              chico del pie y en el teléfono quedan solas contra el borde.
            */
            className="group -my-2 inline-flex shrink-0 items-center gap-1.5 self-start py-2 text-xs text-ink-faint transition-colors hover:text-ink sm:self-auto"
          >
            <span className="link-underline">Torna su</span>
            <ArrowUp className="shrink-0 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
