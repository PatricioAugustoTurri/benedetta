export type Category = "Editorial" | "Infantil" | "Botánica" | "Personal";

export type Illustration = {
  /** Identificador para el link permanente: /opera/<slug> */
  slug: string;
  title: string;
  year: number;
  category: Category;
  /** Cliente o publicación. Omitir en trabajos personales. */
  client?: string;
  /** Técnica: acuarela, gouache, digital… */
  medium: string;
  /** Medidas de la pieza física, si existen. */
  size?: string;
  src: string;
  width: number;
  height: number;
  /** Texto alternativo — describí la imagen para lectores de pantalla. */
  alt: string;
  /**
   * Contexto del encargo, para la página de la obra.
   * PLACEHOLDER: todos los textos actuales son de relleno.
   */
  story?: string;
};

/**
 * Las obras, de la más nueva a la más vieja.
 *
 * El orden del array es el orden en que se muestran.
 *
 * Para reemplazar las placeholders:
 *   1. Poné los archivos en public/ilustraciones/
 *   2. Actualizá src, width y height (las medidas reales del archivo)
 *   3. Escribí un alt descriptivo y un story real
 */
export const illustrations: Illustration[] = [
  {
    slug: "jardin-nocturno",
    title: "Jardín nocturno",
    year: 2025,
    category: "Botánica",
    medium: "Acuarela y tinta",
    size: "30 × 40 cm",
    src: "/ilustraciones/01-jardin-nocturno.svg",
    width: 900,
    height: 1200,
    alt: "Composición vertical de una rama con hojas alternadas bajo un círculo abierto.",
    story:
      "Parte de una serie de seis láminas sobre plantas que abren de noche. La rama se dibujó del natural y el círculo se resolvió al final, cuando quedó claro que la lámina necesitaba un peso arriba.",
  },
  {
    slug: "marea",
    title: "Marea",
    year: 2025,
    category: "Editorial",
    client: "Ediciones Sur",
    medium: "Digital",
    src: "/ilustraciones/05-marea.svg",
    width: 1200,
    height: 900,
    alt: "Cinco bandas onduladas en azules y ocres cruzando el encuadre.",
    story:
      "Apertura de un capítulo sobre mareas. El encargo pedía algo horizontal que funcionara a doble página sin que el pliegue partiera nada importante.",
  },
  {
    slug: "mediodia",
    title: "Mediodía",
    year: 2025,
    category: "Editorial",
    client: "Revista Campo",
    medium: "Gouache",
    src: "/ilustraciones/02-mediodia.svg",
    width: 1200,
    height: 900,
    alt: "Paisaje de colinas superpuestas en tonos terracota con un sol alto.",
    story:
      "Ilustración de tapa para un número sobre agricultura de secano. Entregada en cinco días, con dos rondas de boceto.",
  },
  {
    slug: "tallos",
    title: "Tallos",
    year: 2025,
    category: "Botánica",
    medium: "Acuarela",
    size: "24 × 32 cm",
    src: "/ilustraciones/10-tallos.svg",
    width: 900,
    height: 1200,
    alt: "Vasija verde con tres tallos largos y flores pequeñas.",
    story:
      "Trabajo personal. Un ejercicio sobre cuánto se puede sacar de una composición antes de que deje de sostenerse.",
  },
  {
    slug: "ritmo",
    title: "Ritmo",
    year: 2024,
    category: "Personal",
    medium: "Serigrafía",
    size: "50 × 50 cm, edición de 25",
    src: "/ilustraciones/03-ritmo.svg",
    width: 1000,
    height: 1000,
    alt: "Arcos concéntricos sobre una línea de horizonte con un círculo central.",
    story:
      "Primera prueba en serigrafía a dos tintas. La edición se imprimió en un taller compartido, con todos los desajustes de registro que eso implica.",
  },
  {
    slug: "herbario",
    title: "Herbario",
    year: 2024,
    category: "Botánica",
    medium: "Lápiz de color",
    size: "21 × 30 cm",
    src: "/ilustraciones/04-herbario.svg",
    width: 900,
    height: 1200,
    alt: "Una hoja grande con nervaduras dibujadas en claro sobre verde.",
    story:
      "De una serie larga de hojas sueltas, dibujadas a lo largo de un invierno entero, una por semana.",
  },
  {
    slug: "ceramica",
    title: "Cerámica",
    year: 2024,
    category: "Personal",
    medium: "Acuarela",
    size: "24 × 30 cm",
    src: "/ilustraciones/06-ceramica.svg",
    width: 960,
    height: 1200,
    alt: "Vasija ocre con tres tallos y flores redondas asomando.",
    story:
      "Una pieza de cerámica del taller, dibujada tantas veces que terminó siendo un motivo propio.",
  },
  {
    slug: "umbral",
    title: "Umbral",
    year: 2024,
    category: "Editorial",
    medium: "Tinta y digital",
    src: "/ilustraciones/08-umbral.svg",
    width: 960,
    height: 1200,
    alt: "Arco arquitectónico con una colina y tres tallos en su interior.",
    story:
      "Encargo para una nota sobre umbrales y espacios de paso. La tinta se escaneó y el color se resolvió en digital.",
  },
  {
    slug: "eco",
    title: "Eco",
    year: 2024,
    category: "Personal",
    medium: "Serigrafía",
    size: "50 × 50 cm, edición de 20",
    src: "/ilustraciones/11-eco.svg",
    width: 1000,
    height: 1000,
    alt: "Arcos concéntricos en azul grisáceo sobre fondo claro.",
    story: "Continuación de Ritmo, con una sola tinta y el registro corrido a propósito.",
  },
  {
    slug: "constelacion",
    title: "Constelación",
    year: 2023,
    category: "Infantil",
    client: "Libro álbum · La Nube",
    medium: "Gouache",
    src: "/ilustraciones/07-constelacion.svg",
    width: 1000,
    height: 1000,
    alt: "Retícula de puntos con un círculo lleno en el centro.",
    story:
      "Una de dieciséis páginas de un libro álbum sobre contar estrellas. Desarrollo de personaje, storyboard y arte final.",
  },
  {
    slug: "siesta",
    title: "Siesta",
    year: 2023,
    category: "Infantil",
    medium: "Lápiz y acuarela",
    src: "/ilustraciones/09-siesta.svg",
    width: 1200,
    height: 900,
    alt: "Colinas en ocres cálidos bajo un sol bajo.",
    story: "Prueba de paleta para un proyecto de libro que no llegó a hacerse.",
  },
  {
    slug: "bordado",
    title: "Bordado",
    year: 2023,
    category: "Personal",
    medium: "Bordado sobre papel",
    size: "18 × 24 cm",
    src: "/ilustraciones/12-bordado.svg",
    width: 900,
    height: 1200,
    alt: "Puntos alineados en retícula con un disco terracota al centro.",
    story:
      "Hilo sobre papel perforado. Salió de querer entender cuánto tarda una línea cuando no se puede borrar.",
  },
];

export const categories: Category[] = ["Editorial", "Infantil", "Botánica", "Personal"];

export function getIllustration(slug: string): Illustration | undefined {
  return illustrations.find((i) => i.slug === slug);
}

/** La obra anterior y la siguiente dentro del archivo, para navegar sin volver. */
export function neighbours(slug: string) {
  const i = illustrations.findIndex((x) => x.slug === slug);
  if (i === -1) return { prev: undefined, next: undefined };
  return {
    prev: i > 0 ? illustrations[i - 1] : undefined,
    next: i < illustrations.length - 1 ? illustrations[i + 1] : undefined,
  };
}
