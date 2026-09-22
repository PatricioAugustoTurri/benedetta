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
 * La grilla del admin, ordenable.
 *
 * El orden de estas celdas es el orden del sitio, y hasta acá no lo decidía
 * nadie: salía del año de cada obra. Ahora se arrastra.
 *
 * **Por qué la pieza se agarra de una manija y no de cualquier parte.** La
 * celda entera ya es un link al editor —ése es el gesto que tenía, y sacarlo
 * para poner el arrastre sería cambiar una cosa por otra—. Con la manija
 * conviven: se toca la obra para editarla, se sostiene la manija para
 * moverla. La manija entra al grupo de controles que ya existía, así que no
 * agrega una capa nueva a la pantalla: agrega un botón a una capa que ya
 * estaba, y aparece y desaparece con los otros dos.
 *
 * **Por qué no hay un modo «ordenar».** Un modo obliga a entrar y salir, y lo
 * que se pidió es poder ordenar cuando sea y las veces que sean. Un botón que
 * hay que apagar después convierte «moví una obra» en tres gestos.
 *
 * **Por qué la grilla no se rehace mientras se arrastra.** Al agarrar una
 * pieza se anota dónde está cada celda, y de ahí en más nadie se mueve de
 * lugar en el documento: las demás se corren con `transform`, que no rehace
 * la página. Si en cambio se reordenara el arreglo en cada movimiento, cada
 * celda cambiaría de lugar real, las medidas anotadas dejarían de valer y la
 * pieza que se está por soltar bailaría entre dos lugares. Al soltar, y sólo
 * ahí, el arreglo se reordena de verdad.
 */

/*
  El foco tiene que volver a la manija en la misma fase en que React movió el
  nodo, antes de pintar: con `useEffect` el foco queda en el `body` hasta
  después del pintado, y una ráfaga de flechas pierde los pasos que caen en esa
  ventana. En el servidor no hay nada que enfocar, y `useLayoutEffect` avisa si
  se lo llama ahí, así que del lado del servidor se usa el otro.
*/
const useEfectoDeDisposicion = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Dónde está una celda, en coordenadas del documento y no de la ventana. */
type Caja = { left: number; top: number; width: number; height: number };

type Arrastre = {
  id: number;
  /** El lugar del que salió. */
  origen: number;
  /** El lugar donde caería si se soltara ahora. */
  destino: number;
  /** Las medidas de todas las celdas, tomadas al agarrar. */
  cajas: Caja[];
  /** El puntero, en coordenadas de la ventana. */
  x: number;
  y: number;
  /** Dónde agarró el puntero dentro de la pieza, para que no salte al tomarla. */
  offX: number;
  offY: number;
  ancho: number;
};

type Guardado = "quieto" | "guardando" | "listo" | "falló";

/** Mueve un elemento de un lugar a otro sin tocar el arreglo original. */
function reubicar<T>(lista: T[], de: number, a: number): T[] {
  const copia = lista.slice();
  const [pieza] = copia.splice(de, 1);
  copia.splice(a, 0, pieza);
  return copia;
}

/** Cuánto hay que correr la celda `i` para que se vea en el lugar `j`. */
function correr(cajas: Caja[], i: number, j: number): string | undefined {
  if (i === j) return undefined;
  return `translate(${cajas[j].left - cajas[i].left}px, ${cajas[j].top - cajas[i].top}px)`;
}

/**
 * A qué lugar corresponde la celda `i` mientras se arrastra.
 *
 * Es el corrimiento de a uno de toda la vida: si la pieza baja, las que
 * quedaron entremedio suben un casillero; si sube, bajan uno. Las de afuera
 * del tramo no se enteran.
 */
function lugarDurante(i: number, { origen, destino }: Arrastre): number {
  if (i === origen) return destino;
  if (origen < destino && i > origen && i <= destino) return i - 1;
  if (destino < origen && i >= destino && i < origen) return i + 1;
  return i;
}

