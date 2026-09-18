/**
 * Diario de taller: proceso, bocetos y notas.
 *
 * PLACEHOLDER: las entradas de abajo son de relleno, escritas para que se
 * vea cómo queda la sección. Reemplazar por texto real antes de publicar.
 */
export type Entry = {
  slug: string;
  title: string;
  /** ISO: YYYY-MM-DD. Se formatea al mostrar. */
  date: string;
  /** Resumen de una línea para el índice. */
  excerpt: string;
  /** Cuerpo en párrafos. */
  body: string[];
  /** Obra relacionada, si la entrada habla de una. */
  related?: string;
};

export const entries: Entry[] = [
  {
    slug: "seis-laminas-de-noche",
    title: "Seis láminas de noche",
    date: "2025-06-14",
    excerpt:
      "Cómo salió la serie de plantas nocturnas y por qué la primera lámina se rehízo cuatro veces.",
    body: [
      "La serie arrancó por una equivocación: quise dibujar una planta del balcón a las siete de la tarde y para cuando preparé el papel ya no se veía nada. Terminé dibujando la silueta contra el cielo, que era lo único que quedaba.",
      "Las seis láminas siguientes salieron de ahí. La regla que me puse fue no usar blanco para iluminar: si algo tenía que brillar, tenía que ser porque alrededor había suficiente oscuridad.",
      "La primera se rehízo cuatro veces. Las otras cinco salieron casi de una, que es más o menos siempre cómo funciona.",
    ],
    related: "jardin-nocturno",
  },
  {
    slug: "registro-corrido",
    title: "El registro corrido",
    date: "2025-03-02",
    excerpt: "Dos tintas, un taller compartido y veinticinco copias que no son iguales.",
    body: [
      "En serigrafía el registro es la parte que nadie muestra. Si las dos tintas no caen exactamente una sobre otra, aparece un borde de color donde no tenía que haber nada.",
      "En la edición de Ritmo ese borde aparece en casi todas las copias, con un corrimiento distinto en cada una. Al principio lo di por error. Después empecé a elegir las que tenían más corrimiento.",
    ],
    related: "ritmo",
  },
  {
    slug: "una-hoja-por-semana",
    title: "Una hoja por semana",
    date: "2024-11-20",
    excerpt: "Un invierno entero dibujando lo mismo, para ver qué cambiaba.",
    body: [
      "No era un proyecto. Era una excusa para sentarme a dibujar los lunes, que son el día en que menos ganas tengo.",
      "Lo que cambió no fue el dibujo, fue el tiempo: la primera hoja me llevó dos horas y la última cuarenta minutos, y la última es mejor.",
    ],
    related: "herbario",
  },
];

export function getEntry(slug: string): Entry | undefined {
  return entries.find((e) => e.slug === slug);
}

/** Fecha larga en italiano, que es el idioma final del sitio. */
export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
