# La base

El archivo de obra vive en PostgreSQL. Una sola tabla, `works`, y el admin del
sitio (`/admin`) es lo que escribe en ella.

## Levantarla de cero

```bash
createdb illustrando
psql -d illustrando -f db/schema.sql
```

Después, copiá `.env.example` como `.env.local` y completá las dos variables:

```
DATABASE_URL=postgresql://<tu-usuario>@localhost:5432/illustrando
ADMIN_PASSWORD=<la clave de /admin>
```

Sin `ADMIN_PASSWORD` el admin no se abre. Es a propósito: un panel que se
abre solo porque faltaba una variable es peor que uno que no se abre.

## La tabla

| columna | tipo | nota |
|---|---|---|
| `id` | `integer` identity | la pone la base |
| `slug` | `text` único | lo que va después de `/opera/` |
| `title` | `text` | |
| `description` | `text` | puede faltar |
| `image` | `jsonb` | arreglo ordenado; el primero es la portada |
| `year` | `smallint` | dato de la ficha; no ordena nada |
| `tecnica` | `text` | texto libre |
| `position` | `integer` único | el lugar en la grilla, lo decide ella |
| `created_at` / `updated_at` | `timestamptz` | `updated_at` la mueve un trigger |

## El orden lo decide ella

`position` es lo que ordena el archivo, y se escribe arrastrando las obras en
`/admin`. El sitio público lee el mismo orden, y también el paginado de la
ficha de cada obra.

Antes ordenaba `year DESC, id DESC`, que no era una decisión de nadie: qué
pieza abría el sitio salía de la fecha de la obra y, a igual año, del número
que le había tocado en la tabla.

Es un ordinal, no un índice: sólo importa en comparación con los otros, y no
tiene por qué ser contiguo ni empezar en 1. Una obra nueva entra con el mínimo
menos uno —así la última cargada abre la grilla—, y cada reordenamiento
renumera todo de 1 a n.

La restricción de unicidad es `DEFERRABLE INITIALLY DEFERRED` a propósito:
reordenar pasa por estados donde dos filas se pisan, y se verifica al cerrar
la transacción, cuando el orden ya es un orden.

## Migraciones

`db/schema.sql` levanta una base nueva con todo puesto. Una base que ya
existe se actualiza corriendo, una sola vez, lo que falte de `db/migrations/`:

```bash
psql -d illustrando -f db/migrations/001-orden-manual.sql
psql -d illustrando -f db/migrations/002-shop.sql
psql -d illustrando -f db/migrations/003-servizi.sql
psql -d illustrando -f db/migrations/004-mockup.sql
psql -d illustrando -f db/migrations/005-copertine.sql
psql -d illustrando -f db/migrations/006-newsletter.sql
```

## La tienda: `prodotti`, `servizi`, `copertine` y `ordini`

`prodotti` son las stampe, y sólo stampe (`categoria = 'stampe'`). `formati`
(`[{ "formato": "A4", "prezzo": 1500 }]`, precios en centavos enteros) no puede
quedar vacío. `pubblicato` arranca en falso: una stampa nueva es una bozza.
`opera_slug` apunta a `works.slug` y sigue a la obra si se renombra.
`mockup` es la stampa colgada en un ambiente, una sola imagen o nada: en la
grilla de la tienda reemplaza a la portada cuando el mouse se queda un segundo
encima.

`servizi` tiene exactamente dos filas, `illustrazioni-personalizzate` y
`ritratti-illustrati`, que crea la migración 003. Son los dos trabajos por
encargo: no tienen precio y no se agregan ni se borran; el admin sólo cambia
su nombre, su texto y sus imágenes.

`copertine` guarda la imagen de cada categoría en la página `/shop`, una fila
por categoría que la tenga. Se elige en `/admin/shop/copertine`. Sin fila, la
página usa la primera imagen del servicio o de la primera stampa publicada.

`ordini` la escribe sólo el webhook de Stripe (`/api/stripe/webhook`), una fila
por pago, con una copia de lo comprado: si mañana cambia un precio, el pedido
de ayer sigue diciendo lo que se pagó. `stripe_session_id` es único, así un
evento repetido no duplica el pedido.

Cada elemento de `image` es `{ "url", "alt", "width", "height" }`. El ancho y
el alto los lee el servidor del archivo subido, no se escriben a mano: son lo
que `next/image` necesita para reservar el hueco antes de que la imagen cargue.

Las restricciones de la tabla rechazan un `image` que no sea arreglo, un
elemento sin `url`, un slug con mayúsculas o espacios, un slug repetido, un
año de dos cifras y un título o una técnica en blanco.

## Las imágenes

Los archivos que sube el admin caen en `public/ilustraciones/` con un nombre
generado. Borrar una obra borra también sus archivos; editarla borra los que
la edición dejó afuera.

## El sitio necesita la base

Desde que el archivo vive acá, `npm run build` no termina sin PostgreSQL
levantado: la portada y las páginas de obra se generan leyendo la tabla. En
esta máquina:

```bash
brew services start postgresql@17
```

## La newsletter: `iscritti` e `invii`

Quien se suscribe desde el pie de página queda en `iscritti` sin confirmar y
recibe una mail con un link; recién al apretar «Conferma» en esa página entra
en la lista (`confermato_at`). Darse de baja llena `disiscritto_at` y la fila
se queda, como prueba de que no hay que escribirle más. Las suscripciones sin
confirmar se borran solas a los 30 días.

`works.annunciato_at` y `prodotti.annunciato_at` en nulo quieren decir «todavía
no se avisó»: son las novedades que aparecen en `/admin/newsletter`. Al enviar,
o al sacarlas de la lista sin enviar, se llenan. La migración 006 marca todo lo
que ya existía como avisado.

`invii` guarda cada envío con una copia de lo que llevaba y a cuántos llegó.