export default function ArchivoOrdenable({ obras, hueco }: { obras: Work[]; hueco: ReactNode }) {
  /*
    El orden vive acá mientras se mueve, y en la base cuando se suelta. La
    firma es la lista de ids tal como llegó del servidor: cuando cambia —se
    guardó un orden nuevo, se cargó una obra, se borró otra— lo que vale es
    lo que dice el servidor y lo de acá se descarta. Cuando no cambia, como
    después de un guardado que falló, lo de acá se queda: es lo que ella hizo
    y todavía no perdió.
  */
  const firma = obras.map((o) => o.id).join(",");
  const [orden, setOrden] = useState(obras);
  const [ultimaFirma, setUltimaFirma] = useState(firma);

  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  /** La pieza levantada con el teclado: id y de dónde salió, para poder devolverla. */
  const [agarrada, setAgarrada] = useState<{ id: number; desde: number } | null>(null);
  const [guardado, setGuardado] = useState<Guardado>("quieto");
  const [falla, setFalla] = useState<{ texto: string; salida: Salida | null } | null>(null);
  const [aviso, setAviso] = useState("");


  const rejilla = useRef<HTMLUListElement>(null);
  const manijas = useRef(new Map<number, HTMLButtonElement>());
  /*
    Espejo del arrastre para el bucle de autodesplazamiento, que corre fuera
    de React y no ve el estado. Lo escribe un solo lugar, más abajo.
  */
  const enCurso = useRef<Arrastre | null>(null);
  const puntero = useRef({ x: 0, y: 0 });
  const cuadro = useRef<number | null>(null);
  /** Cuál guardado es el último. Dos arrastres seguidos no pueden pisarse. */
  const envio = useRef(0);
  /*
    Mover una pieza con el teclado cambia su nodo de lugar en la página, y un
    nodo que se mueve pierde el foco: el navegador dispara `blur` aunque nadie
    se haya ido a ningún lado. Sin distinguir ese blur del de verdad, cada
    flecha soltaría la pieza que se está moviendo.
  */
  const reacomodando = useRef(false);

  /*
    Llegó otra lista del servidor. Si había una pieza en el aire hay que
    bajarla acá mismo: `arrastre` y `agarrada` guardan **índices** dentro del
    arreglo viejo, y aplicarlos sobre el nuevo movería la obra que pasó a
    ocupar ese lugar. Se guardaría sin error, y quedaría una grilla que ella
    no armó.

    Que pase no es raro: `limpiarSueltas` revalida /admin, un borrado desde
    otra pestaña también, y la revalidación del guardado anterior también.
  */
  if (firma !== ultimaFirma) {
    setUltimaFirma(firma);
    setOrden(obras);
    if (arrastre || agarrada) {
      setArrastre(null);
      setAgarrada(null);
      setGuardado("falló");
      setFalla({
        texto: "El archivo cambió mientras movías una obra, así que el movimiento se descartó.",
        salida: null,
      });
    }
  }

  const ordenable = orden.length > 1;

  const aplicar = setArrastre;


  /* ------------------------------------------------------------- guardar */

  const guardar = useCallback(async (nuevo: Work[]) => {
    const mio = ++envio.current;
    setGuardado("guardando");

    const r = await reordenarArchivo(nuevo.map((o) => o.id));

    // Llegó tarde: ya salió otro orden detrás de éste y manda el último.
    if (mio !== envio.current) return;

    if (r.ok) {
      setFalla(null);
      setGuardado("listo");
    } else {
      setFalla({ texto: r.error, salida: r.salida });
      setGuardado("falló");
    }
  }, []);

  // «Orden guardado» se borra solo. Es una confirmación, no un estado: dejarla
  // puesta la convierte en un cartel que a los diez minutos ya no dice nada.
  useEffect(() => {
    if (guardado !== "listo") return;
    const t = setTimeout(() => setGuardado("quieto"), 2600);
    return () => clearTimeout(t);
  }, [guardado]);

  /* ------------------------------------------------------------- medidas */

  /** Las celdas de obra en el orden en que están en la página. El hueco de alta no cuenta. */
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
   * Cuántas columnas tiene la grilla ahora mismo.
   *
   * Se cuenta mirando cuántas celdas comparten el borde de arriba, en vez de
   * repetir acá los cortes de 640 y 1024 que ya están en las clases de la
   * lista. Dos lugares con el mismo número es un lugar donde se van a
   * despegar: si mañana la grilla pasa a cuatro columnas, esto se entera solo.
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

  /** En qué celda cae el puntero. Si cae en un hueco entre dos, la más cercana. */
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

  /* ---------------------------------------------------------- arrastrar */

  /*
    La página se desplaza sola cuando la pieza llega al borde de la ventana.
    Sin esto, un archivo más largo que la pantalla sólo se puede reordenar
    dentro de lo que se ve: llevar la última obra al primer lugar sería
    soltarla, desplazar, volver a agarrarla, y otra vez.
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
        // El dedo no se movió, pero el documento sí: debajo del puntero hay
        // otra celda, y el destino tiene que seguirla.
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
    El espejo lo escribe esto y nada más. Tenerlo también en `aplicar` parecía
    inofensivo y no lo era: cuando el arrastre se baja desde el render —porque
    llegó otra lista del servidor— ahí no se puede tocar un ref, y el bucle de
    autodesplazamiento seguiría leyendo un arrastre que ya no existe y lo
    resucitaría en el cuadro siguiente.

    Va en la fase de disposición y no en un efecto común: corre antes de
    pintar, y por lo tanto antes de que pueda entrar ningún cuadro.
  */
  useEfectoDeDisposicion(() => {
    enCurso.current = arrastre;
    if (!arrastre) pararRodado();
  }, [arrastre, pararRodado]);

  function tomar(e: PointerEvent<HTMLButtonElement>, obra: Work, i: number) {
    // Con el mouse, sólo el botón principal: el secundario abre el menú del
    // navegador y quedaría una pieza agarrada que nadie soltó.
    if (e.pointerType === "mouse" && e.button !== 0) return;

    const celda = celdas()[i];
    if (!celda) return;

    e.preventDefault();
    /*
      La captura es lo que hace que el arrastre siga andando cuando el puntero
      se va de la manija, que es en el primer píxel. Sin ella los eventos los
      recibiría lo que esté debajo del dedo y el arrastre se cortaría solo.
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
   * Baja la pieza sin escribir nada.
   *
   * La llaman `pointercancel` —el navegador se quedó con el gesto: pulsación
   * larga, rechazo de palma, un gesto del sistema— y también Escape, que
   * durante un arrastre por puntero no tenía salida mientras el teclado sí la
   * tenía. En los dos casos ella no soltó: guardar ahí sería escribir en la
   * base un orden que nadie confirmó.
   */
  const cancelarArrastre = useCallback(() => {
    pararRodado();
    if (!enCurso.current) return;
    aplicar(null);
  }, [aplicar, pararRodado]);

  /*
    Un cambio de tamaño rehace la grilla, y las medidas anotadas al agarrar
    pasan a describir una página que ya no existe: las piezas se correrían a
    coordenadas viejas y la obra caería en el casillero equivocado. Remedir a
    mitad de gesto haría saltar la pieza bajo el dedo, así que se cancela, que
    es lo honesto.
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

  /* ------------------------------------------------------------- teclado */

  /*
    Mismo trabajo sin puntero: la manija se levanta con la barra, las flechas
    la llevan, la barra la deja y Escape la devuelve. Las flechas de arriba y
    abajo saltan una fila entera, que es lo que esas teclas significan en una
    grilla; en una lista de una sola columna esa fila es una pieza, y el salto
    da lo mismo que el de los costados.
  */
  function teclado(e: KeyboardEvent<HTMLButtonElement>, obra: Work, i: number) {
    const n = orden.length;

    if (agarrada?.id !== obra.id) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setAgarrada({ id: obra.id, desde: i });
        setAviso(
          `«${obra.title}» levantada. Lugar ${i + 1} de ${n}. Las flechas la mueven, ` +
            "la barra la suelta, Escape la devuelve.",
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
      setAviso(`«${obra.title}» volvió al lugar ${agarrada.desde + 1}.`);
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
    setAviso(`«${obra.title}», lugar ${destino + 1} de ${n}.`);
  }

  /**
   * Deja la pieza donde está y guarda si se movió.
   *
   * Lo llaman la barra, el Enter y también el foco que se va: si ella
   * levantó una obra, la corrió tres lugares y se fue con el tabulador, lo
   * que hizo vale. Cancelar ahí le borraría el trabajo por haber mirado otra
   * cosa, y para deshacer ya está Escape, que es explícito.
   */
  function soltarConTeclado(obra: Work, i: number) {
    if (!agarrada) return;
    setAgarrada(null);

    if (i === agarrada.desde) {
      setAviso(`«${obra.title}» quedó donde estaba.`);
      return;
    }

    setAviso(`«${obra.title}» soltada en el lugar ${i + 1} de ${orden.length}.`);
    void guardar(orden);
  }

  /*
    Mover una obra mueve su nodo en la página, y un nodo que se mueve pierde
    el foco: sin esto, la segunda flecha ya no le llega a nadie y la pieza
    queda levantada a mitad de camino.
  */
  useEfectoDeDisposicion(() => {
    reacomodando.current = false;
    if (!agarrada) return;
    manijas.current.get(agarrada.id)?.focus();
  }, [agarrada, orden]);

  /* ---------------------------------------------------------- la pantalla */

  const enMovimiento = arrastre !== null;
  const piezaEnMano = arrastre ? orden.find((o) => o.id === arrastre.id) : undefined;

  /*
    Un solo renglón para la ayuda y para el estado del guardado, con alto
    reservado: si fueran dos, la pantalla llevaría permanentemente un renglón
    vacío esperando un aviso que casi nunca está.

    Mientras se arrastra se muestra siempre la ayuda, aunque justo termine un
    guardado anterior. No es cosmético: un renglón que cambia de alto mientras
    hay una pieza en el aire corre la grilla entera, y las medidas anotadas al
    agarrar dejarían de coincidir con lo que se ve.
  */
  const ayuda = enMovimiento || guardado === "quieto";
  const renglon: { texto: string; falla: boolean; salida: Salida | null } = ayuda
    ? { texto: "", falla: false, salida: null }
    : guardado === "guardando"
      ? { texto: "Guardando el orden…", falla: false, salida: null }
      : guardado === "listo"
        ? { texto: "Orden guardado.", falla: false, salida: null }
        : {
            texto: falla?.texto ?? "No se pudo guardar el orden.",
            falla: true,
            salida: falla === null ? "reintentar" : falla.salida,
          };

  return (
    <>
      {/*
        Dos renglones en el hueco de uno, con el alto reservado por el
        contenedor: la ayuda, que está siempre y por eso no se anuncia, y la
        región viva, que está montada siempre y vacía cuando no hay nada que
        decir.

        Separados a propósito. Con la ayuda adentro de la región viva, un
        lector de pantalla leía «Arrastrá una obra de su manija…» al empezar
        cada arrastre y otra vez dos segundos y medio después de cada
        guardado, cuando el renglón vuelve a su texto de reposo. La región
        viva tampoco se monta junto con su texto: montada recién cuando hay
        algo que decir, varios lectores no la anuncian.
      */}
      {ordenable && (
        <div className="mb-6 min-h-9 text-xs">
          {ayuda && (
            <p className="text-ink-faint">
              Arrastrá una obra de su manija para cambiar el orden.
            </p>
          )}
          <p
            aria-live="polite"
            className={`flex items-start gap-2 ${renglon.falla ? "text-ink" : "text-ink-faint"}`}
          >
            {/*
              El punto es el mismo de la barra del admin y dice lo mismo: en
              terracota, algo pide atención. No aparece cuando todo va bien,
              porque en este sistema «funciona» no lleva color.
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
                    La salida que se ofrece es la que corresponde a la falla, y
                    no siempre es la misma. Reintentar un orden que la base
                    rechazó por viejo vuelve a fallar igual: ahí lo que hay que
                    hacer es traer el archivo de nuevo. Y hay una falla sin
                    salida —el archivo cambió abajo del gesto— donde lo único
                    que corresponde es contarlo.
                  */}
                  <button
                    type="button"
                    onClick={() =>
                      renglon.salida === "recargar" ? window.location.reload() : void guardar(orden)
                    }
                    className="link-underline text-accent transition-opacity hover:opacity-70"
                  >
                    {renglon.salida === "recargar" ? "Recargar" : "Reintentar"}
                  </button>
                </>
              )}
            </span>
          </p>
        </div>
      )}

      {/*
        La grilla exacta del sitio. Si cambia allá, cambia acá: que las dos
        se vean distinto haría que esta pantalla deje de servir para lo único
        que justifica su forma, que es ver la obra en su lugar definitivo.

        Lo único que no hereda es la entrada: las celdas de la portada llevan
        `rivista-piece`, que las hace entrar desde su columna, y acá no. No es
        un olvido. Ahí el movimiento es parte de mirar el archivo; acá se
        viene a trabajar, y una grilla que se acomoda cada vez que se guarda
        una obra pone medio segundo de coreografía entre ella y lo siguiente
        que iba a hacer. Se entra a una tarea, no a una presentación.
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
                La transición se pone sólo mientras hay un arrastre. Puesta
                siempre, al soltar —cuando el arreglo se reordena de verdad y
                los `transform` se van— cada celda animaría su vuelta a cero
                desde el lugar prestado, y la grilla haría un segundo baile
                después del que ya se vio.

                Bajo `prefers-reduced-motion` la hoja de estilos global la
                deja en 0.01ms, como a todo lo demás.
              */
              className={`relative ${
                enMovimiento
                  ? "transition-transform duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                  : ""
              }`}
            >
              {/*
                La pieza en el aire deja su celda pero no su lugar: `invisible`
                la esconde sin sacarla del cálculo, así que la grilla mantiene
                exactamente el alto que tenía. Si se desmontara, la fila se
                encogería y las medidas anotadas al agarrar quedarían mintiendo.
              */}
              <div className={estaEnElAire ? "invisible" : undefined}>
                <ObraEditable
                  obra={obra}
                  manija={ordenable ? manija(obra, i) : undefined}
                />
              </div>

              {/*
                El lugar que la pieza va a ocupar al soltarse. Filete punteado
                y no lleno, por lo mismo que el hueco de alta: punteado dice
                que ahí no hay nada y que algo puede entrar. Es el único otro
                lugar del sistema donde el punteado aparece, y aparece
                significando lo mismo.
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
        La obra en la mano. Va sobre papel pleno —no translúcida— porque tiene
        que leerse como una pieza levantada de la grilla y no como un fantasma
        encima de ella; el sistema no tiene sombras para decir «está arriba»,
        y el papel opaco con el filete terracota lo dice sin inventar ninguna.

        Se mueve con `transform` y no con `left`/`top`: es la diferencia entre
        seguir al dedo y perseguirlo.
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
        Lo que pasa, dicho para quien no lo ve. Va aparte del renglón visible
        porque ése cuenta el guardado y esto cuenta el movimiento, y con un
        lector de pantalla hacen falta los dos.
      */}
      <p aria-live="polite" className="sr-only">
        {aviso}
      </p>
    </>
  );

  /** La manija de una pieza. Se arma acá porque necesita el índice y el estado del arrastre. */
  function manija(obra: Work, i: number) {
    const levantada = agarrada?.id === obra.id;

    return (
      <button
        type="button"
        ref={(el) => {
          if (el) manijas.current.set(obra.id, el);
          else manijas.current.delete(obra.id);
        }}
        title="Mover"
        /*
          El estado de levantada tiene que viajar como booleano y no sólo como
          un nombre distinto: cambiarle el texto a un control que ya tiene el
          foco no se reanuncia de forma confiable, así que con lector de
          pantalla no había manera de saber si la barra había prendido.

          Sin `aria-describedby`: con el `title` puesto serían dos
          descripciones sobre el mismo botón. Las instrucciones se dicen una
          vez, al levantar la pieza, que es cuando hacen falta.
        */
        aria-pressed={levantada}
        onPointerDown={(e) => tomar(e, obra, i)}
        onPointerMove={mover}
        onPointerUp={soltar}
        onPointerCancel={cancelarArrastre}
        onKeyDown={(e) => teclado(e, obra, i)}
        onBlur={() => {
          // El blur que provoca el reacomodo no es una salida: el foco vuelve
          // a esta misma manija en el efecto de abajo.
          if (reacomodando.current || !levantada) return;
          soltarConTeclado(obra, i);
        }}
        /*
          `touch-none` es lo que separa arrastrar de desplazar la página: sin
          eso, el navegador se queda con el gesto apenas el dedo se mueve un
          poco y la obra no llega a salir de su lugar. Va sólo en la manija,
          así que el resto de la grilla se sigue desplazando con el dedo como
          siempre.
        */
        className={`flex h-8 w-8 touch-none items-center justify-center bg-paper/95 transition-colors focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
          levantada ? "cursor-grabbing text-accent" : "cursor-grab text-ink-soft hover:text-ink"
        }`}
      >
        <span className="sr-only">
          {levantada
            ? `Soltar «${obra.title}» en el lugar ${i + 1} de ${orden.length}`
            : `Mover «${obra.title}». Lugar ${i + 1} de ${orden.length}`}
        </span>
        <Move size={16} />
      </button>
    );
  }
}
