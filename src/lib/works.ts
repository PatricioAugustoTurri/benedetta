import { query, transaction } from "@/lib/db";

/**
 * Una imagen de una obra. Es la forma que guarda la columna `image`, que es un
 * arreglo ordenado: el primer elemento es la portada, la que sale en la grilla.
 *
 * `width` y `height` no son opcionales y no se escriben a mano: los devuelve
 * Cloudinary al recibir el archivo. Son lo que `next/image` necesita para
 * reservar el hueco antes de que la imagen cargue, y una medida inventada
 * hace saltar la página en el momento exacto en que se está mirando la obra.
 *
 * `publicId` es el nombre que la imagen tiene dentro de la cuenta de
 * Cloudinary, y existe por una sola razón: es lo único que permite borrarla
 * de ahí cuando se borra la obra. Sin él, cada obra eliminada dejaría sus
 * imágenes ocupando la cuenta para siempre.
 *
 * Es opcional porque las imágenes que vivían en `public/` no lo tienen: ésas
 * se borran del disco por su URL. La columna acepta las dos formas.
 */
export type WorkImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
  publicId?: string;
};

export type Work = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  image: WorkImage[];
  year: number;
  tecnica: string;
};

/**
 * Lo que se puede escribir. `id` no está: lo pone la base, y dejar que el
 * formulario lo proponga es abrir la puerta a que dos obras discutan por el
 * mismo número.
 */
export type WorkInput = Omit<Work, "id">;

/*
  `year` llega de la base como número; `id` también. El resto es texto o jsonb,
  que el driver ya entrega como objeto. No hace falta mapear nada salvo
  asegurar que `image` sea un arreglo aunque la fila venga de antes de que la
  restricción existiera.
*/
function hydrate(row: Record<string, unknown>): Work {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    title: String(row.title),
    description: row.description === null ? null : String(row.description),
    image: Array.isArray(row.image) ? (row.image as WorkImage[]) : [],
    year: Number(row.year),
    tecnica: String(row.tecnica),
  };
}

/**
 * El archivo entero, en el orden que ella le dio.
 *
 * Ese orden vive en la columna `position` y se escribe arrastrando en
 * /admin. Antes salía `ORDER BY year DESC, id DESC`, que es un orden que
 * nadie había elegido: qué pieza abría el sitio lo decidía la fecha de la
 * obra, y entre dos del mismo año, el número que les había tocado en la
 * tabla. El año sigue en la ficha; dejó de mandar.
 *
 * El desempate por `id` descendente queda aunque `position` sea única, y no
 * es de adorno: es lo que le da al motor un orden total incluso si alguna vez
 * dos filas empatan por una escritura hecha a mano desde psql. Una grilla que
 * se reordena sola entre dos cargas es un error que cuesta horas encontrar.
 */
export async function listWorks(): Promise<Work[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, slug, title, description, image, year, tecnica
       FROM works
      ORDER BY position ASC, id DESC`,
  );
  return rows.map(hydrate);
}

export async function getWork(slug: string): Promise<Work | null> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, slug, title, description, image, year, tecnica
       FROM works
      WHERE slug = $1`,
    [slug],
  );
  return rows[0] ? hydrate(rows[0]) : null;
}

