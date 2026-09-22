-- illustrando · esquema
--
-- Base: illustrando (PostgreSQL 17)
-- Correr con:  psql -d illustrando -f db/schema.sql
--
-- Este archivo es la fuente de verdad de la estructura. Si cambia una columna,
-- cambia acá primero y después en la base: al revés, la próxima máquina que
-- levante el proyecto arranca con un esquema que no es el que se está usando.

BEGIN;

-- --------------------------------------------------------------------------
-- works — el archivo de obra
--
-- Una fila por pieza, y la única fuente: el sitio lee de acá. Reemplazó a
-- src/data/illustrations.ts, que se eliminó. Quien escribe es /admin.
-- --------------------------------------------------------------------------
CREATE TABLE works (
  id          integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- El identificador del link permanente: /opera/<slug>. Va UNIQUE porque una
  -- URL que ya se compartió no puede empezar a apuntar a otra obra. El CHECK
  -- lo mantiene apto para una URL: minúsculas, números y guiones, nada más.
  slug        text        NOT NULL UNIQUE
              CONSTRAINT works_slug_formato CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

  title       text        NOT NULL
              CONSTRAINT works_title_no_vacio CHECK (length(trim(title)) > 0),

  -- El contexto del encargo, para la página de la obra. Puede faltar: una
  -- pieza puede entrar al archivo antes de que esté escrito su texto.
  description text,

  -- Las imágenes de la obra, en orden: la primera es la portada, la que sale
  -- en la grilla del archivo. Es un arreglo y no una columna suelta porque
  -- cada pieza tiene más de una toma —el frente, un detalle, la hoja sobre la
  -- mesa— y esa cantidad cambia de obra en obra.
  --
  -- jsonb y no text[] porque cada imagen no es sólo una dirección: Next.js
  -- necesita las medidas reales del archivo para reservar el hueco antes de
  -- que cargue, y el alt es obligación de accesibilidad, no un extra. Un
  -- arreglo de URLs sueltas obligaría a guardar todo eso en otro lado.
  --
  -- Sigue la convención que ya usaban products.image y categories.portada en
  -- esta misma base.
  --
  -- Forma de cada elemento:
  --   { "url": "/ilustraciones/01-a.jpg",   -- requerida
  --     "alt": "Rama con hojas bajo un círculo",
  --     "width": 900,
  --     "height": 1200 }
  image       jsonb       NOT NULL DEFAULT '[]'::jsonb
              -- Dos reglas, y las dos son sobre la forma, no sobre el
              -- contenido: que sea un arreglo, y que ningún elemento venga sin
              -- url. Va con jsonpath porque un CHECK no admite subconsultas,
              -- así que no se puede recorrer el arreglo con un SELECT.
              --
              -- La segunda cuenta en vez de buscar al que está mal: un filtro
              -- `? (@.url.type() != "string")` no atrapa al elemento que no
              -- tiene `url` —si la clave no está, no hay nada que comparar y
              -- el filtro no lo ve pasar—. Contando los que sí la tienen y
              -- exigiendo que sean todos, el que falta cae igual.
              --
              -- El CASE no es adorno: Postgres no garantiza el orden en que
              -- evalúa un AND, y jsonb_array_length sobre algo que no es
              -- arreglo no devuelve falso, revienta. El CASE sí garantiza que
              -- primero se mire el tipo.
              CONSTRAINT works_image_es_arreglo CHECK (jsonb_typeof(image) = 'array')
              CONSTRAINT works_image_con_url CHECK (
                CASE WHEN jsonb_typeof(image) = 'array' THEN
                  jsonb_array_length(
                    jsonb_path_query_array(image, '$[*] ? (@.url.type() == "string")')
                  ) = jsonb_array_length(image)
                ELSE true END
              ),

  -- El año de la obra. Es un dato de la ficha, no el orden del archivo: se
  -- muestra al lado del título y no decide nada. smallint alcanza y sobra.
  -- El piso es arbitrario pero atrapa el error real: un año de dos cifras o
  -- un tipeo de cuatro dígitos que empieza con 1.
  year        smallint    NOT NULL
              CONSTRAINT works_year_plausible CHECK (year BETWEEN 1900 AND 2200),

  -- El lugar de la pieza en la grilla, que lo decide ella arrastrando en
  -- /admin. Es la única columna que existe para una decisión de curaduría y
  -- no para un dato de la obra.
  --
  -- Existe porque el orden anterior —año descendente, y a igual año el id más
  -- alto primero— no lo había elegido nadie: qué pieza abre el sitio quedaba
  -- librado a la fecha de la obra y al número que le tocó en la tabla.
  --
  -- Es un ordinal, no un índice: se lee sólo en comparación con las otras, y
  -- no tiene por qué ser contiguo ni empezar en 1. Una obra nueva entra con
  -- el mínimo menos uno, así que la última cargada abre la grilla; reordenar
  -- renumera todo de 1 a n.
  position    integer     NOT NULL,

  -- Acuarela, gouache, lápiz, serigrafía, tinta y digital… Texto libre a
  -- propósito: es la ficha de una pieza hecha a mano, y encerrarlo en una
  -- lista fija obligaría a migrar la tabla cada vez que ella pruebe algo.
  tecnica     text        NOT NULL
              CONSTRAINT works_tecnica_no_vacia CHECK (length(trim(tecnica)) > 0),

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Dos obras no pueden reclamar el mismo lugar: si pasa, la grilla se
-- reordena sola entre dos cargas y no hay forma de notarlo mirando.
--
-- DEFERRABLE INITIALLY DEFERRED porque reordenar es, por definición, pasar
-- por estados donde dos filas se pisan: mover la quinta al primer lugar corre
-- cuatro obras un casillero, y en el medio de ese UPDATE hay duplicados. Se
-- verifica al cerrar la transacción, cuando el orden ya es un orden.
--
-- La restricción deja su propio índice sobre `position`, que es el único
-- orden en que se recorre el archivo, así que no hace falta crear ninguno
-- más. No hay índice por `year`: ninguna consulta ordena ni filtra por él.
ALTER TABLE works
  ADD CONSTRAINT works_position_unica UNIQUE (position) DEFERRABLE INITIALLY DEFERRED;

-- --------------------------------------------------------------------------
-- updated_at se mantiene solo.
--
-- En el trigger y no en la aplicación: si la fecha dependiera de que quien
-- escribe se acuerde de ponerla, el día que alguien corrija un título con un
-- UPDATE a mano desde psql la columna mentiría, que es peor que no tenerla.
-- --------------------------------------------------------------------------
CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER works_set_updated_at
  BEFORE UPDATE ON works
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
