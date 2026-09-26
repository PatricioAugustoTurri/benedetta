"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Trash } from "@/components/Icon";
import { descartarImagen, guardarObra, pedirPermisoDeSubida, type EstadoFormulario } from "../actions";
import { enMB, MAX_ARCHIVO_MB, MAX_VIDEO_MB, MB } from "@/lib/limites";
import { fotogramma } from "@/lib/video";
import type { Work } from "@/lib/works";

/*
  Il vocabolario di campo del sito, lo stesso che usa il modulo di Contatti:
  etichetta in maiuscoletto, controllo su un solo filetto, senza riquadro né
  riempimento né raggio. Si ripete qui invece di essere importato perché quel
  file le dichiara per uso proprio; il giorno in cui ci sarà un terzo modulo,
  queste due costanti si trasferiscono in un modulo condiviso e non prima.
*/
const LABEL = "label block text-ink-faint transition-colors";
const CONTROL =
  "peer block w-full border-0 border-b border-line bg-transparent py-2.5 text-base text-ink transition-colors placeholder:text-ink-faint focus:border-ink aria-[invalid=true]:border-accent";

/**
 * Un'immagine —o un video— nel modulo.
 *
 * Le nuove portano uno stato perché salgono su Cloudinary appena si scelgono,
 * non al salvataggio: mentre viaggia una scansione da 8 MB bisogna poter dire
 * a che punto è, e alla fine l'immagine ha già indirizzo e misure proprie.
 *
 * `video` è a parte da `tipo` perché `tipo` dice da dove viene il pezzo —già
 * salvato o appena scelto— e un video può essere l'una o l'altra cosa.
 */
type Nueva = {
  key: string;
  tipo: "nueva";
  video: boolean;
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
      video: boolean;
    }
  | Nueva;

/** Il tetto di peso di un file, secondo che sia video o immagine. */
function tetto(video: boolean): number {
  return (video ? MAX_VIDEO_MB : MAX_ARCHIVO_MB) * MB;
}

/**
 * Manda un file a Cloudinary dal browser, segnalando l'avanzamento.
 *
 * `XMLHttpRequest` e non `fetch`: fetch non espone il progresso del
 * caricamento, e senza progresso una scansione grande lascia la schermata
 * ferma per un minuto senza dire se sta succedendo qualcosa o se si è
 * bloccata.
 *
 * Il file non tocca il server di questo progetto. L'unica cosa arrivata da lui
 * è la firma, che autorizza questo caricamento in questa cartella e scade da
 * sola.
 */
function subirACloudinary(
  file: File,
  permiso: { url: string; apiKey: string; timestamp: number; signature: string; folder: string },
  // Dove va il file lo decide chi chiama: immagini e video hanno ognuno il
  // proprio indirizzo su Cloudinary, con la stessa firma.
  destino: string,
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
    peticion.open("POST", destino);

    peticion.upload.onprogress = (e) => {
      if (e.lengthComputable) alAvanzar(Math.round((e.loaded / e.total) * 100));
    };

    peticion.onload = () => {
      let cuerpo: Record<string, unknown>;
      try {
        cuerpo = JSON.parse(peticion.responseText);
      } catch {
        rechazar(new Error("Cloudinary ha risposto qualcosa che non si capisce."));
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

      // Cloudinary spiega bene i propri rifiuti —formato, dimensione, firma
      // scaduta—, quindi si mostra il suo messaggio invece di uno generico.
      const error = (cuerpo.error as { message?: string } | undefined)?.message;
      rechazar(new Error(error ?? `Cloudinary ha rifiutato il caricamento (${peticion.status}).`));
    };

    peticion.onerror = () => rechazar(new Error("La connessione si è interrotta durante il caricamento."));
    peticion.send(datos);
  });
}

