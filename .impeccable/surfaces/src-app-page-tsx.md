---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/(sitio)/page.tsx"
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

FIRST VIEWPORT: Nav fina arriba sin fondo. Inmediatamente debajo, la grilla y nada
más: obras en 4:5 a tres columnas, casi pegadas, sin una sola palabra, con la fila siguiente
asomando por el borde inferior. En el teléfono, dos columnas con la misma proporción.
Sin agrupar. Sin agrupar. Sin titular, sin frase de bienvenida, sin botón. La acción primaria no
está en el viewport y no debe estarlo: vive en cada obra, al abrirla.

FORM: Grilla simétrica, 3 columnas desde 1024px y 2 en todo lo de abajo, teléfono
incluido. Nunca 1. Derivada del pliego asimétrico (composición 2 de mi lista de 7, semilla
1c9d17d9, reparto 5-2-6) que el usuario eligió contra dos alternativas construidas y
navegables, y que después pidió simetrizar.

Interacción firma y gramática de movimiento: cada pieza entra desde su columna —la
izquierda desde la izquierda, la del medio desde abajo, la derecha desde la derecha—
subiendo y escalando de 0.965 a 1. La dirección la da la posición en la grilla, no el
azar. Va con animación ligada al scroll, sin JavaScript de cliente. Bajo
`prefers-reduced-motion` se van el desplazamiento y la escala y queda la aparición:
menos movimiento, no ausencia de movimiento.

Sin desenfoque, por pedido del cliente: entraba con 8px saliendo y sobre ilustración
eso deja medio segundo en que la obra se ve mal hecha, que es justo la primera
impresión de cada pieza. El resto de la entrada queda como estaba.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Decisiones sin resolver

- **La grilla no dibuja una palabra, en ningún ancho.** Título, año y técnica se
  fueron de a uno, cada uno a pedido del cliente, hasta quedar sólo la obra. Lo que
  cada pieza es se lee al abrirla.

  El aire se fue con el texto, y eso es una decisión y no dos: con ficha, el blanco
  alrededor era lo que volvía a cada celda un registro; sin ficha, ese mismo blanco
  deja las obras flotando. El paso quedó en proporción y no en píxeles —~2% del ancho
  de la celda en cualquier pantalla— que es lo mínimo que impide que dos obras de
  fondo claro se fundan.

  La ficha se **borró del markup**, no se escondió detrás de un `hidden`: este
  proyecto ya tuvo que eliminar una vez CSS que sobrevivió tres commits sin que nadie
  lo usara.

- **La celda es 4:5 en todos los anchos, a pedido del cliente.** Llegó a haber una
  costura en 640px —cuadrado arriba, 4:5 abajo— y se sacó: la misma obra se veía con
  dos encuadres distintos según la pantalla desde la que se la mirara.

  **La proporción es un solo objeto en tres lugares** —la grilla del archivo, las
  láminas del paginado de cada obra y la grilla de `/admin`— y se mueven juntas. El
  caso del admin es el más fuerte: esa pantalla existe para juzgar cómo se va a ver
  una pieza publicada, y mostrarle otro encuadre la deja sirviendo para lo contrario.

  El `aspect-square` había reemplazado a un `3:4` que venía de una confirmación
  anterior —que la obra real era toda vertical— que resultó falsa: lo que ella sube
  es cuadrado (2126², 2953², 2048²), así que aquella proporción le recortaba cada
  pieza. Eso sigue siendo cierto y el 4:5 del teléfono se come un quinto del ancho de
  cada obra: **es un recorte elegido, no heredado**, y por eso se quedó en el peldaño
  más suave que todavía se lee como vertical. Si vuelve a discutirse, lo que hay que
  decidir es si el mosaico vale ese quinto, no qué proporción queda mejor.

  El nombre de la obra no se fue con la ficha: el enlace lleva
  `aria-label="<título>, <año>"` a cualquier ancho, así que la grilla se anuncia bien
  aunque no muestre palabras a nadie.
- **El archivo por años se construyó y se sacó.** DESIGN.md lo documentaba como
  firma del sistema y su CSS vivía en `globals.css` desde hacía tres commits sin que
  ningún componente lo usara. Se construyó, se mostró, y al cliente no le gustó. Se
  eliminó entero —componente, CSS, tokens y la sección de DESIGN.md— en vez de
  dejarlo dormido una segunda vez. Git lo tiene si alguna vez vuelve.
- **La portada es una grilla plana de celdas cuadradas iguales.** DESIGN.md decía
  masonry empaquetado por proporción; se corrigió a lo que hay. Si algún día se
  quiere volumen distinto por pieza, eso es una decisión de sistema y no un ajuste.
- Qué vuelve debajo de la obra: el feed de Instagram y el cierre de contacto salieron
  "por ahora". `InstagramFeed.tsx` queda en el repo sin usar, esperando.
- El carrito del header promete una tienda que no existe.
- Traducción al italiano y `lang="it"` pendientes, junto con todos los datos falsos
  inventariados en PRODUCT.md.
