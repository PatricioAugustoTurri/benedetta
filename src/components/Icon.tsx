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
 * El signo de los desplegables: Shop en la barra y Shop en el cajón usan
 * éste y sólo éste, girado 180° cuando están abiertos. Va más chico que el
 * resto (16 como la flecha diagonal) porque acompaña a una palabra de 15px,
 * no a una fila; el trazo sigue siendo el mismo 1.25 del cuadro de 24.
 */
export function ChevronDown({ className, size = 16 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m7 10 5 5 5-5" />
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
