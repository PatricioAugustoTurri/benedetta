type Props = {
  /** De 0 a 5; admite decimales (4.6 pinta cuatro estrellas y media larga). */
  value: number;
  className?: string;
  /** Texto para lectores de pantalla. Por defecto: "4,6 de 5 estrellas". */
  label?: string;
};

const STAR =
  "M10 1.6l2.47 5.18 5.68.7-4.18 3.93 1.06 5.63L10 14.3l-5.03 2.74 1.06-5.63L1.85 7.48l5.68-.7L10 1.6z";

export function StarIcon({ filled = 1 }: { filled?: number }) {
  const pct = Math.max(0, Math.min(1, filled)) * 100;
  return (
    <span className="relative inline-block h-[1em] w-[1em]" aria-hidden="true">
      <svg viewBox="0 0 20 20" className="absolute inset-0 h-full w-full text-line">
        <path d={STAR} fill="currentColor" />
      </svg>
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
        <svg viewBox="0 0 20 20" className="h-[1em] w-[1em] text-accent">
          <path d={STAR} fill="currentColor" />
        </svg>
      </span>
    </span>
  );
}

/** Estrellas de sólo lectura. */
export default function Stars({ value, className = "", label }: Props) {
  const text = label ?? `${value.toLocaleString("es-AR", { maximumFractionDigits: 1 })} de 5 estrellas`;
  return (
    <span role="img" aria-label={text} className={`inline-flex gap-[0.15em] ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <StarIcon key={i} filled={value - i} />
      ))}
    </span>
  );
}

export function formatAverage(n: number): string {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