/**
 * Da un titolo a un indirizzo.
 *
 * È una proposta, non un'imposizione: il campo resta modificabile e smette di
 * seguire il titolo appena qualcuno lo tocca a mano. Un'opera già salvata non
 * lo ricalcola mai —il suo indirizzo può essere stato condiviso— quindi questo
 * gira solo mentre si carica un'opera nuova.
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
  // Un'opera salvata non segue il titolo; una nuova sì, finché non la toccano.
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
        video: img.tipo === "video",
      })) ?? [],
  );

  const elegir = useRef<HTMLInputElement>(null);

  /*
    Quello che impedisce di salvare, e il perché di ogni cosa.

    `subiendo`: l'immagine sta ancora viaggiando verso Cloudinary e non ha
    ancora un indirizzo, quindi non c'è niente da salvare nel database.
    `falladas`: il caricamento è andato male; salvare lascerebbe l'opera senza
    quell'immagine e senza avviso.
    `pesadas`: Cloudinary le rifiuterà comunque, ma dirlo qui risparmia il
    viaggio e spiega cosa fare. Il tetto è diverso per immagini e video.
  */
  const subiendo = items.some((it) => it.tipo === "nueva" && it.estado === "subiendo");
  const falladas = items.filter((it) => it.tipo === "nueva" && it.estado === "error");
  const pesadas = items.filter((it) => it.tipo === "nueva" && it.file.size > tetto(it.video));
  const bloqueado = subiendo || falladas.length > 0 || pesadas.length > 0;

  /*
    Le miniature dei file nuovi sono URL di oggetto, che il browser tiene in
    memoria finché non li si rilascia. Senza questo, caricare sei opere di
    seguito in una sessione lascia trattenute sei serie di immagini intere.
  */
  useEffect(() => {
    return () => {
      for (const it of items) if (it.tipo === "nueva") URL.revokeObjectURL(it.preview);
    };
    // Gira solo allo smontaggio: dentro si legge la lista viva tramite la
    // closure, e rilegarlo a ogni cambiamento revocherebbe miniature ancora in
    // uso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
    Quello che viaggia verso il server: appena un JSON con l'ordine, il testo
    alternativo e, per ogni immagine, il suo indirizzo su Cloudinary e le sue
    misure.

    I file non passano più di qui —sono saliti direttamente dal browser—
    quindi questo invio pesa qualche centinaio di byte anche se l'opera ha tre
    scansioni da 8 MB. È questo che fa smettere di essere un problema il limite
    del corpo di una Server Action.

    Quelle che stanno ancora salendo o che sono fallite non entrano: il
    pulsante è bloccato finché questo succede, e questa è la seconda rete nel
    caso si sblocchi.
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
            ...(it.video ? { tipo: "video" } : {}),
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
      La copia si fa qui e non dentro l'updater di stato, e non è cosmetica:
      `lista` è il FileList vivo dell'input, e il gestore svuota quell'input
      appena finisce per poter riscegliere lo stesso file. React chiama
      l'updater dopo, quindi se la lettura vivesse là dentro troverebbe la
      lista già vuota e non si caricherebbe nessuna immagine.
    */
    const nuevos: Nueva[] = Array.from(lista).map((file, i) => ({
      key: `nueva-${Date.now()}-${i}`,
      tipo: "nueva" as const,
      video: file.type.startsWith("video/"),
      file,
      alt: "",
      preview: URL.createObjectURL(file),
      estado: "subiendo" as const,
      progreso: 0,
    }));

    setItems((previos) => [...previos, ...nuevos]);

    // Un permesso per gruppo: la firma autorizza la cartella e il momento,
    // non un file preciso, quindi vale per tutte quelle di questo gruppo.
    const respuesta = await pedirPermisoDeSubida();
    if (!respuesta.ok) {
      for (const it of nuevos) actualizar(it.key, { estado: "error", mensaje: respuesta.error });
      return;
    }

    /*
      Una alla volta e non tutte insieme. Tre scansioni in parallelo si dividono
      la banda di caricamento e le tre barre avanzano a un terzo della
      velocità: la prima immagine ci mette quanto l'ultima. In fila, la prima
      finisce presto e le si può cominciare a scrivere il testo alternativo
      mentre le altre proseguono.
    */
    for (const it of nuevos) {
      /*
        Solo MP4 fra i video. Il selettore di file lo chiede già, ma un file
        trascinato o scelto con «Tutti i file» passa lo stesso, e un .mov
        salirebbe su Cloudinary per poi non riprodursi in metà dei browser.
      */
      if (it.video && it.file.type !== "video/mp4") {
        actualizar(it.key, { estado: "error", mensaje: "I video devono essere MP4." });
        continue;
      }

      if (it.file.size > tetto(it.video)) {
        actualizar(it.key, {
          estado: "error",
          mensaje: `Pesa ${enMB(it.file.size)} e il massimo sono ${it.video ? MAX_VIDEO_MB : MAX_ARCHIVO_MB} MB.`,
        });
        continue;
      }

      try {
        const destino = it.video ? respuesta.permiso.urlVideo : respuesta.permiso.url;
        const subida = await subirACloudinary(it.file, respuesta.permiso, destino, (p) =>
          actualizar(it.key, { progreso: p }),
        );
        actualizar(it.key, { estado: "listo", progreso: 100, ...subida });
      } catch (e) {
        actualizar(it.key, {
          estado: "error",
          mensaje: e instanceof Error ? e.message : "Non è stato possibile caricarla.",
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
          Se era già salita, si toglie anche da Cloudinary. Senza questo, ogni
          immagine che lei sceglie e scarta resta a occupare l'account per
          sempre, senza che nessuna opera la nomini.

          Solo le nuove: un'immagine già salvata può essere ancora nell'opera
          pubblicata, e si cancella solo al salvataggio delle modifiche.
        */
        if (fuera.publicId) void descartarImagen(fuera.publicId, fuera.video ? "video" : "image");
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

      {/* --------------------------------------------- la scheda, 7 colonne */}
      <div className="md:col-span-7">
        <h1 className="display-lead font-display text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15]">
          {obra ? obra.title : "Nuova opera"}
        </h1>

        {/*
          L'avviso sulle immagini va prima dell'errore del server perché si
          vede senza aver inviato niente: corregge il problema invece di
          segnalarlo dopo che l'invio è fallito.
        */}
        {(falladas.length > 0 || pesadas.length > 0) && (
          <p
            role="alert"
            className="mt-5 border-l border-accent bg-paper-deep/60 py-2 pl-3 text-sm text-accent"
          >
            {pesadas.length > 0
              ? `${pesadas.length === 1 ? "Un file supera" : `${pesadas.length} file superano`} il peso massimo: ${MAX_ARCHIVO_MB} MB per le immagini, ${MAX_VIDEO_MB} MB per i video. Esportali più leggeri e riscegli.`
              : `${falladas.length === 1 ? "Un file non è stato caricato" : `${falladas.length} file non sono stati caricati`}. Toglili e riprova, oppure controlla il dettaglio sotto ognuno.`}
          </p>
        )}

        {estado.error && (
          /*
            L'errore va in cima a tutto e non sotto il pulsante: se comparisse
            in fondo a un modulo lungo, chi l'ha inviato da metà pagina non lo
            vedrebbe mai. `role="alert"` fa sì che si annunci da solo.
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
              Titolo
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
              Indirizzo
            </label>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
              Quello che va dopo /opera/. Minuscole, numeri e trattini. Se l&apos;opera è già
              stata condivisa, non cambiarlo: il link vecchio smetterebbe di funzionare.
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
                Anno
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
                Tecnica
              </label>
              <input
                id={`${idBase}-tecnica`}
                name="tecnica"
                defaultValue={obra?.tecnica ?? ""}
                required
                autoComplete="off"
                placeholder="Acquerello e inchiostro"
                className={`${CONTROL} mt-2`}
              />
            </div>
          </div>

          <div className="group/campo">
            <label
              htmlFor={`${idBase}-description`}
              className={`${LABEL} group-has-[:focus]/campo:text-ink`}
            >
              Testo
            </label>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
              Il contesto della commissione, per la pagina dell&apos;opera. Può restare vuoto.
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

        {/* --------------------------------------------------- immagini */}
        <div className="mt-12 border-t border-line pt-8">
          <h2 className="label text-ink">Immagini e video</h2>
          <p className="mt-1.5 max-w-[46ch] text-xs leading-relaxed text-ink-faint">
            Il primo pezzo è la copertina: quello che esce nella griglia dell&apos;archivio.
            Ognuno sale su Cloudinary appena lo scegli, e da lì escono larghezza e altezza:
            non serve inserirle. I video vanno in MP4, fino a {MAX_VIDEO_MB} MB, e sul sito
            girano in loop senza audio.
          </p>

          <ul className="mt-6 space-y-4">
            {items.map((it, i) => (
              <li key={it.key} className="flex gap-4 border-b border-line pb-4">
                {/*
                  La miniatura è quadrata come la griglia, perché si veda qui
                  lo stesso ritaglio che si vedrà pubblicato.
                  <img> e non next/image: mentre sale è un oggetto in memoria
                  del browser, e una volta caricata la serve Cloudinary, che fa
                  già il proprio ridimensionamento.

                  Mentre viaggia va in inchiostro spento: l'immagine non è
                  ancora da nessuna parte, e mostrarla uguale a una salvata
                  direbbe che il lavoro è finito.
                */}
                {/*
                  Un video nuovo si mostra con il suo stesso file, fermo sul
                  primo fotogramma: il browser non ne sa fare una miniatura
                  come fa con un'immagine. Uno già salvato usa il fotogramma
                  che genera Cloudinary.
                */}
                {it.video && it.tipo === "nueva" ? (
                  <video
                    src={it.preview}
                    muted
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                    className={`aspect-square w-20 shrink-0 bg-paper-deep object-cover transition-opacity duration-300 ${
                      it.estado === "subiendo" ? "opacity-40" : "opacity-100"
                    }`}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      it.tipo === "nueva" ? it.preview : it.video ? fotogramma(it.url) : it.url
                    }
                    alt=""
                    className={`aspect-square w-20 shrink-0 bg-paper-deep object-cover transition-opacity duration-300 ${
                      it.tipo === "nueva" && it.estado === "subiendo" ? "opacity-40" : "opacity-100"
                    }`}
                  />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="label text-ink-faint">
                      {i === 0 ? "Copertina" : `${it.video ? "Video" : "Immagine"} ${i + 1}`}
                      {i === 0 && it.video && " · video"}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => mover(i, -1)}
                        disabled={i === 0}
                        title="Sposta su"
                        className="flex h-7 w-7 rotate-90 items-center justify-center text-ink-faint transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                      >
                        <span className="sr-only">Sposta su questo pezzo</span>
                        <ArrowLeft size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => mover(i, 1)}
                        disabled={i === items.length - 1}
                        title="Sposta giù"
                        className="flex h-7 w-7 rotate-90 items-center justify-center text-ink-faint transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                      >
                        <span className="sr-only">Sposta giù questo pezzo</span>
                        <ArrowRight size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => quitar(it.key)}
                        title="Togli"
                        className="flex h-7 w-7 items-center justify-center text-ink-faint transition-colors hover:text-accent"
                      >
                        <span className="sr-only">Togli questo pezzo</span>
                        <Trash size={15} />
                      </button>
                    </div>
                  </div>

                  <input
                    value={it.alt}
                    onChange={(e) => cambiarAlt(it.key, e.target.value)}
                    placeholder={it.video ? "Descrivi il video" : "Descrivi l’immagine"}
                    aria-label={`Testo alternativo ${it.video ? "del video" : "dell’immagine"} ${i + 1}`}
                    className={`${CONTROL} mt-1 py-1.5 text-sm`}
                  />

                  {/*
                    La didascalia di ogni immagine dice due cose diverse a
                    seconda della provenienza: una salvata mostra le sue
                    misure, che sono un fatto; una che sta salendo mostra a che
                    punto è, che è l'unica cosa che conta in quel momento.
                  */}
                  {it.tipo === "existente" ? (
                    <p className="mt-1.5 truncate text-xs text-ink-faint">
                      <span className="figures">
                        {it.width} × {it.height}
                      </span>
                      <span aria-hidden="true"> · </span>
                      {it.video ? "video salvato" : "salvata"}
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
                        La barra esiste solo mentre sale. È un filetto che
                        cresce, dello stesso spessore di quelli del sistema:
                        non è un componente nuovo, è il filetto che già separa
                        le righe che fa da misura. Alla fine sparisce, perché
                        una barra piena al 100% non dice niente che le misure
                        accanto non dicano meglio.
                      */}
                      {it.estado === "subiendo" && (
                        <div
                          role="progressbar"
                          aria-valuenow={it.progreso}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Caricamento di ${it.file.name}`}
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
            accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml,video/mp4"
            multiple
            hidden
            onChange={(e) => {
              sumarArchivos(e.target.files);
              // Si svuota perché scegliere due volte lo stesso file torni a
              // far scattare l'evento.
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
              {items.length === 0 ? "Scegli immagini o video" : "Aggiungi un altro pezzo"}
            </span>
          </button>
        </div>

        {/* ------------------------------------------------------ invio */}
        <div className="mt-10 flex items-center gap-6 border-t border-line pt-6">
          <button
            type="submit"
            disabled={enviando || bloqueado}
            className="bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {enviando
              ? "Salvataggio…"
              : subiendo
                ? "Caricamento in corso…"
                : obra
                  ? "Salva le modifiche"
                  : "Carica l'opera"}
          </button>

          <Link
            href="/admin"
            className="link-underline text-sm text-ink-soft transition-colors hover:text-ink"
          >
            Annulla
          </Link>
        </div>
      </div>

      {/* ------------------------------------------ la colonna laterale, col 9 */}
      <aside className="md:col-span-3 md:col-start-9">
        <h2 className="label">Dove uscirà</h2>
        <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
          <li>Nella griglia della home, con il primo pezzo in verticale 4:5.</li>
          <li>
            Nella sua pagina:{" "}
            <span className="break-all text-xs tracking-[0.01em] text-ink">
              /opera/{direccion || "…"}
            </span>
          </li>
        </ul>

        {obra && (
          <p className="mt-6 border-t border-line pt-4 text-xs text-ink-faint">
            Caricata come{" "}
            <span className="figures text-ink-soft">#{obra.id}</span> nell&apos;archivio.
          </p>
        )}
      </aside>
    </form>
  );
}
