/**
 * Configuración del sitio.
 * Editá este archivo para cambiar nombre, textos y redes en todo el sitio.
 */
export const site = {
  name: "Illustrando",
  author: "Benedetta",
  role: "Illustratrice",
  // Se usa en el <title> y en las tarjetas al compartir el link.
  tagline: "Illustrazione editoriale, per l'infanzia e botanica",
  description:
    "Portfolio de ilustración de Benedetta. Trabajo editorial, libro infantil y series botánicas en acuarela y lápiz.",
  // PLACEHOLDER: no hay dominio comprado todavía. Cambiar antes de publicar:
  // se usa para el SEO y para las tarjetas al compartir el link.
  url: "https://illustrando.it",
  email: "bzibetti98@gmail.com",
  location: "Foligno, Italia",
  /**
   * La línea de oficio del pie. Es la posición de PRODUCT.md dicha en una
   * frase —analógico como origen, digital como entrega— y es lo único que el
   * pie afirma sobre el trabajo. No promete servicios ni nombra clientes:
   * eso vive en Studio y hoy es texto de relleno.
   */
  craft: "Acquerello, gouache e matita su carta. Il digitale solo quando il lavoro lo chiede.",
  /*
    PENDIENTE LEGAL — no inventar. Si ella factura como autónoma en Italia, la
    partita IVA y el titular del sitio van en el pie por obligación. No los
    tenemos. Cuando lleguen, entran en la línea de cierre del Footer, al lado
    del copyright; el renglón ya está armado para recibir un dato más.
  */
  // Sólo las redes con URL real. Behance existe pero todavía no tenemos el
  // link al perfil, y publicarlo apuntando a la home de behance.net manda al
  // visitante a ningún lado: vuelve a la lista cuando esté la URL.
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/illustrando.adocchichiusi/" },
  ],
} as const;

/**
 * Navegación principal. "Works" apunta a la raíz porque la portada es el
 * archivo de obra, no una antesala del archivo.
 *
 * **Los rótulos están en inglés a pedido del cliente**, y eso contradice a
 * PRODUCT.md, que fija el italiano como principio de producto y dice que
 * Work y About eran interinos. La contradicción queda escrita acá en vez de
 * resolverse sola: si algún día se vuelve al italiano, son Opera y Studio, y
 * "Contatti" —hoy el único rótulo italiano que quedó— es la punta del hilo.
 *
 * Las rutas NO cambian: siguen siendo `/studio` y `/contatti`. Un rótulo se
 * reescribe gratis; una URL que ya se compartió, no.
 *
 * "Shop" no sale de esta lista aunque ya tenga página (`/shop`): en la barra
 * es un rótulo doble —un link al índice de categorías y, al lado, un botón
 * que asoma el desplegable— y eso no se arma recorriendo un array de rutas.
 * El menú lo intercala a mano después de Works. Ver `ShopMenu`.
 */
export const nav = [
  { label: "Works", href: "/" },
  { label: "About me", href: "/studio" },
  { label: "Contatti", href: "/contatti" },
] as const;

/**
 * Footer: por ahora repite el menú principal. Sigue existiendo separado
 * porque el pie llegó a listar rutas que no estaban arriba, y puede volver
 * a pasar cuando entren la tienda o el diario.
 */
export const footerNav = [
  { label: "Works", href: "/" },
  // Shop sí sale de la lista acá: en el pie es una ruta más, sin desplegable.
  { label: "Shop", href: "/shop" },
  { label: "About me", href: "/studio" },
  { label: "Contatti", href: "/contatti" },
] as const;
