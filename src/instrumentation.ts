/**
 * Quello che il server fa una volta, quando parte, prima di rispondere.
 * Oggi solo questo: mettere nel database le tabelle nuove che servono al
 * codice nuovo (vedi src/lib/migrazioni.ts).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { applicaMigrazioni } = await import("@/lib/migrazioni");
  await applicaMigrazioni();
}
