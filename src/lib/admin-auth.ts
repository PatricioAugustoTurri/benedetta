import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Acceso al panel con una sola contraseña (variable ADMIN_PASSWORD).
 * La cookie guarda una firma derivada de la contraseña: si la cambiás,
 * todas las sesiones abiertas se cierran solas.
 */

const COOKIE = "benedetta_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

function password(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  return p && p.length >= 8 ? p : null;
}

function sessionValue(pass: string): string {
  return createHmac("sha256", pass).update("benedetta-admin-v1").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  // Comparar hashes de igual largo para no filtrar información por tiempo.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function adminConfigured(): boolean {
  return password() !== null;
}

export async function isAdmin(): Promise<boolean> {
  const pass = password();
  if (!pass) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  return !!value && safeEqual(value, sessionValue(pass));
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("No autorizado");
}

/** Devuelve true si la contraseña es correcta y deja la sesión abierta. */
export async function logIn(attempt: string): Promise<boolean> {
  const pass = password();
  if (!pass || !safeEqual(attempt, pass)) {
    // Frena un poco los intentos a ciegas.
    await new Promise((r) => setTimeout(r, 800));
    return false;
  }
  (await cookies()).set(COOKIE, sessionValue(pass), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: MAX_AGE,
  });
  return true;
}

export async function logOut(): Promise<void> {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}
