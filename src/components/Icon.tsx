/**
 * Íconos dibujados, un solo grosor de trazo (1.25) y un solo tamaño base.
 * No usamos glifos unicode como íconos: no comparten métrica ni peso
 * con la tipografía y cambian de forma según el sistema operativo.
 */
type Props = {
  className?: string;
  /** Lado del cuadro en px. El trazo se mantiene óptico. */
  size?: number;
};

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
});

export function ArrowLeft({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

export function ArrowRight({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

/** Flecha diagonal para links que salen del sitio. */
export function ArrowUpRight({ className, size = 16 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

export function Mail({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m3.5 6.5 8.5 6 8.5-6" />
    </svg>
  );
}

export function Instagram({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Close({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/**
 * Copiar: dos hojas corridas. Se dibuja porque la acción no es "mandar un
 * mail" y usar el sobre para las dos cosas haría que el sobre no signifique
 * ninguna.
 */
export function Copy({ className, size = 18 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="9" y="9" width="11" height="11" rx="1" />
      <path d="M15 6.5V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h1.5" />
    </svg>
  );
}

/**
 * Volver arriba. Lleva asta, como la flecha diagonal de los links externos y
 * a diferencia de las de paginado, que son cabezas sueltas: ésta no dice
 * "siguiente", dice "hasta el principio", y esa distancia es el asta.
 */
export function ArrowUp({ className, size = 16 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 19V5m-7 7 7-7 7 7" />
    </svg>
  );
}

/*
  Los tres del admin. Entran acá y no en una carpeta aparte porque un segundo
  juego de íconos con otro trazo es exactamente lo que este archivo existe
  para evitar: la pantalla de carga tiene que verse hecha por la misma mano
  que el sitio.
*/

/**
 * Sumar. Dos trazos del mismo largo, sin caja alrededor: la caja ya la pone
 * el hueco punteado de la grilla, y repetirla adentro sería dibujar dos veces
 * la misma idea.
 */
export function Plus({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/**
 * Editar: el lápiz, que es la herramienta de ella. Va inclinado a 45° como
 * las flechas diagonales del sistema, y con la punta marcada aparte para que
 * a 16px todavía se lea como lápiz y no como una barra torcida.
 */
export function Pencil({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M14.5 5.5 18.5 9.5 9 19H5v-4z" />
      <path d="m13 7 4 4" />
    </svg>
  );
}

/**
 * Borrar. La papelera y no una cruz: una cruz en este sistema cierra —es el
 * botón del cajón del menú— y el mismo signo para cerrar y para destruir es
 * el que hace que alguien borre una obra creyendo que cerraba algo.
 */
export function Trash({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.5A1 1 0 0 1 10.5 4.5h3a1 1 0 0 1 1 1V7" />
      <path d="M6.5 7l.8 11a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
    </svg>
  );
}

/**
 * Mover: la manija por la que se arrastra una obra a otro lugar de la grilla.
 *
 * Cuatro flechas desde un centro, y no las tres rayas de una manija de lista,
 * por dos razones. La primera es que esas tres rayas ya son el botón del menú
 * en el teléfono, y el mismo dibujo para abrir la navegación y para agarrar
 * una pieza es el que hace que alguien toque uno creyendo que tocaba el otro.
 * La segunda es que la grilla es una grilla: una pieza se mueve en dos ejes,
 * no arriba y abajo en una lista, y el ícono lo tiene que decir antes de que
 * la mano lo pruebe.
 *
 * Las puntas van en trazos aparte de la cruz para que a 16px, que es donde
 * vive, sigan leyéndose como flechas y no como un engrosamiento del extremo.
 *
 * La cruz no llega al borde del cuadro: recortada a 13 unidades de las 24, el
 * dibujo ocupa lo mismo que el lápiz y la papelera de al lado. Estirada hasta
 * el borde pesaba más que sus dos vecinos y el grupo dejaba de leerse como
 * tres controles del mismo rango.
 */
export function Move({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 5.5v13M5.5 12h13" />
      <path d="m10 7.5 2-2 2 2" />
      <path d="m10 16.5 2 2 2-2" />
      <path d="M7.5 10l-2 2 2 2" />
      <path d="m16.5 10 2 2-2 2" />
    </svg>
  );
}
