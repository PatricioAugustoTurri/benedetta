---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/Works.tsx","src/app/globals.css"]
---

Alcance: la portada del sitio de Illustrando (Benedetta). Modo de visitante:
Experience — la obra lidera desde el primer viewport.

Audiencia y trabajo: un director de arte editorial italiano decidiendo a quién
encargarle una ilustración; un estudio buscando ilustración de marca; alguien que
llegó de Instagram y quiere una lámina. Los tres terminan en el mismo acto: un mail
con contexto. Acción primaria por obra: "Chiedi info", en la página de cada obra,
que abre el mail con el título ya puesto en el asunto.

Contenido y restricciones: 12 obras placeholder, 2023–2025. El mundo visual está
fijado por DESIGN.md y no se rediseña: acá se decide composición. Por decisión del
usuario la portada muestra sólo la obra — el feed de Instagram y el cierre de
contacto salieron, con intención de volver más adelante.

## Direction contract

THESIS: La obra, toda, en una sola grilla pareja. La portada es el archivo, no una
antesala del archivo. Rechaza el arreglo por defecto de la categoría —hero con
frase de autora, "selección" de seis obras, link a "ver todo"— que cuesta un scroll
y un clic antes de ver por qué el visitante vino, y parte el cuerpo de obra en
destacadas y resto, dos categorías que ningún editor pidió. También rechaza el
masonry: con obra toda de formato vertical, la retícula despareja es desorden sin
información, no ritmo.

OWN-WORLD: Papel cálido #faf7f2, tinta #1c1a16, filete #e2dad0, terracota #b4552f.
Fraunces de display con sus ejes variables escalonados, Inter de texto, etiquetas en
versalitas espaciadas. La terracota vive sólo como filete y marca, nunca como campo,
así el único color pleno de la página es el de la ilustración. Reconocible con todo
el contenido sacado: tres columnas de celdas verticales idénticas sobre papel, con
el pie de cada obra alineado a la misma línea de base.

STORY: Entiende en tres segundos que está frente al cuerpo de obra de una
ilustradora y que hay bastante. La grilla pareja le deja comparar piezas entre sí,
que es lo que hace un director de arte evaluando a quién contratar. Al abrir una
obra ve técnica, año y encargo, y cree que puede pedirle algo parecido. Hace:
escribe un mail desde la obra concreta que le interesó.

FIRST VIEWPORT: Nav fina arriba sin fondo. Inmediatamente debajo, la grilla: tres
obras completas en formato vertical 3:4, con la cuarta fila asomando por el borde
inferior. Sin titular, sin frase de bienvenida, sin botón. La acción primaria no
está en el viewport y no debe estarlo: vive en cada obra, al abrirla.

FORM: Grilla simétrica de proporción fija, 3 columnas en escritorio, 2 en tablet, 1
en teléfono. Derivada del pliego asimétrico (composición 2 de mi lista de 7, semilla
1c9d17d9, reparto 5-2-6) que el usuario eligió contra dos alternativas construidas y
navegables, y que después pidió simetrizar.

Interacción firma y gramática de movimiento: cada pieza entra desde su columna —la
izquierda desde la izquierda, la del medio desde abajo, la derecha desde la derecha—
subiendo, escalando de 0.965 a 1 y con el desenfoque saliendo. La dirección la da la
posición en la grilla, no el azar. Va con animación ligada al scroll, sin JavaScript
de cliente. Bajo `prefers-reduced-motion` se van el desplazamiento, la escala y el
desenfoque y queda la aparición: menos movimiento, no ausencia de movimiento.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Decisiones sin resolver

- **DESIGN.md dice que la obra no se recorta y ahora se recorta.** La grilla usa
  `aspect-[3/4]` con `object-cover` porque el usuario confirmó que la obra real es
  toda vertical. Hoy eso recorta 8 de las 12 placeholders (las apaisadas y las
  cuadradas). Con la obra real el recorte desaparece, pero la regla del sistema
  quedó desactualizada y hay que resolverla en DESIGN.md.
- Qué vuelve debajo de la obra: el feed de Instagram y el cierre de contacto salieron
  "por ahora". `InstagramFeed.tsx` queda en el repo sin usar, esperando.
- El carrito del header promete una tienda que no existe.
- Traducción al italiano y `lang="it"` pendientes, junto con todos los datos falsos
  inventariados en PRODUCT.md.
