/**
 * Lo que dice la página About.
 *
 * El texto vive acá y no adentro del componente porque lo lee la página real
 * y también las vistas previas de composición: si estuviera escrito en una de
 * las dos, comparar dos maquetas sería comparar dos textos distintos.
 */

/**
 * El video que abre la página, como lámina sobre el pliego: mismos márgenes
 * que una obra del archivo, proporción 16:9.
 *
 * PLACEHOLDER: todavía no hay archivo. Mientras `src` sea `null`, el marco
 * dibuja el cuadro de portada y nada más —ver `StudioFilm`—, así que la
 * página no tiene un reproductor roto ni un hueco negro esperando.
 *
 * El día que llegue el video, cambia una línea: `src: "/studio.mp4"`. Lo que
 * conviene que traiga el archivo:
 *
 * - **Sin sonido y corto.** Arranca solo, en loop, y un video que arranca
 *   solo con sonido es una emboscada. Si tuviera que tener sonido, deja de
 *   arrancar solo y pasa a tener controles.
 * - **La proporción la decide la maqueta elegida**, no al revés: 16:9 para
 *   las horizontales, 4:5 o 3:4 para la vertical.
 * - **Un cuadro de portada real** (`poster`), que es lo que se ve mientras
 *   carga y lo que queda si el visitante pidió menos movimiento.
 */
export const studioFilm = {
  src: null as string | null,
  poster: "/retrato.svg",
  /* PLACEHOLDER: el retrato es un SVG de relleno, no es ella. */
  alt: "La ilustradora trabajando en su taller.",
};

/** PLACEHOLDER: la bio es de relleno y está en español, no en italiano. */
export const bio = [
  "Ilustro desde {location}. Estudié diseño y pasé de las tipografías a los pinceles sin mirar atrás: hoy la mayor parte de lo que hago empieza en papel, con acuarela y lápiz, y sólo pasa a digital cuando el encargo lo pide.",
  "Me interesa el detalle chico —la nervadura de una hoja, el gesto de una mano— y el silencio alrededor. Trabajo mejor cuando hay espacio para probar, así que suelo arrancar con bocetos rápidos antes de comprometerme con una dirección.",
  "Mis trabajos aparecieron en revistas, libro álbum y colecciones privadas. Si querés ver el proceso más de cerca, lo comparto seguido en Instagram.",
];

/** PLACEHOLDER: los tres servicios son descripciones de relleno. */
export const servicios = [
  {
    title: "Editorial",
    body: "Ilustración para notas, tapas y suplementos. Entrego en los formatos y plazos que pide la redacción.",
  },
  {
    title: "Libro infantil",
    body: "Desarrollo de personajes, storyboard y arte final para libro álbum, en diálogo con autores y editores.",
  },
  {
    title: "Series botánicas",
    body: "Láminas y herbarios por encargo, en acuarela o lápiz de color, con opción de impresión fine art.",
  },
];

/**
 * PLACEHOLDER — el riesgo más alto de la página. Ninguno de estos clientes
 * existe: los inventé para la maqueta. Es el sitio de una persona real que le
 * va a mandar el link a editores reales, así que esta lista se reemplaza por
 * la verdadera o se borra entera. No se completa con más nombres plausibles.
 */
export const clientes = [
  "Revista Campo",
  "Ediciones Sur",
  "La Nube",
  "Cuadernos del Este",
  "Estudio Pampa",
  "Fundación Raíz",
];
