"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Trash } from "@/components/Icon";
import { descartarImagen, guardarObra, pedirPermisoDeSubida, type EstadoFormulario } from "../actions";
import { enMB, MAX_ARCHIVO_MB, MB } from "@/lib/limites";
import type { Work } from "@/lib/works";

/*
  El vocabulario de campo del sitio, el mismo que usa el formulario de
  Contatti: rótulo en versalitas, control sobre un solo filete, sin caja ni
  relleno ni radio. Se repite acá en vez de importarse porque aquel archivo
  las declara para su propio uso; el día que haya un tercer formulario, estas
  dos constantes se mudan a un módulo compartido y no antes.
*/
const LABEL = "label block text-ink-faint transition-colors";
const CONTROL =
  "peer block w-full border-0 border-b border-line bg-transparent py-2.5 text-base text-ink transition-colors placeholder:text-ink-faint focus:border-ink aria-[invalid=true]:border-accent";

/**
 * Una imagen en el formulario.
 *
 * Las nuevas llevan estado porque suben a Cloudinary apenas se las elige, no
 * al guardar: mientras viaja un escaneo de 8 MB hay que poder decir por dónde
 * va, y al terminar la imagen ya tiene dirección y medidas propias.
 */
type Nueva = {
  key: string;
  tipo: "nueva";
  file: File;
  alt: string;
  preview: string;
  estado: "subiendo" | "listo" | "error";
  progreso: number;
  url?: string;
  publicId?: string;
  width?: number;
  height?: number;
  mensaje?: string;
};

type Item =
  | {
      key: string;
      tipo: "existente";
      url: string;
      alt: string;
      width: number;
      height: number;
      publicId?: string;
    }
  | Nueva;

/**
 * Manda un archivo a Cloudinary desde el navegador, informando el avance.
 *
 * `XMLHttpRequest` y no `fetch`: fetch no expone el progreso de subida, y sin
 * progreso un escaneo grande deja la pantalla quieta un minuto sin decir si
 * está pasando algo o se colgó.
 *
 * El archivo no toca el servidor de este proyecto. Lo único que vino de él es
 * la firma, que autoriza esta subida a esta carpeta y vence sola.
 */
function subirACloudinary(
  file: File,
  permiso: { url: string; apiKey: string; timestamp: number; signature: string; folder: string },
  alAvanzar: (porcentaje: number) => void,
): Promise<{ url: string; publicId: string; width: number; height: number }> {
  return new Promise((resolver, rechazar) => {
    const datos = new FormData();
    datos.append("file", file);
    datos.append("api_key", permiso.apiKey);
    datos.append("timestamp", String(permiso.timestamp));
    datos.append("signature", permiso.signature);
    datos.append("folder", permiso.folder);

    const peticion = new XMLHttpRequest();
    peticion.open("POST", permiso.url);

    peticion.upload.onprogress = (e) => {
      if (e.lengthComputable) alAvanzar(Math.round((e.loaded / e.total) * 100));
    };

    peticion.onload = () => {
      let cuerpo: Record<string, unknown>;
      try {
        cuerpo = JSON.parse(peticion.responseText);
      } catch {
        rechazar(new Error("Cloudinary contestó algo que no se entiende."));
        return;
      }

      if (peticion.status >= 200 && peticion.status < 300) {
        resolver({
          url: String(cuerpo.secure_url),
          publicId: String(cuerpo.public_id),
          width: Number(cuerpo.width),
          height: Number(cuerpo.height),
        });
        return;
      }

      // Cloudinary explica bien sus propios rechazos —formato, tamaño, firma
      // vencida—, así que se muestra su mensaje en vez de uno genérico.
      const error = (cuerpo.error as { message?: string } | undefined)?.message;
      rechazar(new Error(error ?? `Cloudinary rechazó la subida (${peticion.status}).`));
    };

    peticion.onerror = () => rechazar(new Error("Se cortó la conexión al subir."));
    peticion.send(datos);
  });
}

/**
 * De un título a una dirección.
 *
 * Es una propuesta, no una imposición: el campo queda editable y deja de
 * seguir al título en cuanto alguien lo toca a mano. Una obra ya guardada
 * nunca lo recalcula —su dirección puede estar compartida— así que esto sólo
 * corre mientras se carga una obra nueva.
 */
