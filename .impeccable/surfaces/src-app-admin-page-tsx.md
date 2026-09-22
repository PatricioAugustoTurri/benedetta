---
version: 1
slug: "src-app-admin-page-tsx"
primary_target: "src/app/admin/page.tsx"
related_targets: ["src/app/admin/components","src/lib/works.ts","db/schema.sql"]
---

Scope: `/admin`, la pantalla donde Benedetta carga y corrige su archivo de obra.
Visitor mode: Operate. Una sola usuaria, autenticada, en una tarea concreta.

Audience: ella, no el público. Conoce la obra de memoria y no conoce la base de datos.
Job: pasar una pieza terminada —título, año, técnica, texto y dos o tres imágenes— a la
tabla `works`, corregir lo que ya está cargado sin abrir psql, y decidir en qué orden
se ve el archivo.
Task: alta, edición, borrado y **orden** sobre `works`. Las imágenes se suben como
archivo; el ancho y el alto se leen del archivo, no se tipean. El orden se arrastra:
es libre sobre todo el archivo y el año no lo decide.
Constraints: contraseña simple en `.env.local`. El sitio público pasa a leer de
PostgreSQL en el mismo trabajo, así que lo que se carga acá es lo que se publica.

## Direction contract

THESIS: el admin es el archivo publicado con la mano adentro, no un formulario sobre una
tabla. Rechaza la disposición que esta categoría siempre trae —lista densa a la izquierda,
panel de edición a la derecha— porque convierte doce ilustraciones en doce renglones de
texto, y lo que hay que juzgar al cargar una obra es cómo se ve al lado de las otras.

ORDEN (sumado después del primer envío): el archivo se ordena a mano, arrastrando la
pieza de una manija que entra al grupo de controles que ya existía. Sin modo de
ordenar: se pidió poder hacerlo cuando sea y las veces que sean, y un modo convierte un
movimiento en tres gestos. La pieza en la mano es la misma placa sobre papel pleno con
el filete terracota puesto; el lugar donde va a caer es un cuadrado punteado, que es lo
mismo que significa el hueco de alta. El teclado hace todo lo que hace el puntero. Todo
gesto interrumpido cancela, nunca guarda. Ver «The Held-Piece Rule» en DESIGN.md.

PROPORCIÓN: la celda sigue a la del sitio, hoy 4:5, y cambia cuando esa cambie. Esta
pantalla existe para juzgar cómo se va a ver la pieza publicada; con otro encuadre
sirve para lo contrario de lo que justifica su forma.

OWN-WORLD: el sistema del sitio sin una sola invención: papel `#faf7f2`, tinta `#1c1a16`,
filete `#e2dad0` de 1px y terracota `#b4552f` reservada a estado —lo que está tocado, lo
que falta, lo que falló—, nunca a decoración. Sin cajas, sin sombras, sin radio: los
campos son un renglón sobre un filete, como el formulario de Contatti. La única capa
nueva es la de control, y existe apoyada: aparece sobre la pieza al pasar por encima.

STORY: entra, ve su archivo tal como se publica y reconoce de inmediato qué hay cargado y
qué falta. Entiende que el hueco punteado al principio de la grilla es donde se suma una
obra. Arrastra los archivos, completa la ficha, y la pieza aparece en la grilla en su
año. Sale sabiendo que lo que vio es lo que el visitante va a ver.

FIRST VIEWPORT: barra fina y fija arriba con el total de obras y el estado de la conexión
a la base, en versalitas sobre filete. Debajo, la grilla de obra del sitio con sus mismas
proporciones y su mismo aire. Primero en la fila, un hueco de la medida de una pieza con
filete punteado y el signo de más: nueva obra. Cada pieza publicada muestra título y año
como en el sitio; al apoyarse toma un filete terracota y asoman dos controles al margen
derecho —editar y borrar—, del mismo trazo que los íconos del sitio. La acción primaria
es el hueco, y está donde el ojo empieza a leer la grilla.

FORM: «el archivo con la mano adentro», séptima de mis siete estructuras ordenadas por
resonancia, repartida como líder por el sorteo. Seed key 3fec1c6e.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
