import Header from "@/components/Header";
import Footer from "@/components/Footer";

/**
 * El sitio público: todo lo que ve un visitante.
 *
 * Existe separado del layout raíz desde que entró `/admin`. El admin vive en
 * el mismo árbol y no quiere ni la cabecera ni el pie —un menú a Works,
 * About me y Contatti arriba de una pantalla de carga es ruido, y el pie con
 * el alta al correo, directamente otra conversación—. El grupo entre
 * paréntesis no toca ninguna URL: `(sitio)/page.tsx` sigue siendo `/`.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
      >
        Saltar al contenido
      </a>
      <Header />
      {/*
        El sitio no se corre de costado. Nada acá se lee a lo ancho, así que
        un desborde horizontal nunca es contenido: es el sobrante de algo que
        se movió —una pieza entrando desde su columna, un filete de más— y
        deja la página arrastrable un par de centímetros. En el escritorio
        casi no se nota; en el teléfono se siente como un sitio flojo.

        Va acá y no en `html` ni en `body`: el overflow de esos dos se
        propaga al viewport, y ahí `clip` se ignora. Medido, no supuesto.
        `main` es un elemento común, así que corta de verdad, y cubre todo
        lo que dibuja una página sin tocar la cabecera ni las capas fijas,
        que son hermanas suyas.

        `clip` y no `hidden`: `hidden` haría de esto un contenedor de scroll
        —adiós `position: sticky` de lo que viva adentro— y `clip` corta sin
        crearlo. El par vertical queda en `visible` y la página sigue
        bajando normalmente.
      */}
      <main id="contenido" className="flex-1 overflow-x-clip">
        {children}
      </main>
      <Footer />
    </>
  );
}
