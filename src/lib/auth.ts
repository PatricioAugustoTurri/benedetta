import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "illustrando_admin";

/*
  La clave vive en .env.local y nunca en el repositorio. Si no está, el admin
  no se abre solo: `isAuthenticated` devuelve false y la pantalla de acceso
  explica que falta configurarla. Un panel que se abre sin clave porque la
  variable no estaba es peor que uno que no se abre.
*/
function secret(): string | null {
  const value = process.env.ADMIN_PASSWORD;
  return value && value.length > 0 ? value : null;
}

/*
  El valor que lleva la cookie: la firma de una frase fija con la clave. No
  guarda la clave —quien lea la cookie no puede deducirla— y no se puede
  fabricar sin conocerla. Si la clave cambia, todas las sesiones abiertas
  dejan de valer, que es justamente lo que se espera al cambiar una clave.
*/
function sessionToken(password: string): string {
  return createHmac("sha256", password).update("illustrando/admin/v1").digest("hex");
}

/**
 * Comparación de tiempo constante.
 *
 * `a === b` corta en la primera letra distinta, y esa diferencia de
 * microsegundos es medible: alcanza para adivinar una clave letra por letra.
 * `timingSafeEqual` tarda lo mismo acierte o no, pero exige que los dos
 * lados midan igual, así que se comparan las firmas y no los textos: miden
 * 64 caracteres siempre, sin importar cuánto se haya escrito.
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

/** Abre la sesión. Se llama sólo después de que `checkPassword` dio verdadero. */
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
 * La verdad sobre si hay sesión. La comprueba cada Server Action antes de
 * tocar la base: `proxy.ts` sólo tapa la puerta de la página, y una acción de
 * servidor se puede invocar con un POST directo sin pasar por ella.
 */
export async function isAuthenticated(): Promise<boolean> {
  const password = secret();
  if (!password) return false;

  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  return sameSecret(token, sessionToken(password));
}

/** Para usar arriba de cada acción: corta con un error si no hay sesión. */
export async function requireSession(): Promise<void> {
  if (!(await isAuthenticated())) {
    throw new Error("Sesión no válida. Volvé a entrar.");
  }
}
