# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Tres audiencias confirmadas, todas llegan al mismo sitio:

1. **Editoriales y revistas** — directores de arte y editores que evalúan a quién
   encargarle una ilustración. Miran rango, oficio y consistencia antes de escribir.
2. **Estudios y agencias** — equipos de diseño que buscan ilustración para proyectos
   de marca o campaña.
3. **Quien compra impresiones** — público que llega por Instagram y quiere una lámina
   o un original.

Hoy las tres terminan en el mismo lugar: un mail. El sitio todavía no cierra ventas ni
contratos. La tienda está planeada y cuando entre va a partir esa audiencia en dos: el
editor va a seguir escribiendo, el que compra una lámina va a querer comprarla ahí mismo.

## Product Purpose

Portfolio de ilustración de Benedetta, que trabaja bajo la marca **Illustrando**.
El sitio existe para que alguien que no la conoce vea la obra, entienda qué tipo de
encargo puede hacerle, y escriba. El éxito es una consulta bien planteada —con
proyecto, plazo y formato— en lugar de un ida y vuelta largo.

## Positioning

Ilustración hecha a mano primero: acuarela, gouache y lápiz sobre papel, con paso a
digital sólo cuando el encargo lo pide. Ese orden —analógico como origen, digital como
entrega— es la posición, y no es la que declara un ilustrador que trabaja nativamente
en digital.

## Operating Context

- Ella trabaja desde **Foligno, Umbría**. Es una ciudad chica del centro de Italia:
  el mercado que busca no está en su puerta, así que el sitio es su vía de acceso
  a editoriales y estudios de Milán, Bolonia y Roma, no un complemento del boca a boca.
- El sitio va a estar **en italiano**. Su mercado primario es italiano: editoriales,
  revistas y estudios de ahí.
- Instagram es hoy su canal de descubrimiento real y activo: la mayoría del público de
  impresiones va a llegar desde ahí.
- La consulta se resuelve por mail, fuera del sitio.

## Capabilities and Constraints

- **Stack heredado:** Next.js 16 (App Router, Turbopack) + React 19 + Tailwind v4 y
  TypeScript. Rutas: `/` (el archivo), `/opera/<slug>`, `/studio`, `/diario`,
  `/diario/<slug>` y `/contatti`. Todo estático —22 páginas en el build— y publicable
  en cualquier hosting sin configuración extra.
- **Tienda: planeada, no descartada.** Hoy las impresiones se consultan por mail y no
  hay precios, stock ni pasarela. El carrito del header ya está puesto y lleva a
  contacto, así que por ahora promete una función que todavía no existe. Cuando la
  tienda entre de verdad hay que definir precios, stock, pago, envíos y devoluciones:
  es otro alcance, no un ajuste.
- **Contenido centralizado** en `src/data/site.ts`, `illustrations.ts`, `journal.ts`
  e `instagram.ts`.
- **Idioma:** el cuerpo de texto sigue íntegramente en español rioplatense ("contame",
  "tenés", "escribime"). Hay que reescribirlo en italiano. Esto no es una traducción
  mecánica: la voz actual es de otro país. Las rutas ya están en italiano; los rótulos
  **Work** y **About** del menú son interinos y vuelven a Opera y Studio en esa misma
  pasada. `lang` en `layout.tsx` pasa de `"es"` a `"it"` en el mismo commit.

### Decisiones abiertas — no inventar

- **Dominio.** Todavía no hay ninguno comprado. `illustrando.it` en `src/data/site.ts`
  es un placeholder que puse yo, no una reserva: no darlo por hecho en ningún lado.
- **URL real de Behance.** El link salió del sitio mientras tanto, porque apuntaba a la
  home de behance.net y mandaba al visitante a ningún lado.
- **Jerarquía entre "Illustrando" y "Benedetta".** En la práctica el sitio ya la resolvió
  —el logotipo dice Illustrando y el nombre propio aparece en el footer y en About— pero
  nadie lo decidió explícitamente.
- **Alcance de la tienda.** Qué se vende (láminas, originales, ambas), en qué formatos
  y a qué precios. Sin esto el carrito no puede pasar de ícono.

