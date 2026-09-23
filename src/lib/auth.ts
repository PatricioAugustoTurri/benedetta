import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "illustrando_admin";

/*
  La password vive in .env.local e mai nel repository. Se non c'è, l'admin non
  si apre da solo: `isAuthenticated` restituisce false e la schermata di
  accesso spiega che va configurata. Un pannello che si apre senza password
  perché la variabile non c'era è peggio di uno che non si apre.
*/
function secret(): string | null {
  const value = process.env.ADMIN_PASSWORD;
  return value && value.length > 0 ? value : null;
}

/*
  Il valore che porta il cookie: la firma di una frase fissa con la password.
  Non conserva la password —chi legge il cookie non può dedurla— e non si può
  fabbricare senza conoscerla. Se la password cambia, tutte le sessioni aperte
  smettono di valere, che è esattamente quello che ci si aspetta cambiando una
  password.
*/
function sessionToken(password: string): string {
  return createHmac("sha256", password).update("illustrando/admin/v1").digest("hex");
}

/**
 * Confronto a tempo costante.
 *
 * `a === b` si ferma alla prima lettera diversa, e quella differenza di
 * microsecondi è misurabile: basta per indovinare una password lettera per
 * lettera. `timingSafeEqual` impiega lo stesso tempo che indovini o no, ma
 * pretende che i due lati misurino uguale, quindi si confrontano le firme e
 * non i testi: misurano sempre 64 caratteri, indipendentemente da quanto si è
 * scritto.
 */
function sameSecret(a: string, b: string): boolean {
  const ha = createHmac("sha256", "compare").update(a).digest();
  const hb = createHmac("sha256", "compare").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function passwordIsConfigured(): boolean {
  return secret() !== null;
}

export function checkPassword(attempt: string): boolean {
  const password = secret();
  if (!password) return false;
  return sameSecret(attempt, password);
}

/** Apre la sessione. Si chiama solo dopo che `checkPassword` ha dato vero. */
export async function openSession(): Promise<void> {
  const password = secret();
  if (!password) return;

  const store = await cookies();
  store.set(SESSION_COOKIE, sessionToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function closeSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * La verità sull'esistenza di una sessione. La controlla ogni Server Action
 * prima di toccare il database: `proxy.ts` copre solo la porta della pagina, e
 * un'azione server si può invocare con un POST diretto senza passare da lì.
 */
export async function isAuthenticated(): Promise<boolean> {
  const password = secret();
  if (!password) return false;

  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  return sameSecret(token, sessionToken(password));
}

/** Da usare in cima a ogni azione: si ferma con un errore se non c'è sessione. */
export async function requireSession(): Promise<void> {
  if (!(await isAuthenticated())) {
    throw new Error("Sessione non valida. Accedi di nuovo.");
  }
}
