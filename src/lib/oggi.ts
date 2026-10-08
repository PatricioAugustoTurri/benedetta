/**
 * Oggi a Foligno, «2026-12-10». Le date del negozio —l'avviso, gli sconti—
 * si leggono con l'ora italiana e non con quella del server, che può stare
 * in un altro fuso: uno sconto che finisce il 24 dicembre finisce a
 * mezzanotte in Italia.
 */
export function oggiInItalia(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(new Date());
}
