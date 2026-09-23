"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Move } from "@/components/Icon";
import { reordenarArchivo, type Salida } from "../actions";
import ObraEditable from "./ObraEditable";
import PlacaObra from "./PlacaObra";
import type { Work } from "@/lib/works";

/**
 * La griglia dell'admin, riordinabile.
 *
 * L'ordine di queste celle è l'ordine del sito, e fino a qui non lo decideva
 * nessuno: usciva dall'anno di ogni opera. Adesso si trascina.
 *
 * **Perché il pezzo si afferra da una maniglia e non da un punto qualsiasi.**
 * La cella intera è già un link all'editor —quello è il gesto che aveva, e
 * toglierlo per metterci il trascinamento sarebbe cambiare una cosa con
 * un'altra—. Con la maniglia convivono: si tocca l'opera per modificarla, si
 * tiene premuta la maniglia per spostarla. La maniglia entra nel gruppo di
 * controlli che già esisteva, quindi non aggiunge uno strato nuovo alla
 * schermata: aggiunge un pulsante a uno strato che c'era già, e compare e
 * sparisce insieme agli altri due.
 *
 * **Perché non c'è una modalità «riordina».** Una modalità obbliga a entrare e
 * uscire, e quello che è stato chiesto è poter riordinare quando si vuole e
 * quante volte si vuole. Un pulsante da spegnere dopo trasforma «ho spostato
 * un'opera» in tre gesti.
 *
 * **Perché la griglia non si ricostruisce mentre si trascina.** Quando si
 * afferra un pezzo si annota dove sta ogni cella, e da lì in poi nessuno si
 * sposta di posto nel documento: le altre si spostano con `transform`, che non
 * ricostruisce la pagina. Se invece si riordinasse l'array a ogni movimento,
 * ogni cella cambierebbe posto davvero, le misure annotate smetterebbero di
 * valere e il pezzo che si sta per lasciare ballerebbe fra due posti. Al
 * rilascio, e solo lì, l'array si riordina davvero.
 */

/*
  Il fuoco deve tornare alla maniglia nella stessa fase in cui React ha spostato
  il nodo, prima del disegno: con `useEffect` il fuoco resta sul `body` fino a
  dopo il disegno, e una raffica di frecce perde i passi che cadono in quella
  finestra. Sul server non c'è niente da mettere a fuoco, e `useLayoutEffect`
  avvisa se lo si chiama lì, quindi dal lato server si usa l'altro.
*/
const useEfectoDeDisposicion = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Dove sta una cella, in coordinate del documento e non della finestra. */
type Caja = { left: number; top: number; width: number; height: number };

type Arrastre = {
  id: number;
  /** Il posto da cui è uscita. */
  origen: number;
  /** Il posto in cui cadrebbe se si lasciasse adesso. */
  destino: number;
  /** Le misure di tutte le celle, prese all'afferrare. */
  cajas: Caja[];
  /** Il puntatore, in coordinate della finestra. */
  x: number;
  y: number;
  /** Dove il puntatore ha afferrato dentro il pezzo, perché non salti quando lo si prende. */
  offX: number;
  offY: number;
  ancho: number;
};

type Guardado = "quieto" | "guardando" | "listo" | "falló";

/** Sposta un elemento da un posto a un altro senza toccare l'array originale. */
function reubicar<T>(lista: T[], de: number, a: number): T[] {
  const copia = lista.slice();
  const [pieza] = copia.splice(de, 1);
  copia.splice(a, 0, pieza);
  return copia;
}

/** Di quanto va spostata la cella `i` perché si veda al posto `j`. */
function correr(cajas: Caja[], i: number, j: number): string | undefined {
  if (i === j) return undefined;
  return `translate(${cajas[j].left - cajas[i].left}px, ${cajas[j].top - cajas[i].top}px)`;
}

/**
 * A quale posto corrisponde la cella `i` mentre si trascina.
 *
 * È lo scorrimento di uno alla volta di sempre: se il pezzo scende, quelli
 * rimasti in mezzo salgono di una casella; se sale, scendono di una. Quelli
 * fuori dal tratto non se ne accorgono.
 */