export async function getWorkById(id: number): Promise<Work | null> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, slug, title, description, image, year, tecnica
       FROM works
      WHERE id = $1`,
    [id],
  );
  return rows[0] ? hydrate(rows[0]) : null;
}

/** Sólo los slugs, para `generateStaticParams`. */
export async function listSlugs(): Promise<string[]> {
  const rows = await query<{ slug: string }>(`SELECT slug FROM works`);
  return rows.map((r) => r.slug);
}

/**
 * La obra anterior y la siguiente dentro del archivo, para navegar sin volver.
 * El orden tiene que ser el mismo que el de `listWorks` o el paginado
 * contradice a la grilla de la que salió.
 */
export async function neighbours(slug: string): Promise<{ prev: Work | null; next: Work | null }> {
  const all = await listWorks();
  const i = all.findIndex((w) => w.slug === slug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? all[i - 1] : null,
    next: i < all.length - 1 ? all[i + 1] : null,
  };
}

/**
 * Una obra nueva entra primera en la grilla.
 *
 * `position` no la manda el formulario: la calcula la base tomando el mínimo
 * que ya existe y restándole uno. Ella acaba de cargar esa pieza, así que es
 * la que quiere ver, y pedirle que además la arrastre desde el final hasta
 * arriba sería cobrarle un gesto por algo que ya dijo al subirla.
 *
 * Que el número se vaya a negativo no importa: `position` es un ordinal, se
 * lee sólo en comparación con los otros, y el próximo reordenamiento renumera
 * todo de 1 a n. El COALESCE cubre la tabla vacía, donde no hay mínimo.
 */
export async function createWork(input: WorkInput): Promise<Work> {
  return transaction(async (run) => {
    /*
      El lugar de la obra nueva se calcula leyendo el mínimo que ya existe, y
      entre esa lectura y la escritura cabe otra alta: las dos elegirían el
      mismo ordinal y la segunda moriría contra `works_position_unica`. El
      error que ella vería sería «La base rechazó la obra. Revisá los campos.»
      sobre campos que están impecables, que es un callejón sin salida.

      La traba lo hace imposible en vez de improbable. Es de tabla y suena
      caro, pero acá escribe una sola persona desde una sola pantalla: no hay
      nadie a quien hacer esperar. Deja pasar las lecturas, así que el sitio
      público no se entera.
    */
    await run(`LOCK TABLE works IN SHARE ROW EXCLUSIVE MODE`);

    const rows = await run<Record<string, unknown>>(
      `INSERT INTO works (slug, title, description, image, year, tecnica, position)
            VALUES ($1, $2, $3, $4::jsonb, $5, $6,
                    (SELECT COALESCE(MIN(position), 1) - 1 FROM works))
         RETURNING id, slug, title, description, image, year, tecnica`,
      [
        input.slug,
        input.title,
        input.description,
        JSON.stringify(input.image),
        input.year,
        input.tecnica,
      ],
    );
    return hydrate(rows[0]);
  });
}

export async function updateWork(id: number, input: WorkInput): Promise<Work> {
  const rows = await query<Record<string, unknown>>(
    `UPDATE works
        SET slug = $2, title = $3, description = $4, image = $5::jsonb,
            year = $6, tecnica = $7
      WHERE id = $1
  RETURNING id, slug, title, description, image, year, tecnica`,
    [
      id,
      input.slug,
      input.title,
      input.description,
      JSON.stringify(input.image),
      input.year,
      input.tecnica,
    ],
  );
  return hydrate(rows[0]);
}

/**
 * Devuelve la obra borrada en vez de nada: quien llama necesita saber qué
 * archivos de imagen quedaron sin dueño para poder limpiarlos.
 */
export async function deleteWork(id: number): Promise<Work | null> {
  const rows = await query<Record<string, unknown>>(
    `DELETE FROM works
       WHERE id = $1
   RETURNING id, slug, title, description, image, year, tecnica`,
    [id],
  );
  return rows[0] ? hydrate(rows[0]) : null;
}

/**
 * Reescribe el orden del archivo entero: `orden` son los ids de todas las
 * obras, de la primera a la última de la grilla.
 *
 * **Pide la lista completa a propósito.** Un reordenamiento parcial —«poné
 * estas tres acá»— obliga a inventar qué pasa con las demás, y cada respuesta
 * posible deja huecos o duplicados. Con la lista entera hay una sola lectura:
 * el archivo es esto, en este orden.
 *
 * Devuelve `false`, sin escribir nada, cuando lo que llega no es una
 * permutación de lo que hay. Eso no es paranoia: la pantalla arma la lista al
 * abrirse, y si mientras tanto se cargó o se borró una obra desde otra
 * pestaña, guardar dejaría una pieza fuera del orden o pisaría un lugar. Vale
 * más rechazarlo y que la pantalla se recargue.
 *
 * El `WITH ORDINALITY` es lo que hace que sea un solo UPDATE: numera el
 * arreglo tal como llegó —el primer id es el 1— y lo une contra la tabla por
 * id. Sin eso habría que mandar una consulta por obra.
 */
export async function reorderWorks(orden: number[]): Promise<boolean> {
  return transaction(async (run) => {
    /*
      FOR UPDATE traba las filas hasta el COMMIT. Sin eso, entre comprobar que
      la lista está completa y escribirla cabe cualquier otra escritura, y la
      comprobación pasa a no significar nada.
    */
    const actuales = await run<{ id: number }>(`SELECT id FROM works ORDER BY id FOR UPDATE`);

    const hay = new Set(actuales.map((r) => Number(r.id)));
    const pedidas = new Set(orden);
    if (pedidas.size !== orden.length) return false; // un id repetido
    if (pedidas.size !== hay.size) return false;
    if (orden.some((id) => !hay.has(id))) return false;

    await run(
      `UPDATE works AS w
          SET position = nuevo.n
         FROM unnest($1::int[]) WITH ORDINALITY AS nuevo(id, n)
        WHERE w.id = nuevo.id`,
      [orden],
    );

    return true;
  });
}

/** ¿Está la base viva? La barra del admin lo dice en una palabra. */
export async function pingDb(): Promise<boolean> {
  try {
    await query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
