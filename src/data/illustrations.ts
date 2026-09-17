export type Category = "Editorial" | "Infantil" | "Botánica" | "Personal";

export type Illustration = {
  /** Identificador para el link permanente. */
  slug: string;
  title: string;
  year: number;
  category: Category;
  /** Cliente o publicación. Omitir en trabajos personales. */
  client?: string;
  /** Técnica: acuarela, gouache, digital… */
  medium: string;
  src: string;
  width: number;
  height: number;
  /** Texto alternativo — describí la imagen para lectores de pantalla. */
  alt: string;
  /** Las destacadas aparecen en la portada. */
  featured?: boolean;
};

/**
 * Las obras, en el orden en que se muestran.
 *
 * Para reemplazar las placeholders:
 *   1. Poné los archivos en public/ilustraciones/
 *   2. Actualizá src, width y height (las medidas reales del archivo)
 *   3. Escribí un alt descriptivo
 * El orden de este array es el orden de la grilla.
 */
export const illustrations: Illustration[] = [
  {
    slug: "jardin-nocturno",
    title: "Jardín nocturno",
    year: 2025,
    category: "Botánica",
    medium: "Acuarela y tinta",
    src: "/ilustraciones/01-jardin-nocturno.svg",
    width: 900,
    height: 1200,
    alt: "Composición vertical de una rama con hojas alternadas bajo un círculo abierto.",
    featured: true,
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
    featured: true,
  },
  {
    slug: "ritmo",
    title: "Ritmo",
    year: 2024,
    category: "Personal",
    medium: "Serigrafía",
    src: "/ilustraciones/03-ritmo.svg",
    width: 1000,
    height: 1000,
    alt: "Arcos concéntricos sobre una línea de horizonte con un círculo central.",
    featured: true,
  },
  {
    slug: "herbario",
    title: "Herbario",
    year: 2024,
    category: "Botánica",
    medium: "Lápiz de color",
    src: "/ilustraciones/04-herbario.svg",
    width: 900,
    height: 1200,
    alt: "Una hoja grande con nervaduras dibujadas en claro sobre verde.",
    featured: true,
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
    featured: true,
  },
  {
    slug: "ceramica",
    title: "Cerámica",
    year: 2024,
    category: "Personal",
    medium: "Acuarela",
    src: "/ilustraciones/06-ceramica.svg",
    width: 960,
    height: 1200,
    alt: "Vasija ocre con tres tallos y flores redondas asomando.",
    featured: true,
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
  },
  {
    slug: "tallos",
    title: "Tallos",
    year: 2025,
    category: "Botánica",
    medium: "Acuarela",
    src: "/ilustraciones/10-tallos.svg",
    width: 900,
    height: 1200,
    alt: "Vasija verde con tres tallos largos y flores pequeñas.",
  },
  {
    slug: "eco",
    title: "Eco",
    year: 2024,
    category: "Personal",
    medium: "Serigrafía",
    src: "/ilustraciones/11-eco.svg",
    width: 1000,
    height: 1000,
    alt: "Arcos concéntricos en azul grisáceo sobre fondo claro.",
  },
  {
    slug: "bordado",
    title: "Bordado",
    year: 2023,
    category: "Personal",
    medium: "Bordado sobre papel",
    src: "/ilustraciones/12-bordado.svg",
    width: 900,
    height: 1200,
    alt: "Puntos alineados en retícula con un disco terracota al centro.",
  },
];

export const categories: Category[] = ["Editorial", "Infantil", "Botánica", "Personal"];

export const featured = illustrations.filter((i) => i.featured);