function aDireccion(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function WorkForm({ obra }: { obra?: Work }) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(guardarObra, {});
  const idBase = useId();

  const [titulo, setTitulo] = useState(obra?.title ?? "");
  const [direccion, setDireccion] = useState(obra?.slug ?? "");
  // Una obra guardada no sigue al título; una nueva sí, hasta que la toquen.
  const [direccionTocada, setDireccionTocada] = useState(Boolean(obra));

  const [items, setItems] = useState<Item[]>(
    () =>
      obra?.image.map((img, i) => ({
        key: `guardada-${i}`,
        tipo: "existente" as const,
        url: img.url,
        alt: img.alt,
        width: img.width,
        height: img.height,
        publicId: img.publicId,
      })) ?? [],
  );

  const elegir = useRef<HTMLInputElement>(null);

  /*
    Lo que impide guardar, y por qué cada cosa.

    `subiendo`: la imagen todavía viaja a Cloudinary y aún no tiene dirección,
    así que no hay nada que guardar en la base.
    `fallada`: subió mal; guardar dejaría la obra sin esa imagen y sin aviso.
    `pesadas`: Cloudinary las va a rechazar igual, pero decirlo acá ahorra el
    viaje y explica qué hacer.
  */
  const subiendo = items.some((it) => it.tipo === "nueva" && it.estado === "subiendo");
  const falladas = items.filter((it) => it.tipo === "nueva" && it.estado === "error");
  const pesadas = items.filter((it) => it.tipo === "nueva" && it.file.size > MAX_ARCHIVO_MB * MB);
  const bloqueado = subiendo || falladas.length > 0 || pesadas.length > 0;

  /*
    Las miniaturas de los archivos nuevos son URLs de objeto, que el navegador
    sostiene en memoria hasta que se las suelta. Sin esto, cargar seis obras
    seguidas en una sesión deja seis tandas de imágenes completas retenidas.
  */
  useEffect(() => {
    return () => {
      for (const it of items) if (it.tipo === "nueva") URL.revokeObjectURL(it.preview);
    };
    // Corre sólo al desmontar: adentro se lee la lista viva por la clausura,
    // y volver a atarlo en cada cambio revocaría miniaturas todavía en uso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
    Lo que viaja al servidor: apenas un JSON con el orden, el texto
    alternativo y, por cada imagen, su dirección en Cloudinary y sus medidas.

    Los archivos ya no pasan por acá —subieron directo del navegador— así que
    este envío pesa unos cientos de bytes aunque la obra tenga tres escaneos
    de 8 MB. Es lo que hace que el tope del cuerpo de una Server Action deje
    de ser un problema.

    Las que todavía están subiendo o fallaron no entran: el botón está
    bloqueado mientras eso pase, y esto es la segunda red por si se destraba.
  */
  const manifiesto = useMemo(
    () =>
      JSON.stringify(
        items
          .filter((it) => it.tipo === "existente" || it.estado === "listo")
          .map((it) => ({
            url: it.url,
            alt: it.alt,
            width: it.width,
            height: it.height,
            publicId: it.publicId,
          })),
      ),
    [items],
  );

  function actualizar(key: string, cambio: Partial<Nueva>) {
    setItems((previos) =>
      previos.map((it) => (it.key === key && it.tipo === "nueva" ? { ...it, ...cambio } : it)),
    );
  }

  async function sumarArchivos(lista: FileList | null) {
    if (!lista || lista.length === 0) return;

    /*
      La copia se hace acá y no dentro del actualizador de estado, y no es
      cosmético: `lista` es el FileList vivo del input, y el manejador vacía
      ese input apenas termina para poder volver a elegir el mismo archivo.
      React llama al actualizador después, así que si la lectura viviera
      adentro encontraría la lista ya vacía y no se cargaría ninguna imagen.
    */
    const nuevos: Nueva[] = Array.from(lista).map((file, i) => ({
      key: `nueva-${Date.now()}-${i}`,
      tipo: "nueva" as const,
      file,
      alt: "",
      preview: URL.createObjectURL(file),
      estado: "subiendo" as const,
      progreso: 0,
    }));

    setItems((previos) => [...previos, ...nuevos]);

    // Un permiso por tanda: la firma autoriza la carpeta y el momento, no un
    // archivo concreto, así que sirve para todas las de este grupo.
    const respuesta = await pedirPermisoDeSubida();
    if (!respuesta.ok) {
      for (const it of nuevos) actualizar(it.key, { estado: "error", mensaje: respuesta.error });
      return;
    }

    /*
      De a una y no todas a la vez. Tres escaneos en paralelo se reparten el
      ancho de banda de subida y las tres barras avanzan a un tercio de
      velocidad: la primera imagen tarda lo mismo que la última. En fila, la
      primera termina pronto y se puede empezar a escribirle el texto
      alternativo mientras siguen las otras.
    */
    for (const it of nuevos) {
      if (it.file.size > MAX_ARCHIVO_MB * MB) {
        actualizar(it.key, {
          estado: "error",
          mensaje: `Pesa ${enMB(it.file.size)} y el máximo son ${MAX_ARCHIVO_MB} MB.`,
        });
        continue;
      }

      try {
        const subida = await subirACloudinary(it.file, respuesta.permiso, (p) =>
          actualizar(it.key, { progreso: p }),
        );
        actualizar(it.key, { estado: "listo", progreso: 100, ...subida });
      } catch (e) {
        actualizar(it.key, {
          estado: "error",
          mensaje: e instanceof Error ? e.message : "No se pudo subir.",
        });
      }
    }
  }

  function quitar(key: string) {
    setItems((previos) => {
      const fuera = previos.find((it) => it.key === key);
      if (fuera?.tipo === "nueva") {
        URL.revokeObjectURL(fuera.preview);
        /*
          Si ya había subido, se saca también de Cloudinary. Sin esto, cada
          imagen que ella elige y descarta queda ocupando la cuenta para
          siempre, sin que ninguna obra la nombre.

          Sólo las nuevas: una imagen ya guardada puede estar todavía en la
          obra publicada, y se borra recién al guardar los cambios.
        */
        if (fuera.publicId) void descartarImagen(fuera.publicId);
      }
      return previos.filter((it) => it.key !== key);
    });
  }

  function mover(indice: number, paso: -1 | 1) {
    setItems((previos) => {
      const destino = indice + paso;
      if (destino < 0 || destino >= previos.length) return previos;
      const copia = [...previos];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });
  }

  function cambiarAlt(key: string, alt: string) {
    setItems((previos) => previos.map((it) => (it.key === key ? { ...it, alt } : it)));
  }

  return (
    <form action={enviar} className="grid gap-12 md:grid-cols-12 md:gap-16">
      {obra && <input type="hidden" name="id" value={obra.id} />}
      <input type="hidden" name="imagenes" value={manifiesto} />

      {/* ------------------------------------------------ la ficha, 7 col */}
      <div className="md:col-span-7">
        <h1 className="display-lead font-display text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15]">
          {obra ? obra.title : "Nueva obra"}
        </h1>

        {/*
          El aviso de las imágenes va antes del error del servidor porque se
          ve sin haber enviado nada: corrige el problema en vez de informarlo
          después de que el envío falló.
        */}
        {(falladas.length > 0 || pesadas.length > 0) && (
          <p
            role="alert"
            className="mt-5 border-l border-accent bg-paper-deep/60 py-2 pl-3 text-sm text-accent"
          >
            {pesadas.length > 0
              ? `${pesadas.length === 1 ? "Una imagen pasa" : `${pesadas.length} imágenes pasan`} los ${MAX_ARCHIVO_MB} MB. Exportalas más chicas y volvé a elegirlas.`
              : `${falladas.length === 1 ? "Una imagen no subió" : `${falladas.length} imágenes no subieron`}. Quitalas y probá de nuevo, o revisá el detalle debajo de cada una.`}
          </p>
        )}

        {estado.error && (
          /*
            El error va arriba del todo y no al pie del botón: si aparece
            abajo de un formulario largo, quien lo envió desde la mitad de la
            página no lo ve nunca. `role="alert"` hace que se anuncie solo.
          */
          <p
            role="alert"
            className="mt-5 border-l border-accent bg-paper-deep/60 py-2 pl-3 text-sm text-accent"
          >
            {estado.error}
          </p>
        )}

        <div className="mt-8 space-y-7">
          <div className="group/campo">
            <label htmlFor={`${idBase}-title`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
              Título
            </label>
            <input
              id={`${idBase}-title`}
              name="title"
              value={titulo}
              onChange={(e) => {
                setTitulo(e.target.value);
                if (!direccionTocada) setDireccion(aDireccion(e.target.value));
              }}
              required
              autoComplete="off"
              className={`${CONTROL} mt-2`}
            />
          </div>

          <div className="group/campo">
            <label htmlFor={`${idBase}-slug`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
              Dirección
            </label>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
              Lo que va después de /opera/. Minúsculas, números y guiones. Si la obra ya se
              compartió, no la cambies: el link viejo dejaría de funcionar.
            </p>
            <input
              id={`${idBase}-slug`}
              name="slug"
              value={direccion}
              onChange={(e) => {
                setDireccionTocada(true);
                setDireccion(e.target.value);
              }}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              autoComplete="off"
              className={`${CONTROL} mt-2 text-sm tracking-[0.01em]`}
            />
          </div>

          <div className="grid gap-7 sm:grid-cols-2">
            <div className="group/campo">
              <label htmlFor={`${idBase}-year`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
                Año
              </label>
              <input
                id={`${idBase}-year`}
                name="year"
                type="number"
                inputMode="numeric"
                min={1900}
                max={2200}
                defaultValue={obra?.year ?? new Date().getFullYear()}
                required
                className={`${CONTROL} figures mt-2`}
              />
            </div>

            <div className="group/campo">
              <label
                htmlFor={`${idBase}-tecnica`}
                className={`${LABEL} group-has-[:focus]/campo:text-ink`}
              >
                Técnica
              </label>
              <input
                id={`${idBase}-tecnica`}
                name="tecnica"
                defaultValue={obra?.tecnica ?? ""}
                required
                autoComplete="off"
                placeholder="Acuarela y tinta"
                className={`${CONTROL} mt-2`}
              />
            </div>
          </div>

          <div className="group/campo">
            <label
              htmlFor={`${idBase}-description`}
              className={`${LABEL} group-has-[:focus]/campo:text-ink`}
            >
              Texto
            </label>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
              El contexto del encargo, para la página de la obra. Puede quedar vacío.
            </p>
            <textarea
              id={`${idBase}-description`}
              name="description"
              rows={5}
              defaultValue={obra?.description ?? ""}
              className={`${CONTROL} mt-2 field-sizing-content resize-y leading-relaxed`}
            />
          </div>
        </div>

        {/* --------------------------------------------------- imágenes */}
        <div className="mt-12 border-t border-line pt-8">
          <h2 className="label text-ink">Imágenes</h2>
          <p className="mt-1.5 max-w-[46ch] text-xs leading-relaxed text-ink-faint">
            La primera es la portada: la que sale en la grilla del archivo. Cada una sube a
            Cloudinary apenas la elegís, y de ahí salen el ancho y el alto: no hace falta
            cargarlos.
          </p>

          <ul className="mt-6 space-y-4">
            {items.map((it, i) => (
              <li key={it.key} className="flex gap-4 border-b border-line pb-4">
                {/*
                  La miniatura es cuadrada como la grilla, para que se vea acá
                  el mismo recorte que va a verse publicado.
                  <img> y no next/image: mientras sube es un objeto en memoria
                  del navegador, y una vez arriba la sirve Cloudinary, que ya
                  hace su propio redimensionado.

                  Mientras viaja va en tinta apagada: la imagen todavía no
                  está en ningún lado, y mostrarla igual que una guardada
                  diría que el trabajo terminó.
                */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.tipo === "nueva" ? it.preview : it.url}
                  alt=""
                  className={`aspect-square w-20 shrink-0 bg-paper-deep object-cover transition-opacity duration-300 ${
                    it.tipo === "nueva" && it.estado === "subiendo" ? "opacity-40" : "opacity-100"
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="label text-ink-faint">
                      {i === 0 ? "Portada" : `Imagen ${i + 1}`}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => mover(i, -1)}
                        disabled={i === 0}
                        title="Subir"
                        className="flex h-7 w-7 rotate-90 items-center justify-center text-ink-faint transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                      >
                        <span className="sr-only">Subir esta imagen</span>
                        <ArrowLeft size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => mover(i, 1)}
                        disabled={i === items.length - 1}
                        title="Bajar"
                        className="flex h-7 w-7 rotate-90 items-center justify-center text-ink-faint transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                      >
                        <span className="sr-only">Bajar esta imagen</span>
                        <ArrowRight size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => quitar(it.key)}
                        title="Quitar"
                        className="flex h-7 w-7 items-center justify-center text-ink-faint transition-colors hover:text-accent"
                      >
                        <span className="sr-only">Quitar esta imagen</span>
                        <Trash size={15} />
                      </button>
                    </div>
                  </div>

                  <input
                    value={it.alt}
                    onChange={(e) => cambiarAlt(it.key, e.target.value)}
                    placeholder="Describí la imagen"
                    aria-label={`Texto alternativo de la imagen ${i + 1}`}
                    className={`${CONTROL} mt-1 py-1.5 text-sm`}
                  />

                  {/*
                    El pie de cada imagen dice dos cosas distintas según de
                    dónde venga: una guardada muestra sus medidas, que son un
                    hecho; una que está subiendo muestra por dónde va, que es
                    lo único que importa en ese momento.
                  */}
                  {it.tipo === "existente" ? (
                    <p className="mt-1.5 truncate text-xs text-ink-faint">
                      <span className="figures">
                        {it.width} × {it.height}
                      </span>
                      <span aria-hidden="true"> · </span>
                      guardada
                    </p>
                  ) : (
                    <div className="mt-1.5">
                      <p className="truncate text-xs text-ink-faint">
                        {it.file.name}
                        <span aria-hidden="true"> · </span>
                        <span className="figures">{enMB(it.file.size)}</span>
                        <span aria-hidden="true"> · </span>
                        {it.estado === "listo" ? (
                          <span className="figures text-ink-soft">
                            {it.width} × {it.height}
                          </span>
                        ) : it.estado === "error" ? (
                          <span className="text-accent">{it.mensaje}</span>
                        ) : (
                          <span className="figures">{it.progreso}%</span>
                        )}
                      </p>

                      {/*
                        La barra sólo existe mientras sube. Es un filete que
                        crece, del mismo grosor que los del sistema: no es un
                        componente nuevo, es el filete que ya separa las filas
                        haciendo de medida. Al terminar desaparece, porque una
                        barra llena al 100% no dice nada que las medidas de al
                        lado no digan mejor.
                      */}
                      {it.estado === "subiendo" && (
                        <div
                          role="progressbar"
                          aria-valuenow={it.progreso}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Subiendo ${it.file.name}`}
                          className="mt-1.5 h-px w-full bg-line"
                        >
                          <div
                            className="h-px bg-ink-soft transition-[width] duration-200 ease-out"
                            style={{ width: `${it.progreso}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <input
            ref={elegir}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
            multiple
            hidden
            onChange={(e) => {
              sumarArchivos(e.target.files);
              // Se vacía para que elegir dos veces el mismo archivo vuelva a
              // disparar el evento.
              e.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => elegir.current?.click()}
            className="mt-6 flex w-full items-center justify-center gap-2 border border-dashed border-line bg-paper-deep/40 py-5 text-ink-faint transition-colors hover:border-accent/50 hover:bg-paper-deep/70 hover:text-ink-soft"
          >
            <Plus size={18} />
            <span className="label">
              {items.length === 0 ? "Elegir imágenes" : "Sumar otra"}
            </span>
          </button>
        </div>

        {/* ------------------------------------------------------ enviar */}
        <div className="mt-10 flex items-center gap-6 border-t border-line pt-6">
          <button
            type="submit"
            disabled={enviando || bloqueado}
            className="bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {enviando
              ? "Guardando…"
              : subiendo
                ? "Subiendo imágenes…"
                : obra
                  ? "Guardar cambios"
                  : "Cargar la obra"}
          </button>

          <Link
            href="/admin"
            className="link-underline text-sm text-ink-soft transition-colors hover:text-ink"
          >
            Cancelar
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------ el lateral, col 9 */}
      <aside className="md:col-span-3 md:col-start-9">
        <h2 className="label">Dónde va a salir</h2>
        <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
          <li>En la grilla de la portada, con la primera imagen en cuadrado.</li>
          <li>
            En su propia página:{" "}
            <span className="break-all text-xs tracking-[0.01em] text-ink">
              /opera/{direccion || "…"}
            </span>
          </li>
        </ul>

        {obra && (
          <p className="mt-6 border-t border-line pt-4 text-xs text-ink-faint">
            Cargada como{" "}
            <span className="figures text-ink-soft">#{obra.id}</span> en el archivo.
          </p>
        )}
      </aside>
    </form>
  );
}
