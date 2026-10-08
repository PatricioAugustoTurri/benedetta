import Link from "next/link";
import { ArrowRight } from "@/components/Icon";
import { scontiInCorsoConStampe } from "@/lib/sconti";

const giorno = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));

/**
 * La cinta degli sconti: una striscia in cima a ogni pagina, sopra il menu,
 * che scorre da sola mentre c'è uno sconto in corso e sparisce quando
 * finisce. È la vetrina con il cartello «saldi»: si vede da qualsiasi pagina
 * si arrivi, anche da un'opera aperta da Instagram.
 *
 * Il fondo è il terracotta della palette sciolto nella carta (14%): un rosa
 * appena, che si distingue dalla pagina senza gridarle sopra —prima era
 * inchiostro pieno, ed era troppo— e lascia il colore vero alle
 * illustrazioni. Il testo è in inchiostro; l'unica cosa colorata è la
 * percentuale, in un terracotta più profondo perché resti leggibile (AA) su
 * quel rosa. Il punto terracotta separa le voci, come nella barra dell'admin.
 *
 * Tutta la striscia è un solo link, verso la sezione degli sconti nello
 * Shop. Il testo che scorre è nascosto ai lettori di schermo, che sentono una
 * frase sola e ferma; chi passa con il puntatore o arriva con il tab la
 * ferma; e con il movimento ridotto non scorre affatto (vedi `.cinta` in
 * globals.css).
 *
 * Senza sconti in corso non disegna niente.
 */
export default async function CintaSconti() {
  const sconti = await scontiInCorsoConStampe().catch(() => []);
  if (sconti.length === 0) return null;

  const etichetta = sconti
    .map((s) => `${s.titolo}: −${s.percentuale}% fino al ${giorno(s.al)}`)
    .join(". ");

  // Una voce per sconto, ripetuta finché la striscia è più larga dello
  // schermo più largo; poi tutta la serie due volte, per il giro senza scatti.
  const voci = Array.from(
    { length: Math.max(3, Math.ceil(6 / sconti.length)) },
    () => sconti,
  ).flat();
  const serie = (copia: number) => (
    <ul className="flex shrink-0 items-center" aria-hidden="true" key={copia}>
      {voci.map((s, i) => (
        <li
          key={`${copia}-${i}`}
          className="flex items-center gap-3 pr-10 whitespace-nowrap md:gap-4 md:pr-14"
        >
          <span className="block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          {/* Il maiuscoletto di `.label`, ma in inchiostro: `.label` porta con sé il suo grigio. */}
          <span className="text-[0.6875rem] tracking-[0.18em] text-ink uppercase">
            {s.titolo}
          </span>
          <span className="display-h1 text-[0.9375rem] leading-none text-[color-mix(in_srgb,var(--color-accent)_80%,var(--color-ink))]">
            −{s.percentuale}%
          </span>
          <span className="text-[0.6875rem] tracking-[0.18em] text-ink-soft uppercase">
            fino al {giorno(s.al)}
          </span>
          <span className="flex items-center gap-1.5 text-[0.8125rem] text-ink">
            Scopri le stampe
            <ArrowRight size={14} className="shrink-0" />
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    // Una regione sua, con un nome: sta fuori dal menu e dal contenuto, e chi
    // naviga per punti di riferimento la trova come «Sconti in corso».
    <aside aria-label="Sconti in corso">
      <Link
        href="/shop#sconti"
        aria-label={`${etichetta}. Scopri le stampe in sconto.`}
        className="cinta group relative block overflow-hidden border-b border-accent/15 bg-[color-mix(in_srgb,var(--color-accent)_14%,var(--color-paper))] py-2.5 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ink"
      >
        <div className="cinta__traccia flex w-max">
          {serie(0)}
          {serie(1)}
        </div>
      </Link>
    </aside>
  );
}
