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
  // Sólo las redes con URL real. Behance existe pero todavía no tenemos el
  // link al perfil, y publicarlo apuntando a la home de behance.net manda al
  // visitante a ningún lado: vuelve a la lista cuando esté la URL.
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/illustrando.adocchichiusi/" },
  ],
} as const;

/**
 * Navegación principal. "Work" apunta a la raíz porque la portada
 * es el archivo de obra, no una antesala del archivo.
 */
export const nav = [
  { label: "Work", href: "/" },
  { label: "About", href: "/studio" },
  { label: "Contatti", href: "/contatti" },
] as const;

/**
 * Footer: suma el diario, que salió del menú principal pero sigue publicado.
 * Sin este link las rutas /diario quedarían sin nada que las enlace.
 */
export const footerNav = [
  { label: "Work", href: "/" },
  { label: "About", href: "/studio" },
  { label: "Diario", href: "/diario" },
  { label: "Contatti", href: "/contatti" },
] as const;
