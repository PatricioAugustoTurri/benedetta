/**
 * Últimas publicaciones de Instagram.
 *
 * PLACEHOLDER: por ahora es una lista escrita a mano que reusa las imágenes
 * de la maqueta. Para que sea real hay dos caminos:
 *   a) Un export manual: subir las imágenes a public/instagram/ y listarlas acá.
 *   b) La Instagram Basic Display API, que necesita token y refresco periódico.
 * Decidir cuál antes de publicar.
 */
export type Post = {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  href: string;
};

const PROFILE = "https://www.instagram.com/illustrando.adocchichiusi/";

export const posts: Post[] = [
  {
    id: "1",
    src: "/ilustraciones/10-tallos.svg",
    width: 900,
    height: 1200,
    alt: "Vasija verde con tres tallos largos y flores pequeñas.",
    href: PROFILE,
  },
  {
    id: "2",
    src: "/ilustraciones/06-ceramica.svg",
    width: 960,
    height: 1200,
    alt: "Vasija ocre con tres tallos y flores redondas asomando.",
    href: PROFILE,
  },
  {
    id: "3",
    src: "/ilustraciones/04-herbario.svg",
    width: 900,
    height: 1200,
    alt: "Una hoja grande con nervaduras dibujadas en claro sobre verde.",
    href: PROFILE,
  },
  {
    id: "4",
    src: "/ilustraciones/12-bordado.svg",
    width: 900,
    height: 1200,
    alt: "Puntos alineados en retícula con un disco terracota al centro.",
    href: PROFILE,
  },
];

export const profileUrl = PROFILE;
export const handle = "@illustrando.adocchichiusi";
