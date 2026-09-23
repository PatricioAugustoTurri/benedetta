import Reveal from "@/components/Reveal";

/**
 * L'apertura di Contatti: il titolo e l'unico consiglio che non ha un campo
 * dove vivere.
 *
 * Quello che prima diceva questo paragrafo —cosa raccontare, per quando, in
 * che formato— adesso sta sotto il campo dove si scrive. Un'istruzione serve
 * dove si esegue, non tre schermate più in alto.
 */
export default function ContactIntro() {
  return (
    <>
      <Reveal>
        <h1 className="display-h1 text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
          Scrivimi e costruiamo qualcosa insieme.
        </h1>
      </Reveal>

      <Reveal delay={90}>
        <p className="prose-measure mt-8 text-lg leading-relaxed text-ink-soft">
          Se hai già dei riferimenti o un budget in mente, tanto meglio: così ti rispondo
          con qualcosa di concreto invece di un lungo scambio di mail.
        </p>
      </Reveal>
    </>
  );
}
