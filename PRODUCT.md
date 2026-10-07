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

Editoriales y estudios terminan en un mensaje. Quien compra impresiones ya puede
comprarlas en el sitio: las stampe tienen carrito y pago con Stripe. Retratos e
ilustraciones personalizadas siguen siendo una consulta.

## Product Purpose

Portfolio de ilustración de Benedetta, que trabaja bajo la marca **Illustrando**.
El sitio existe para que alguien que no la conoce vea la obra, entienda qué tipo de
encargo puede hacerle, y escriba. El éxito es una consulta bien planteada —con
proyecto, plazo y formato— en lugar de un ida y vuelta largo.

## Positioning

Ilustraciones personalizadas y retratos: recuerdos y relatos de otros convertidos
en imagen. Trabaja sobre todo en digital y experimenta a mano —acrílico, pastel,
madera— por gusto, no como formato de entrega. Viene de su propia bio (2026-09-26),
que reemplazó a la posición anterior —"analógico como origen, digital como
entrega"—, inventada para la maqueta y contraria a lo que ella dice de sí.

## Operating Context

- Ella trabaja desde **Foligno, Umbría**. Es una ciudad chica del centro de Italia:
  el mercado que busca no está en su puerta, así que el sitio es su vía de acceso
  a editoriales y estudios de Milán, Bolonia y Roma, no un complemento del boca a boca.
- El sitio va a estar **en italiano**. Su mercado primario es italiano: editoriales,
  revistas y estudios de ahí.
- Instagram es hoy su canal de descubrimiento real y activo: la mayoría del público de
  impresiones va a llegar desde ahí.
- La consulta se resuelve por mail, fuera del sitio. El formulario de Contatti no
  envía: arma el mensaje y se lo pasa al programa de correo del visitante, con una
  copia a mano por si ese programa no existe. **El «Chiedi info» de cada obra ya no
  abre un mail**: lleva al formulario con el asunto —el título de la obra— ya puesto,
  porque un `mailto:` en un teléfono o en un webmail muchas veces no abre nada y
  tampoco avisa.

## Capabilities and Constraints

- **Stack:** Next.js 16 (App Router, Turbopack) + React 19 + Tailwind v4 y
  TypeScript. Rutas públicas: `/` (el archivo), `/opera/<slug>`, `/studio` y
  `/contatti`; más `/admin`, que es la pantalla de trabajo y no se indexa.
  El diario y el portfolio se eliminaron por pedido del cliente; el diario es
  recuperable del commit `6db3fb9`.
- **El sitio dejó de ser estático puro.** La obra vive en PostgreSQL (base
  `illustrando`, tabla `works`) y `/admin` es lo que escribe en ella. Consecuencia
  directa: `npm run build` ya no termina sin la base levantada, porque la portada y
  las páginas de obra se generan leyendo la tabla. Publicarlo ahora pide un hosting
  con Node y una base, no una carpeta de archivos. Ver `db/README.md`.
- **Tienda.** Volvió el 2026-10-07 y desde ese día vende. Dos cosas distintas:
  - **Stampe** son productos y se agregan seguido (tabla `prodotti`): formatos con
    precio, carrito, pago con Stripe, envío a Italia y a la UE. Lista base del cliente:
    A5 10 €, 20×20 cm 15 €, A4 20 €, A3 30 €, editable por stampa. Sin stock: se imprimen a pedido.
    Los pedidos los escribe el webhook de Stripe en `ordini` y ella los marca como
    enviados en `/admin/ordini`.
  - **Illustrazioni Personalizzate** y **Ritratti Illustrati** no son productos: son
    dos servicios, uno cada uno y siempre los mismos (tabla `servizi`, dos filas
    fijas). Una página que se lee —de qué se trata, cómo funciona, ejemplos— y lleva a
    «Chiedi info». No se agregan ni se borran; ella actualiza el texto y las imágenes.
- **El orden del archivo lo decide ella.** Qué obra abre el sitio y cuál va al
  lado de cuál se arrastra en `/admin` y vive en la columna `works.position`.
  Antes el orden salía del año y, a igual año, del número de fila: nadie lo
  había elegido. **El año dejó de ordenar nada** —quedó como dato de la ficha,
  al lado del título—, y el paginado de cada página de obra sigue el mismo
  orden que la grilla. Es el cambio de producto de este trabajo: el archivo de
  una ilustradora es una secuencia curada, no una cronología.
- **Dónde vive el contenido.** La obra, en la tabla `works` de PostgreSQL, y se
  carga por `/admin`. El resto sigue en archivos: `src/data/site.ts` (marca, redes,
  navegación), `src/data/instagram.ts` (la cinta del pie) y `src/data/studio.ts`.
  `src/data/illustrations.ts` ya no existe: era donde vivían las doce obras y lo
  reemplazó la base.
