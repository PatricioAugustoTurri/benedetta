/*
  Le stelle delle recensioni. In inchiostro e non in terracotta: la
  terracotta è riservata al filetto e al segno (DESIGN.md), e cinque
  stelle accese per ogni prodotto la consumerebbero. Le vuote sono del
  colore dei filetti, così una media di 4,5 si legge senza numeri.
*/

const PUNTA =
  "M10 1.6l2.47 5.18 5.68.7-4.18 3.93 1.06 5.63L10 14.3l-5.03 2.74 1.06-5.63L1.85 7.48l5.68-.7L10 1.6z";

/** Una stella piena per `pieno` (da 0 a 1): 0,5 è mezza. Misura 1em. */
export function Stella({ pieno = 1 }: { pieno?: number }) {
  const pct = Math.max(0, Math.min(1, pieno)) * 100;
  return (
    <span className="relative inline-block h-[1em] w-[1em] shrink-0" aria-hidden="true">
      <svg viewBox="0 0 20 20" className="absolute inset-0 h-full w-full text-line">
        <path d={PUNTA} fill="currentColor" />
      </svg>
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pct}%` }}>
        <svg viewBox="0 0 20 20" className="h-[1em] w-[1em] text-ink">
          <path d={PUNTA} fill="currentColor" />
        </svg>
      </span>
    </span>
  );
}

/** «4,5» */
export const media = (n: number) =>
  n.toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Cinque stelle in sola lettura, con il voto detto a chi non le vede. */
export default function Stelle({ voto, className = "" }: { voto: number; className?: string }) {
  return (
    <span role="img" aria-label={`${media(voto)} su 5`} className={`inline-flex gap-[0.12em] ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Stella key={i} pieno={voto - i} />
      ))}
    </span>
  );
}