## Brand Commitments

- **Nombre de marca:** Illustrando.
- **Nombre de la autora:** Benedetta.
- **Instagram:** https://www.instagram.com/illustrando.adocchichiusi/ — cuenta activa.
- **Behance:** tiene cuenta; falta la URL.
- **Mail de contacto:** bzibetti98@gmail.com.

## Evidence on Hand

**Real y confirmado:** el nombre Benedetta, la marca Illustrando, el mail
bzibetti98@gmail.com, la cuenta de Instagram, la existencia de una cuenta de Behance,
y que trabaja desde Foligno, Umbría.

**Va a existir, todavía no está:** las ilustraciones reales, el retrato y la bio escritos
por ella, la lista verdadera de clientes, y el dominio.

**Placeholder — nada de esto es un hecho y no debe tratarse como tal:**

| Qué | Dónde | Estado |
| --- | --- | --- |
| 12 ilustraciones SVG | `public/ilustraciones/` | Generadas para la maqueta por `scripts/generate-placeholders.mjs`. No son obra de nadie. |
| Retrato | `public/retrato.svg` | Placeholder. |
| `https://illustrando.it` | `src/data/site.ts` | Dominio inventado por mí como relleno. No está comprado. |
| Lista "Trabajé con" (Revista Campo, Ediciones Sur, La Nube, Cuadernos del Este, Estudio Pampa, Fundación Raíz) | `src/app/studio/page.tsx` | Clientes inventados. El riesgo más alto de la lista. |
| Los tres servicios ("Editorial", "Libro infantil", "Series botánicas") | `src/app/studio/page.tsx` | Descripciones de relleno. |
| Bio ("Estudié diseño…", "colecciones privadas") | `src/app/studio/page.tsx` | Texto de relleno. |
| Clientes por obra (`client:`) | `src/data/illustrations.ts` | Inventados. |
| Contexto de cada obra (`story:`) | `src/data/illustrations.ts` | Escritos por mí para que se vieran las páginas de obra. Ninguno es un encargo real. |
| Las tres entradas del diario | `src/data/journal.ts` | Inventadas enteras, con fechas incluidas. |
| El feed de Instagram | `src/data/instagram.ts` | Lista escrita a mano que reusa las imágenes de la maqueta. No lee la cuenta real. |
| Todo el cuerpo de texto | todas las páginas | Español rioplatense, no italiano. |

Resueltos desde el registro anterior, para que nadie los vuelva a buscar: el mail falso
`hola@benedetta.com`, la ubicación falsa `Buenos Aires, AR`, el link a la home de Behance,
y la promesa "respondo en 2 o 3 días hábiles" que nadie había hecho.

No agregar testimonios, premios, tirajes, precios ni clientes nuevos. Si falta contenido,
se pide; no se completa.

## Product Principles

1. **Nada fabricado.** Es el sitio de una persona real que va a mandarle el link a
   editores reales. Un cliente inventado en la lista es un riesgo para ella, no un detalle
   de maqueta.
2. **La obra decide, el sitio acompaña.** Quien contrata ilustración contrata la mano,
   no la interfaz. Todo lo que compite con la imagen resta.
3. **Hoy una consulta, mañana quizá una venta.** El final del recorrido es un mail bien
   escrito: no hay checkout que optimizar, hay una fricción que bajar y un contexto que
   pedir. La tienda está planeada, y el día que entre este principio se revisa en vez de
   estirarse: una consulta y una compra son recorridos distintos, no el mismo con un
   botón más.
4. **Un solo sitio para tres audiencias.** Un editor y alguien que quiere una lámina
   necesitan cosas distintas del mismo material. Se resuelve con orden y jerarquía, no
   duplicando secciones.
5. **Italiano de verdad.** Los textos se reescriben con voz propia en italiano, no se
   traducen del español.

## Accessibility & Inclusion

La base heredada ya es navegable por teclado de punta a punta, con link para saltar al
contenido, `alt` en cada obra, foco visible y respeto por `prefers-reduced-motion`. Ese es
el piso: no se baja. No se estableció ningún requisito de norma específica más allá de eso.
