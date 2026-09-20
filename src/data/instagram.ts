/**
 * Las publicaciones de Instagram que se ven en el pie.
 *
 * **Estas tres son reales.** Las eligió el cliente, una por una, y son las
 * primeras ilustraciones de ella que entran al sitio: todo lo demás que se ve
 * en `public/ilustraciones/` sigue siendo relleno generado para la maqueta.
 * Los `href` van a las publicaciones de verdad, no al perfil.
 *
 * ## Por qué la lista está escrita a mano y no la trae una API
 *
 * Meta cerró la Instagram Basic Display API el 4 de diciembre de 2024, que
 * era la que servía cuentas personales. Lo que quedó exige una cuenta
 * Professional (Creator o Business) y un token que vence a los 60 días y hay
 * que renovar; este sitio es estático y no tiene dónde guardar un secreto ni
 * dónde correr esa renovación. La salida habitual es un feed JSON de terceros
 * —Behold y parecidos— que sostiene la conexión y publica un array público.
 *
 * Se descartó a pedido del cliente, y la decisión es buena mientras sean tres
 * piezas elegidas: **esto no es un feed, es una selección**. Un feed muestra
 * lo último que subió; esto muestra lo que ella quiere que se vea. Para
 * cambiarlas se cambian estas tres entradas y las tres imágenes.
 *
 * ## Las imágenes
 *
 * Están servidas desde `public/instagram/` y no desde el CDN de Instagram, y
 * eso no es preferencia: las URL de `scontent-*.cdninstagram.com` vienen
 * firmadas y con vencimiento, así que un link directo se rompe solo en
 * cuestión de días. Son las de las publicaciones, 640×640, ~45 KB cada una.
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

export const profileUrl = PROFILE;
export const handle = "@illustrando.adocchichiusi";

/*
  Los `alt` los escribí mirando cada imagen, en italiano como el resto del
  pie. Describen lo que se ve y nada más: no inventan título, ni encargo, ni
  fecha. Si ella les pone un texto alternativo propio en Instagram, ése gana
  y estos se reemplazan.
*/
export const posts: Post[] = [
  {
    id: "C7g1uUIs3ab",
    src: "/instagram/mondo.jpg",
    width: 640,
    height: 640,
    alt: "Una donna seduta sul mondo, con gli occhi chiusi, in un cielo viola punteggiato di stelle.",
    href: "https://www.instagram.com/p/C7g1uUIs3ab/",
  },
  {
    id: "Cqa5QjTuWXc",
    src: "/instagram/libellula.jpg",
    width: 640,
    height: 640,
    alt: "Una ragazza con ali da libellula seduta fra le nuvole, con un fiorellino fra i capelli.",
    href: "https://www.instagram.com/p/Cqa5QjTuWXc/",
  },
  {
    id: "ClTZU26NRSh",
    src: "/instagram/stella.jpg",
    width: 640,
    height: 640,
    alt: "Una ragazza che tiene una stella luminosa sul palmo della mano, su fondo bruno.",
    href: "https://www.instagram.com/p/ClTZU26NRSh/",
  },
];