- **Idioma:** el cuerpo de texto sigue íntegramente en español rioplatense ("contame",
  "tenés", "escribime"). Hay que reescribirlo en italiano. Esto no es una traducción
  mecánica: la voz actual es de otro país. Las rutas ya están en italiano; los rótulos
  **Work** y **About** del menú son interinos y vuelven a Opera y Studio en esa misma
  pasada. `lang` en `layout.tsx` pasa de `"es"` a `"it"` en el mismo commit.

### Decisiones abiertas — no inventar

- **URL real de Behance.** El link salió del sitio mientras tanto, porque apuntaba a la
  home de behance.net y mandaba al visitante a ningún lado.
- **Jerarquía entre "Illustrando" y "Benedetta".** En la práctica el sitio ya la resolvió
  —el logotipo dice Illustrando y el nombre propio aparece en el footer y en About— pero
  nadie lo decidió explícitamente.
- **Para vender de verdad faltan cuatro cosas, y ninguna se inventa:**
  1. **Cuenta de Stripe.** Hoy todo corre con claves de prueba (`sk_test_`).
  2. **Costo de envío** a Italia y a la UE (`SPEDIZIONE_ITALIA`, `SPEDIZIONE_UE`, en
     centavos). Sin esto el carrito dice «da definire» y el pago no arranca.
  3. **El número de partita IVA** en el pie: obligatorio si vende. Tiene partita IVA;
     falta el número.
  4. **Condizioni di vendita, diritto di recesso (14 días, ley UE) y privacy.** Los
     textos tienen que venir de ella o de su contador.
- **Notas por categoría.** Si quiere una línea de material o formato bajo cada
  categoría, entra en `note` en `src/data/shop.ts`. No inventarla.

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

**Va a existir, todavía no está:** la lista verdadera de clientes y el dominio.

**Placeholder — nada de esto es un hecho y no debe tratarse como tal:**

| Qué | Dónde | Estado |
| --- | --- | --- |
| 12 ilustraciones SVG | `public/ilustraciones/` | Generadas para la maqueta por `scripts/generate-placeholders.mjs`. No son obra de nadie. Ya no las muestra el sitio: quedaron huérfanas al vaciarse la tabla, y se pueden borrar. La carpeta es también donde `/admin` deja lo que ella sube. |
| Retrato | `public/retrato.svg` | Placeholder huérfano: About ya abre con su video (`public/Bebi about 2.mp4`) y esto no lo usa nadie. Se puede borrar. |
| Textos de los dos servicios ("Illustrazioni personalizzate", "Ritratti") | `src/data/studio.ts` | Los títulos son de su bio; los dos textos los escribí yo a partir de ella. Falta que los confirme. |
| La tabla `works` | base `illustrando` | **Arranca vacía, por pedido del cliente.** Las doce obras de maqueta no se migraron: ella carga las suyas por `/admin`. Mientras esté vacía, la portada dice que el archivo está en preparación. |
| Cliente y medidas por obra | — | Ya no existen: la tabla `works` no tiene esas columnas, y la ficha de una obra quedó en dos filas, Anno y Tecnica. Si vuelven a hacer falta, vuelven como columnas y como campos del admin. |
| Las tres entradas del diario | `src/data/journal.ts` | Inventadas enteras, con fechas incluidas. |
| El feed de Instagram | `src/data/instagram.ts` | Lista escrita a mano que reusa las imágenes de la maqueta. No lee la cuenta real. |
| Todo el cuerpo de texto | todas las páginas | Español rioplatense, no italiano. |

Resueltos desde el registro anterior, para que nadie los vuelva a buscar: la
sección «Ho lavorato con» de About me, con seis clientes inventados —se eliminó
entera por pedido del cliente; si vuelve, vuelve con la lista verdadera—, el mail falso
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
3. **Una consulta, no una venta.** El final del recorrido es un mail bien escrito: no
   hay checkout que optimizar, hay una fricción que bajar y un contexto que pedir. Si
   alguna vez entra una tienda, este principio se revisa en vez de estirarse: una
   consulta y una compra son recorridos distintos, no el mismo con un botón más.
4. **Un solo sitio para tres audiencias.** Un editor y alguien que quiere una lámina
   necesitan cosas distintas del mismo material. Se resuelve con orden y jerarquía, no
   duplicando secciones.
5. **Italiano de verdad.** Los textos se reescriben con voz propia en italiano, no se
   traducen del español.

## Accessibility & Inclusion

La base heredada ya es navegable por teclado de punta a punta, con link para saltar al
contenido, `alt` en cada obra, foco visible y respeto por `prefers-reduced-motion`. Ese es
el piso: no se baja. No se estableció ningún requisito de norma específica más allá de eso.
