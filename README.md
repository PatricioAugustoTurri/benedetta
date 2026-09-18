# Illustrando — portfolio de ilustración

Sitio de Benedetta, ilustradora. Minimalista y en Next.js, pensado para que las
ilustraciones sean lo único que llame la atención: fondo cálido tipo papel,
tipografía editorial y cero adornos que compitan con la obra.

## Correrlo

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build && npm run start   # build de producción
npm run lint                     # ESLint
npx tsc --noEmit                 # chequeo de tipos
```

## Estructura

La portada **es** el archivo de obra. No hay antesala: ni hero de bienvenida, ni
"selección" de seis obras, ni un link a "ver todo". Quien entra ve la obra en el
primer viewport, y el año funciona de espina para orientarse.

| Ruta              | Qué es                                                       |
| ----------------- | ------------------------------------------------------------ |
| `/`               | El archivo completo, agrupado por año. Feed de Instagram al pie |
| `/opera/<slug>`   | Una obra: imagen grande, ficha técnica, contexto, y "Chiedi info" |
| `/studio`         | Bio, cómo trabaja, clientes                                  |
| `/diario`         | Diario de taller                                             |
| `/diario/<slug>`  | Una entrada, con la obra que cita                            |
| `/contatti`       | Mail, redes, ubicación                                       |

Todo se genera estático, así que el sitio se puede publicar en cualquier hosting
(Vercel, Netlify, Cloudflare Pages) sin configuración extra.

## Cómo cambiar el contenido

Casi todo se edita en cuatro archivos de datos, sin tocar componentes.

### `src/data/site.ts`

Nombre, marca, oficio, mail, ubicación, redes y la navegación. Antes de publicar,
cambiá `url` por el dominio final (se usa para el SEO y para las tarjetas al
compartir el link).

### `src/data/illustrations.ts`

La lista de obras, de la más nueva a la más vieja. El archivo agrupa por año solo:
alcanza con que `year` sea correcto.

```ts
{
  slug: "jardin-nocturno",       // define la URL: /opera/jardin-nocturno
  title: "Jardín nocturno",
  year: 2025,
  category: "Botánica",          // Editorial | Infantil | Botánica | Personal
  client: "Revista Campo",       // opcional: omitir en trabajo personal
  medium: "Acuarela y tinta",
  size: "30 × 40 cm",            // opcional
  src: "/ilustraciones/01-jardin-nocturno.svg",
  width: 900,                    // medidas reales del archivo
  height: 1200,
  alt: "Descripción de la imagen.",
  story: "Contexto del encargo.", // opcional, va en la página de la obra
  anchor: true,                  // encabeza su año — una sola por año
}
```

`width` y `height` tienen que ser las medidas reales: Next las usa para reservar
el espacio y que la página no salte mientras carga.

### `src/data/journal.ts` y `src/data/instagram.ts`

Las entradas del diario y las publicaciones del feed. El feed hoy es una lista
escrita a mano; en el archivo están anotados los dos caminos para que sea real.

### Reemplazar las ilustraciones

Las 12 imágenes que vienen ahora son **placeholders abstractos generados para
esta maqueta** — no son obra de nadie, están sólo para que se vea cómo queda la
grilla. Para poner las reales:

1. Copiá los archivos a `public/ilustraciones/` (JPG o PNG, lado largo de
   ~2000px alcanza y sobra; Next genera las versiones chicas solo).
2. Actualizá `src`, `width`, `height`, `alt` y `story` en `src/data/illustrations.ts`.
3. Borrá los `.svg` que sobren y, si querés, `scripts/generate-placeholders.mjs`
   junto con `public/retrato.svg`.

Lo mismo con `public/retrato.svg`: reemplazalo por la foto real.

## Decisiones de diseño

- **La portada es el archivo.** El año es la espina: queda fijo al costado
  mientras dura su tramo, y a escala grande contra etiquetas diminutas.
- **Vos elegís qué abre cada año.** La obra con `anchor: true` encabeza su
  tramo; el resto lo acomoda un reparto por altura para que las columnas
  queden parejas. Una sola por año: si marcás dos, la segunda se ignora.
- **Una obra sostenida por vez.** Al apoyarse sobre una pieza, el resto del
  archivo se atenúa en lugar de taparse, y el año de esa pieza queda como el
  único legible. Es CSS puro (`:has()`), sin JavaScript de cliente.
- **El color se repliega al filete.** La terracota vive sólo como regla y marca,
  nunca como campo: el único color pleno de la página es el de la ilustración.
- **Paleta clara, sin modo oscuro.** Un fondo que cambia de color altera cómo se
  lee una ilustración. El papel cálido (`#faf7f2`) es siempre el mismo.
- **Grilla tipo masonry** con columnas CSS: respeta la proporción de cada obra,
  sin recortes ni huecos entre piezas de distinto alto.
- **Movimiento discreto** y respetando `prefers-reduced-motion`.
- **Íconos dibujados**, no glifos unicode: comparten grosor de trazo y no cambian
  de forma según el sistema operativo.

Los colores y las tipografías están como tokens al principio de
`src/app/globals.css`: cambiando esos valores cambia todo el sitio.

## Accesibilidad

Navegable por teclado de punta a punta, con link para saltar al contenido, textos
alternativos en cada obra, foco siempre visible y contraste alto entre texto y
fondo. Las superficies del navegador —selección, cursor de texto, barra de
scroll— también están tomadas de la paleta.

## Pendiente

- **Traducir el contenido al italiano.** La navegación y las rutas ya están en
  italiano; el cuerpo de texto sigue siendo el heredado en español. `lang` en
  `src/app/layout.tsx` pasa a `"it"` en el mismo commit que la traducción.
- **Datos falsos.** Clientes, bios, historias de obra y el dominio son de relleno.
  Están inventariados en `PRODUCT.md`.
