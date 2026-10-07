"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Plus, Trash } from "@/components/Icon";
import { descartarImagen, pedirPermisoDeSubida } from "../actions";
import { enMB, MAX_ARCHIVO_MB, MAX_VIDEO_MB, MB } from "@/lib/limites";
import { fotogramma } from "@/lib/video";
import type { WorkImage } from "@/lib/works";
import { CONTROL } from "./campo";

/** Quello che il modulo che lo contiene ha bisogno di sapere per bloccare il salvataggio. */
export type StatoImmagini = {
  /** Qualche pezzo sta ancora salendo e non ha un indirizzo. */
  subiendo: boolean;
  /** Quanti pezzi sono falliti. */
  falladas: number;
  /** Quanti pezzi superano il peso massimo. */
  pesadas: number;
};

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
 * Il campo delle immagini di un modulo dell'admin: scegliere, caricare su
 * Cloudinary dal browser, ordinare, scrivere l'alt, togliere.
 *
 * Vive a parte da WorkForm perché lo usano due moduli —le opere e i prodotti
 * dello Shop— e due copie di un caricamento con barra di avanzamento,
 * pulizia degli orfani e controllo del peso finirebbero per divergere. Quello
 * che manda al server è il campo nascosto `imagenes`, un JSON che le due
 * azioni leggono con la stessa `armarImagenes`.
 *
 * Il modulo che lo contiene riceve lo stato con `onStato` per bloccare il
 * pulsante e mostrare l'avviso in cima, dove si vede.
 *
 * Con `singola` tiene un pezzo solo, e solo immagini: è il mockup di una
 * stampa. Scegliere un altro file sostituisce quello che c'era invece di
 * metterlo in fila, e le frecce per ordinare spariscono perché non c'è un
 * ordine. Manda il suo JSON in un campo a parte (`campo`), così nel modulo
 * convive con la galleria.
 */
export default function CampoImmagini({
  iniziali = [],
  nota,
  onStato,
  campo = "imagenes",
  titolo = "Immagini e video",
  singola,
}: {
  iniziali?: WorkImage[];
  /** La riga sotto il titolo: cosa vuol dire la prima, dove esce. */
  nota: ReactNode;
  onStato: (stato: StatoImmagini) => void;
  /** Il nome del campo nascosto che l'azione legge con `armarImagenes`. */
  campo?: string;
  titolo?: string;
  /** Un pezzo solo: come si chiama nella riga e cosa dice il pulsante finché manca. */
  singola?: { etichetta: string; scegli: string };
}) {
  const [items, setItems] = useState<Item[]>(
    () =>
      iniziali.map((img, i) => ({
        key: `guardada-${i}`,
        tipo: "existente" as const,
        url: img.url,
        alt: img.alt,
        width: img.width,
        height: img.height,
        publicId: img.publicId,
        video: img.tipo === "video",
      })),
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

    // Un pezzo solo: quello nuovo prende il posto del vecchio, che si toglie
    // come se lo avesse tolto lei (e se era appena salito, anche da Cloudinary).
    if (singola) for (const it of items) quitar(it.key);

    /*
      La copia si fa qui e non dentro l'updater di stato, e non è cosmetica:
      `lista` è il FileList vivo dell'input, e il gestore svuota quell'input
      appena finisce per poter riscegliere lo stesso file. React chiama
      l'updater dopo, quindi se la lettura vivesse là dentro troverebbe la
      lista già vuota e non si caricherebbe nessuna immagine.
    */
    const nuevos: Nueva[] = Array.from(lista)
      .slice(0, singola ? 1 : undefined)
      .map((file, i) => ({
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

  useEffect(() => {
    onStato({ subiendo, falladas: falladas.length, pesadas: pesadas.length });
  }, [subiendo, falladas.length, pesadas.length, onStato]);

  return (
    <>
      <input type="hidden" name={campo} value={manifiesto} />
        <div className="mt-12 border-t border-line pt-8">
          <h2 className="label text-ink">{titolo}</h2>
          <p className="mt-1.5 max-w-[46ch] text-xs leading-relaxed text-ink-faint">{nota}</p>

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
                      {singola
                        ? singola.etichetta
                        : i === 0
                          ? "Copertina"
                          : `${it.video ? "Video" : "Immagine"} ${i + 1}`}
                      {!singola && i === 0 && it.video && " · video"}
                    </span>

                    <div className="flex items-center gap-1">
                      {!singola && (
                        <>
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
                        </>
                      )}
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
            accept={`image/jpeg,image/png,image/webp,image/avif${singola ? "" : ",image/svg+xml,video/mp4"}`}
            multiple={!singola}
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
              {singola
                ? items.length === 0
                  ? singola.scegli
                  : "Sostituisci"
                : items.length === 0
                  ? "Scegli immagini o video"
                  : "Aggiungi un altro pezzo"}
            </span>
          </button>
        </div>
    </>
  );
}
