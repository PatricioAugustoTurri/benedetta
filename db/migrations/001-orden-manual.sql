-- 001 · El orden del archivo pasa a ser una decisión, no un cálculo
--
-- Correr una sola vez sobre una base que ya existe:
--   psql -d illustrando -f db/migrations/001-orden-manual.sql
--
-- Una base nueva no necesita esto: db/schema.sql ya viene con la columna.
--
-- Hasta acá la grilla salía `ORDER BY year DESC, id DESC`, que es un orden
-- que nadie eligió: lo decidía la fecha de la obra y, a igual año, el número
-- que le había tocado en la tabla. Eso alcanza para un archivo que se lee
-- como una cronología, y no alcanza para uno que se cura: qué pieza abre el
-- sitio y cuál va al lado de cuál es una decisión de ella, y no tenía dónde
-- escribirse.

BEGIN;

ALTER TABLE works ADD COLUMN position integer;

-- El orden que había hasta ahora se conserva tal cual, numerado. Arrancar
-- desde el orden vigente y no desde cero es lo que hace que la migración no
-- se note: ella abre el admin y ve el archivo como lo dejó, con la
-- diferencia de que ahora lo puede mover.
WITH orden_heredado AS (
  SELECT id, row_number() OVER (ORDER BY year DESC, id DESC) AS n
    FROM works
)
UPDATE works
   SET position = orden_heredado.n
  FROM orden_heredado
 WHERE works.id = orden_heredado.id;

ALTER TABLE works ALTER COLUMN position SET NOT NULL;

-- Único, porque dos obras en el mismo lugar es exactamente el error que esta
-- columna existe para no tener: si pasa, la grilla vuelve a ordenarse sola
-- entre dos cargas y no hay forma de darse cuenta mirando.
--
-- DEFERRABLE INITIALLY DEFERRED porque reordenar es, por definición, pasar
-- por estados donde dos filas se pisan: mover la quinta al primer lugar
-- corre cuatro obras un casillero, y en el medio de ese UPDATE hay
-- duplicados. La restricción se verifica al cerrar la transacción, cuando el
-- orden ya es un orden.
ALTER TABLE works
  ADD CONSTRAINT works_position_unica UNIQUE (position) DEFERRABLE INITIALLY DEFERRED;

-- El índice por año se va con el orden que servía. Ya no queda ninguna
-- consulta que ordene o filtre por `year`: en la ficha de la obra el año es
-- un dato que se muestra, no uno por el que se busca. Un índice que nadie
-- usa es trabajo en cada escritura a cambio de nada.
--
-- La restricción de arriba deja su propio índice sobre `position`, que es
-- el que ahora recorre la grilla, así que no hace falta crear otro.
DROP INDEX IF EXISTS works_year_idx;

COMMIT;