function lugarDurante(i: number, { origen, destino }: Arrastre): number {
  if (i === origen) return destino;
  if (origen < destino && i > origen && i <= destino) return i - 1;
  if (destino < origen && i >= destino && i < origen) return i + 1;
  return i;
}

export default function ArchivoOrdenable({ obras, hueco }: { obras: Work[]; hueco: ReactNode }) {
  /*
    L'ordine vive qui mentre si muove, e nel database quando si lascia. La firma
    è la lista di id così com'è arrivata dal server: quando cambia —si è
    salvato un ordine nuovo, si è caricata un'opera, se n'è cancellata un'altra—
    quello che vale è ciò che dice il server e quello di qui si scarta. Quando
    non cambia, come dopo un salvataggio fallito, quello di qui resta: è ciò
    che ha fatto lei e non ha ancora perso.
  */
  const firma = obras.map((o) => o.id).join(",");
  const [orden, setOrden] = useState(obras);
  const [ultimaFirma, setUltimaFirma] = useState(firma);

  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  /** Il pezzo sollevato con la tastiera: id e da dove è uscito, per poterlo rimettere. */
  const [agarrada, setAgarrada] = useState<{ id: number; desde: number } | null>(null);
  const [guardado, setGuardado] = useState<Guardado>("quieto");
  const [falla, setFalla] = useState<{ texto: string; salida: Salida | null } | null>(null);
  const [aviso, setAviso] = useState("");


  const rejilla = useRef<HTMLUListElement>(null);
  const manijas = useRef(new Map<number, HTMLButtonElement>());
  /*
    Specchio del trascinamento per il ciclo di scorrimento automatico, che gira
    fuori da React e non vede lo stato. Lo scrive un posto solo, più in basso.
  */
  const enCurso = useRef<Arrastre | null>(null);
  const puntero = useRef({ x: 0, y: 0 });
  const cuadro = useRef<number | null>(null);
  /** Quale salvataggio è l'ultimo. Due trascinamenti di fila non possono calpestarsi. */
  const envio = useRef(0);
  /*
    Spostare un pezzo con la tastiera cambia posto al suo nodo nella pagina, e
    un nodo che si sposta perde il fuoco: il browser lancia `blur` anche se
    nessuno se n'è andato da nessuna parte. Senza distinguere quel blur da
    quello vero, ogni freccia lascerebbe cadere il pezzo che si sta spostando.
  */
  const reacomodando = useRef(false);

  /*
    È arrivata un'altra lista dal server. Se c'era un pezzo in aria va fatto
    scendere proprio qui: `arrastre` e `agarrada` conservano **indici** dentro
    l'array vecchio, e applicarli su quello nuovo sposterebbe l'opera che è
    passata a occupare quel posto. Si salverebbe senza errore, e resterebbe una
    griglia che non ha costruito lei.

    Che succeda non è strano: `limpiarSueltas` rivalida /admin, una
    cancellazione da un'altra scheda pure, e anche la rivalidazione del
    salvataggio precedente.
  */
  if (firma !== ultimaFirma) {
    setUltimaFirma(firma);
    setOrden(obras);
    if (arrastre || agarrada) {
      setArrastre(null);
      setAgarrada(null);
      setGuardado("falló");
      setFalla({
        texto: "L’archivio è cambiato mentre spostavi un’opera, quindi lo spostamento è stato scartato.",
        salida: null,
      });
    }
  }

  const ordenable = orden.length > 1;

  const aplicar = setArrastre;


  /* ------------------------------------------------------------- salvare */

  const guardar = useCallback(async (nuevo: Work[]) => {
    const mio = ++envio.current;
    setGuardado("guardando");

    const r = await reordenarArchivo(nuevo.map((o) => o.id));

    // È arrivato tardi: è già partito un altro ordine dopo questo e comanda
    // l'ultimo.
    if (mio !== envio.current) return;

    if (r.ok) {
      setFalla(null);
      setGuardado("listo");
    } else {
      setFalla({ texto: r.error, salida: r.salida });
      setGuardado("falló");
    }
  }, []);

  // «Ordine salvato» si cancella da solo. È una conferma, non uno stato:
  // lasciarla lì la trasforma in un cartello che dopo dieci minuti non dice
  // più niente.
  useEffect(() => {
    if (guardado !== "listo") return;
    const t = setTimeout(() => setGuardado("quieto"), 2600);
    return () => clearTimeout(t);
  }, [guardado]);

  /* ------------------------------------------------------------- misure */

  /** Le celle d'opera nell'ordine in cui stanno nella pagina. La casella di inserimento non conta. */
  const celdas = useCallback(
    () => Array.from(rejilla.current?.querySelectorAll<HTMLLIElement>("li[data-obra]") ?? []),
    [],
  );

  const medir = useCallback((): Caja[] => {
    const { scrollX, scrollY } = window;
    return celdas().map((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height };
    });
  }, [celdas]);

  /**
   * Quante colonne ha la griglia in questo momento.
   *
   * Si conta guardando quante celle condividono il bordo superiore, invece di
   * ripetere qui i punti di rottura a 640 e 1024 che stanno già nelle classi
   * della lista. Due posti con lo stesso numero sono un posto dove finiranno
   * per divergere: se domani la griglia passa a quattro colonne, questo se ne
   * accorge da solo.
   */
  const columnas = useCallback((): number => {
    const todas = celdas();
    if (todas.length === 0) return 1;
    const arriba = todas[0].getBoundingClientRect().top;
    let n = 0;
    for (const el of todas) {
      if (Math.abs(el.getBoundingClientRect().top - arriba) > 2) break;
      n++;
    }
    return Math.max(1, n);
  }, [celdas]);

  /** In quale cella cade il puntatore. Se cade in un vuoto fra due, la più vicina. */
  const lugarBajoElPuntero = useCallback((px: number, py: number, cajas: Caja[]): number => {
    let cerca = 0;
    let menor = Infinity;
    for (let i = 0; i < cajas.length; i++) {
      const c = cajas[i];
      if (px >= c.left && px <= c.left + c.width && py >= c.top && py <= c.top + c.height) return i;
      const dx = px - (c.left + c.width / 2);
      const dy = py - (c.top + c.height / 2);
      const d = dx * dx + dy * dy;
      if (d < menor) {
        menor = d;
        cerca = i;
      }
    }
    return cerca;
  }, []);

  /* ---------------------------------------------------------- trascinare */

  /*
    La pagina scorre da sola quando il pezzo arriva al bordo della finestra.
    Senza questo, un archivio più lungo dello schermo si può riordinare solo
    dentro quello che si vede: portare l'ultima opera al primo posto
    significherebbe lasciarla, scorrere, riafferrarla, e da capo.
  */
  const pararRodado = useCallback(() => {
    if (cuadro.current !== null) cancelAnimationFrame(cuadro.current);
    cuadro.current = null;
  }, []);

  const arrancarRodado = useCallback(() => {
    if (cuadro.current !== null) return;

    const paso = () => {
      const a = enCurso.current;
      if (!a) {
        cuadro.current = null;
        return;
      }

      const { x, y } = puntero.current;
      const margen = 96;
      const dv =
        y < margen
          ? -Math.ceil((margen - y) / 6)
          : y > window.innerHeight - margen
            ? Math.ceil((y - (window.innerHeight - margen)) / 6)
            : 0;

      if (dv !== 0) {
        window.scrollBy(0, dv);
        // Il dito non si è mosso, ma il documento sì: sotto il puntatore c'è
        // un'altra cella, e la destinazione deve seguirla.
        aplicar({
          ...a,
          destino: lugarBajoElPuntero(x + window.scrollX, y + window.scrollY, a.cajas),
        });
      }

      cuadro.current = requestAnimationFrame(paso);
    };

    cuadro.current = requestAnimationFrame(paso);
  }, [aplicar, lugarBajoElPuntero]);

  useEffect(() => pararRodado, [pararRodado]);
  /*
    Lo specchio lo scrive questo e nient'altro. Averlo anche in `aplicar`
    sembrava innocuo e non lo era: quando il trascinamento viene annullato dal
    render —perché è arrivata un'altra lista dal server— lì non si può toccare
    un ref, e il ciclo di scorrimento automatico continuerebbe a leggere un
    trascinamento che non esiste più e lo resusciterebbe al fotogramma
    successivo.

    Va nella fase di layout e non in un effetto comune: gira prima del disegno,
    e quindi prima che possa entrare qualsiasi fotogramma.
  */
  useEfectoDeDisposicion(() => {
    enCurso.current = arrastre;
    if (!arrastre) pararRodado();
  }, [arrastre, pararRodado]);

  function tomar(e: PointerEvent<HTMLButtonElement>, obra: Work, i: number) {
    // Con il mouse, solo il pulsante principale: quello secondario apre il
    // menu del browser e resterebbe un pezzo afferrato che nessuno ha
    // lasciato.
    if (e.pointerType === "mouse" && e.button !== 0) return;

    const celda = celdas()[i];
    if (!celda) return;

    e.preventDefault();
    /*
      La cattura è ciò che fa proseguire il trascinamento quando il puntatore
      esce dalla maniglia, cosa che succede al primo pixel. Senza, gli eventi
      li riceverebbe quello che sta sotto il dito e il trascinamento si
      interromperebbe da solo.
    */
    e.currentTarget.setPointerCapture(e.pointerId);
    setAgarrada(null);

    const r = celda.getBoundingClientRect();
    puntero.current = { x: e.clientX, y: e.clientY };
    aplicar({
      id: obra.id,
      origen: i,
      destino: i,
      cajas: medir(),
      x: e.clientX,
      y: e.clientY,
      offX: e.clientX - r.left,
      offY: e.clientY - r.top,
      ancho: r.width,
    });
    arrancarRodado();
  }

  function mover(e: PointerEvent<HTMLButtonElement>) {
    const a = enCurso.current;
    if (!a) return;
    puntero.current = { x: e.clientX, y: e.clientY };
    aplicar({
      ...a,
      x: e.clientX,
      y: e.clientY,
      destino: lugarBajoElPuntero(
        e.clientX + window.scrollX,
        e.clientY + window.scrollY,
        a.cajas,
      ),
    });
  }

  /**
   * Fa scendere il pezzo senza scrivere niente.
   *
   * La chiamano `pointercancel` —il browser si è preso il gesto: pressione
   * lunga, rifiuto del palmo, un gesto di sistema— e anche Escape, che durante
   * un trascinamento con il puntatore non aveva una via d'uscita mentre la
   * tastiera ce l'aveva. In entrambi i casi lei non ha lasciato: salvare lì
   * sarebbe scrivere nel database un ordine che nessuno ha confermato.
   */
  const cancelarArrastre = useCallback(() => {
    pararRodado();
    if (!enCurso.current) return;
    aplicar(null);
  }, [aplicar, pararRodado]);

  /*
    Un cambio di dimensioni ricostruisce la griglia, e le misure annotate
    all'afferrare passano a descrivere una pagina che non esiste più: i pezzi
    si sposterebbero a coordinate vecchie e l'opera cadrebbe nella casella
    sbagliata. Rimisurare a metà gesto farebbe saltare il pezzo sotto il dito,
    quindi si annulla, che è la cosa onesta.
  */
  useEffect(() => {
    if (!arrastre) return;
    const salir = () => cancelarArrastre();
    const tecla = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") cancelarArrastre();
    };
    window.addEventListener("resize", salir);
    window.addEventListener("keydown", tecla);
    return () => {
      window.removeEventListener("resize", salir);
      window.removeEventListener("keydown", tecla);
    };
  }, [arrastre, cancelarArrastre]);

  function soltar(e: PointerEvent<HTMLButtonElement>) {
    const a = enCurso.current;
    pararRodado();
    if (!a) return;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    aplicar(null);

    if (a.destino === a.origen) return;
    const nuevo = reubicar(orden, a.origen, a.destino);
    setOrden(nuevo);
    void guardar(nuevo);
  }

  /* ------------------------------------------------------------- tastiera */

  /*
    Stesso lavoro senza puntatore: la maniglia si solleva con la barra
    spaziatrice, le frecce la portano, la barra la lascia ed Escape la rimette.
    Le frecce su e giù saltano una riga intera, che è quello che quei tasti
    significano in una griglia; in una lista a colonna singola quella riga è un
    pezzo, e il salto equivale a quello laterale.
  */
  function teclado(e: KeyboardEvent<HTMLButtonElement>, obra: Work, i: number) {
    const n = orden.length;

    if (agarrada?.id !== obra.id) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setAgarrada({ id: obra.id, desde: i });
        setAviso(
          `«${obra.title}» sollevata. Posto ${i + 1} di ${n}. Le frecce la spostano, ` +
            "la barra spaziatrice la lascia, Escape la rimette a posto.",
        );
      }
      return;
    }

    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      soltarConTeclado(obra, i);
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      reacomodando.current = true;
      setOrden((o) => reubicar(o, i, agarrada.desde));
      setAgarrada(null);
      setAviso(`«${obra.title}» è tornata al posto ${agarrada.desde + 1}.`);
      return;
    }

    const cols = columnas();
    const salto: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -cols,
      ArrowDown: cols,
    };
    if (!(e.key in salto)) return;

    e.preventDefault();
    const destino = Math.min(n - 1, Math.max(0, i + salto[e.key]));
    if (destino === i) return;

    reacomodando.current = true;
    setOrden((o) => reubicar(o, i, destino));
    setAviso(`«${obra.title}», posto ${destino + 1} di ${n}.`);
  }

  /**
   * Lascia il pezzo dov'è e salva se si è spostato.
   *
   * La chiamano la barra spaziatrice, l'Invio e anche il fuoco che se ne va:
   * se lei ha sollevato un'opera, l'ha spostata di tre posti e se n'è andata
   * con il tab, quello che ha fatto vale. Annullare lì le cancellerebbe il
   * lavoro per aver guardato un'altra cosa, e per disfare c'è già Escape, che
   * è esplicito.
   */
  function soltarConTeclado(obra: Work, i: number) {
    if (!agarrada) return;
    setAgarrada(null);

    if (i === agarrada.desde) {
      setAviso(`«${obra.title}» è rimasta dov'era.`);
      return;
    }

    setAviso(`«${obra.title}» lasciata al posto ${i + 1} di ${orden.length}.`);
    void guardar(orden);
  }

  /*
    Spostare un'opera sposta il suo nodo nella pagina, e un nodo che si sposta
    perde il fuoco: senza questo, la seconda freccia non arriva più a nessuno e
    il pezzo resta sollevato a metà strada.
  */
  useEfectoDeDisposicion(() => {
    reacomodando.current = false;
    if (!agarrada) return;
    manijas.current.get(agarrada.id)?.focus();
  }, [agarrada, orden]);

  /* --------------------------------------------------------- la schermata */

  const enMovimiento = arrastre !== null;
  const piezaEnMano = arrastre ? orden.find((o) => o.id === arrastre.id) : undefined;

  /*
    Una sola riga per l'aiuto e per lo stato del salvataggio, con altezza
    riservata: se fossero due, la schermata porterebbe in permanenza una riga
    vuota in attesa di un avviso che quasi mai c'è.

    Mentre si trascina si mostra sempre l'aiuto, anche se proprio in quel
    momento finisce un salvataggio precedente. Non è cosmetico: una riga che
    cambia altezza mentre c'è un pezzo in aria sposta la griglia intera, e le
    misure annotate all'afferrare smetterebbero di coincidere con quello che si
    vede.
  */
  const ayuda = enMovimiento || guardado === "quieto";
  const renglon: { texto: string; falla: boolean; salida: Salida | null } = ayuda
    ? { texto: "", falla: false, salida: null }
    : guardado === "guardando"
      ? { texto: "Salvataggio dell’ordine…", falla: false, salida: null }
      : guardado === "listo"
        ? { texto: "Ordine salvato.", falla: false, salida: null }
        : {
            texto: falla?.texto ?? "Non è stato possibile salvare l’ordine.",
            falla: true,
            salida: falla === null ? "reintentar" : falla.salida,
          };

  return (
    <>
      {/*
        Due righe nello spazio di una, con l'altezza riservata dal contenitore:
        l'aiuto, che c'è sempre e per questo non si annuncia, e la regione
        viva, che è montata sempre e vuota quando non c'è niente da dire.

        Separate di proposito. Con l'aiuto dentro la regione viva, un lettore
        di schermo leggeva «Trascina un'opera dalla sua maniglia…» all'inizio
        di ogni trascinamento e di nuovo due secondi e mezzo dopo ogni
        salvataggio, quando la riga torna al suo testo di riposo. Neanche la
        regione viva si monta insieme al suo testo: montata solo quando c'è
        qualcosa da dire, parecchi lettori non la annunciano.
      */}
      {ordenable && (
        <div className="mb-6 min-h-9 text-xs">
          {ayuda && (
            <p className="text-ink-faint">
              Trascina un&apos;opera dalla sua maniglia per cambiare l&apos;ordine.
            </p>
          )}
          <p
            aria-live="polite"
            className={`flex items-start gap-2 ${renglon.falla ? "text-ink" : "text-ink-faint"}`}
          >
            {/*
              Il punto è lo stesso della barra dell'admin e dice la stessa
              cosa: in terracotta, qualcosa chiede attenzione. Non compare
              quando va tutto bene, perché in questo sistema «funziona» non
              porta colore.
            */}
            {renglon.falla && (
              <span
                aria-hidden="true"
                className="mt-[0.4rem] block h-1 w-1 rounded-full bg-accent"
              />
            )}
            <span>
              {renglon.texto}
              {renglon.salida && (
                <>
                  {" "}
                  {/*
                    La via d'uscita che si offre è quella che corrisponde al
                    guasto, e non è sempre la stessa. Riprovare un ordine che
                    il database ha rifiutato perché vecchio fallisce di nuovo
                    uguale: lì quello da fare è riportare l'archivio da capo. E
                    c'è un guasto senza via d'uscita —l'archivio è cambiato
                    sotto al gesto— dove l'unica cosa che si può fare è dirlo.
                  */}
                  <button
                    type="button"
                    onClick={() =>
                      renglon.salida === "recargar" ? window.location.reload() : void guardar(orden)
                    }
                    className="link-underline text-accent transition-opacity hover:opacity-70"
                  >
                    {renglon.salida === "recargar" ? "Ricarica" : "Riprova"}
                  </button>
                </>
              )}
            </span>
          </p>
        </div>
      )}

      {/*
        La griglia esatta del sito. Se cambia là, cambia qui: che le due si
        vedano diverse farebbe smettere questa schermata di servire all'unica
        cosa che giustifica la sua forma, cioè vedere l'opera al suo posto
        definitivo.

        L'unica cosa che non eredita è l'entrata: le celle della home portano
        `rivista-piece`, che le fa entrare dalla loro colonna, e qui no. Non è
        una dimenticanza. Là il movimento fa parte del guardare l'archivio; qui
        si viene a lavorare, e una griglia che si sistema ogni volta che si
        salva un'opera mette mezzo secondo di coreografia fra lei e la cosa
        successiva che stava per fare. Si entra in un compito, non in una
        presentazione.
      */}
      <ul ref={rejilla} className="grid gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <li>{hueco}</li>

        {orden.map((obra, i) => {
          const estaEnElAire = arrastre?.id === obra.id;
          const transform = arrastre ? correr(arrastre.cajas, i, lugarDurante(i, arrastre)) : undefined;

          return (
            <li
              key={obra.id}
              data-obra={obra.id}
              style={transform ? { transform } : undefined}
              /*
                La transizione si mette solo mentre c'è un trascinamento. Messa
                sempre, al rilascio —quando l'array si riordina davvero e i
                `transform` se ne vanno— ogni cella animerebbe il suo ritorno a
                zero dal posto prestato, e la griglia farebbe un secondo ballo
                dopo quello che si è già visto.

                Sotto `prefers-reduced-motion` il foglio di stile globale la
                lascia a 0.01ms, come tutto il resto.
              */
              className={`relative ${
                enMovimiento
                  ? "transition-transform duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                  : ""
              }`}
            >
              {/*
                Il pezzo in aria lascia la sua cella ma non il suo posto:
                `invisible` lo nasconde senza toglierlo dal calcolo, così la
                griglia mantiene esattamente l'altezza che aveva. Se venisse
                smontato, la riga si restringerebbe e le misure annotate
                all'afferrare resterebbero a mentire.
              */}
              <div className={estaEnElAire ? "invisible" : undefined}>
                <ObraEditable
                  obra={obra}
                  manija={ordenable ? manija(obra, i) : undefined}
                />
              </div>

              {/*
                Il posto che il pezzo occuperà al rilascio. Filetto
                tratteggiato e non pieno, per lo stesso motivo della casella di
                inserimento: il tratteggio dice che lì non c'è niente e che
                qualcosa ci può entrare. È l'unico altro posto del sistema in
                cui il tratteggio compare, e compare significando la stessa
                cosa.
              */}
              {estaEnElAire && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 block aspect-[4/5] border border-dashed border-line bg-paper-deep/40"
                />
              )}
            </li>
          );
        })}
      </ul>

      {/*
        L'opera in mano. Va su carta piena —non traslucida— perché deve leggersi
        come un pezzo sollevato dalla griglia e non come un fantasma sopra di
        essa; il sistema non ha ombre per dire «sta sopra», e la carta opaca con
        il filetto terracotta lo dice senza inventarne nessuna.

        Si muove con `transform` e non con `left`/`top`: è la differenza fra
        seguire il dito e inseguirlo.
      */}
      {arrastre && piezaEnMano && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-50 bg-paper"
          style={{
            width: arrastre.ancho,
            transform: `translate3d(${arrastre.x - arrastre.offX}px, ${arrastre.y - arrastre.offY}px, 0)`,
          }}
        >
          <PlacaObra obra={piezaEnMano} enMano />
        </div>
      )}

      {/*
        Quello che succede, detto per chi non lo vede. Va separato dalla riga
        visibile perché quella racconta il salvataggio e questa racconta il
        movimento, e con un lettore di schermo servono entrambe.
      */}
      <p aria-live="polite" className="sr-only">
        {aviso}
      </p>
    </>
  );

  /** La maniglia di un pezzo. Si costruisce qui perché serve l'indice e lo stato del trascinamento. */
  function manija(obra: Work, i: number) {
    const levantada = agarrada?.id === obra.id;

    return (
      <button
        type="button"
        ref={(el) => {
          if (el) manijas.current.set(obra.id, el);
          else manijas.current.delete(obra.id);
        }}
        title="Sposta"
        /*
          Lo stato di "sollevata" deve viaggiare come booleano e non solo come
          un nome diverso: cambiare il testo a un controllo che ha già il fuoco
          non viene riannunciato in modo affidabile, quindi con un lettore di
          schermo non c'era modo di sapere se la barra spaziatrice avesse
          funzionato.

          Senza `aria-describedby`: con il `title` presente sarebbero due
          descrizioni sullo stesso pulsante. Le istruzioni si dicono una volta,
          al sollevare il pezzo, che è quando servono.
        */
        aria-pressed={levantada}
        onPointerDown={(e) => tomar(e, obra, i)}
        onPointerMove={mover}
        onPointerUp={soltar}
        onPointerCancel={cancelarArrastre}
        onKeyDown={(e) => teclado(e, obra, i)}
        onBlur={() => {
          // Il blur provocato dalla risistemazione non è un'uscita: il fuoco
          // torna a questa stessa maniglia nell'effetto qui sotto.
          if (reacomodando.current || !levantada) return;
          soltarConTeclado(obra, i);
        }}
        /*
          `touch-none` è ciò che separa il trascinare dallo scorrere la pagina:
          senza, il browser si prende il gesto appena il dito si muove un poco
          e l'opera non arriva a uscire dal suo posto. Va solo sulla maniglia,
          così il resto della griglia continua a scorrere con il dito come
          sempre.
        */
        className={`flex h-8 w-8 touch-none items-center justify-center bg-paper/95 transition-colors focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
          levantada ? "cursor-grabbing text-accent" : "cursor-grab text-ink-soft hover:text-ink"
        }`}
      >
        <span className="sr-only">
          {levantada
            ? `Lascia «${obra.title}» al posto ${i + 1} di ${orden.length}`
            : `Sposta «${obra.title}». Posto ${i + 1} di ${orden.length}`}
        </span>
        <Move size={16} />
      </button>
    );
  }
}
