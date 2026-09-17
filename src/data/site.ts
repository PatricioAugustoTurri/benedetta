/**
 * Configuración del sitio.
 * Editá este archivo para cambiar nombre, textos y redes en todo el sitio.
 */
export const site = {
  name: "Benedetta",
  role: "Ilustradora",
  // Se usa en el <title> y en las tarjetas al compartir el link.
  tagline: "Ilustración editorial, infantil y botánica",
  description:
    "Portfolio de ilustración de Benedetta. Trabajo editorial, libro infantil y series botánicas en acuarela y lápiz.",
  // Cambiar por el dominio final antes de publicar.
  url: "https://benedetta.com",
  email: "hola@benedetta.com",
  location: "Buenos Aires, AR",
  socials: [
    { label: "Instagram", href: "https://instagram.com/" },
    { label: "Behance", href: "https://behance.net/" },
  ],
} as const;

export const nav = [
  { label: "Ilustraciones", href: "/ilustraciones" },
  { label: "Sobre mí", href: "/sobre-mi" },
  { label: "Contacto", href: "/contacto" },
] as const;
