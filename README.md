# Benedetta — portfolio de ilustración

Sitio minimalista en Next.js, pensado para que las ilustraciones sean lo único
que llame la atención: fondo cálido tipo papel, tipografía editorial y cero
adornos que compitan con la obra.

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

| Ruta             | Qué es                                                     |
| ---------------- | ---------------------------------------------------------- |
| `/`              | Portada: presentación breve + selección de obras           |
| `/ilustraciones` | Obra completa, con filtro por categoría y visor ampliado   |
| `/sobre-mi`      | Bio, cómo trabaja, clientes                                |
| `/contacto`      | Mail, redes, ubicación                                     |

Las cuatro páginas se generan estáticas, así que el sitio se puede publicar en
cualquier hosting (Vercel, Netlify, Cloudflare Pages) sin configuración extra.

## Cómo cambiar el contenido

Casi todo se edita en dos archivos, sin tocar componentes:

### `src/data/site.ts`

Nombre, oficio, mail, ubicación, redes y los textos que se repiten. Antes de
publicar, cambiá `url` por el dominio final (se usa para el SEO y para las
tarjetas al compartir el link).

### `src/data/illustrations.ts`

La lista de obras, en el orden en que se muestran. Para cada una:

```ts
{
  slug: "jardin-nocturno",       // identificador único
  title: "Jardín nocturno",
  year: 2025,
  category: "Botánica",          // Editorial | Infantil | Botánica | Personal
  client: "Revista Campo",       // opcional: omitir en trabajo personal
  medium: "Acuarela y tinta",
  src: "/ilustraciones/01-jardin-nocturno.svg",
  width: 900,                    // medidas reales del archivo
  height: 1200,
  alt: "Descripción de la imagen.",
  featured: true,                // aparece en la portada
}
```

`width` y `height` tienen que ser las medidas reales: Next las usa para
reservar el espacio y que la página no salte mientras carga.

### Reemplazar las ilustraciones

Las 12 imágenes que vienen ahora son **placeholders abstractos generados para
esta maqueta** — no son obra de nadie, están sólo para que se vea cómo queda la
grilla. Para poner las reales:

1. Copiá los archivos a `public/ilustraciones/` (JPG o PNG, lado largo de
   ~2000px alcanza y sobra; Next genera las versiones chicas solo).
2. Actualizá `src`, `width`, `height` y `alt` en `src/data/illustrations.ts`.
3. Borrá los `.svg` que sobren y, si querés, `scripts/generate-placeholders.mjs`
   junto con `public/retrato.svg`.

Lo mismo con `public/retrato.svg`: reemplazalo por la foto real.

## Decisiones de diseño

- **Paleta clara, sin modo oscuro.** Un fondo que cambia de color altera cómo se
  lee una ilustración. El papel cálido (`#faf7f2`) es siempre el mismo.
- **Grilla tipo masonry** con columnas CSS: respeta la proporción de cada obra,
  sin recortes ni huecos entre piezas de distinto alto.
- **Visor ampliado** con teclado: flechas para navegar, `Esc` para cerrar, y el
  foco vuelve a la obra desde donde se abrió.
- **Movimiento discreto** y respetando `prefers-reduced-motion`.

Los colores y las tipografías están como tokens al principio de
`src/app/globals.css`: cambiando esos valores cambia todo el sitio.

## Accesibilidad

Navegable por teclado de punta a punta, con link para saltar al contenido,
textos alternativos en cada obra, foco siempre visible y contraste alto entre
texto y fondo.
