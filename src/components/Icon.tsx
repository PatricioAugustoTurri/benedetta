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

export function Cart({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 5h2.2l1.9 9.5a1.5 1.5 0 0 0 1.5 1.2h7.7a1.5 1.5 0 0 0 1.5-1.2L19.5 8H6.3" />
      <circle cx="9.5" cy="19" r="1.3" />
      <circle cx="16.5" cy="19" r="1.3" />
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
