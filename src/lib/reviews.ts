import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { connection } from "next/server";
import { illustrations } from "@/data/illustrations";
import type { Invite, PublicReview, Review } from "@/lib/review-types";
import { getStore, StoreNotConfiguredError } from "@/lib/store";

/**
 * Reseñas de compradores, sin cuentas.
 *
 * Cada venta genera una invitación con un código único. El link
 * /resena/<código> permite dejar UNA reseña de la obra comprada;
 * después de usarlo queda inválido.
 */

const KEYS = {
  invites: "benedetta:invites", // código → Invite
  used: "benedetta:invites-used", // código → id de la reseña
  reviews: "benedetta:reviews", // id → Review
} as const;

export const LIMITS = { name: 60, comment: 1200, buyer: 60, note: 120 } as const;

export type { Invite, PublicReview, Review };

export type RatingSummary = { average: number; count: number };

// ----------------------------------------------------------------- utilidades

// Sin letras ni números que se confundan (0/O, 1/l/I) para que se pueda tipear
// desde una tarjeta impresa. 10 caracteres de 31 posibles ≈ 2^49 combinaciones.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function newCode(): string {
  const bytes = randomBytes(10);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

/** Normaliza lo que la persona tipeó: minúsculas, sin espacios ni guiones. */
export function normalizeCode(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Para mostrar: "abcde-fghjk". */
export function formatCode(code: string): string {
  return code.length === 10 ? `${code.slice(0, 5)}-${code.slice(5)}` : code;
}

function parse<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function clean(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function illustrationBySlug(slug: string) {
  return illustrations.find((i) => i.slug === slug);
}

// -------------------------------------------------------------- invitaciones

export async function createInvite(input: { slug: string; buyer?: string; note?: string }) {
  if (!illustrationBySlug(input.slug)) throw new Error("Obra inexistente");
  const invite: Invite = {
    code: newCode(),
    slug: input.slug,
    buyer: clean(input.buyer, LIMITS.buyer) || undefined,
    note: clean(input.note, LIMITS.note) || undefined,
    createdAt: new Date().toISOString(),
  };
  await getStore().hset(KEYS.invites, invite.code, JSON.stringify(invite));
  return invite;
}

export type InviteStatus =
  | { state: "valid"; invite: Invite }
  | { state: "used"; invite: Invite }
  | { state: "invalid" };

export async function getInviteStatus(rawCode: string): Promise<InviteStatus> {
  const code = normalizeCode(rawCode);
  if (!code) return { state: "invalid" };
  const store = getStore();
  const [invite, usedBy] = await Promise.all([
    store.hget(KEYS.invites, code).then((r) => parse<Invite>(r)),
    store.hget(KEYS.used, code),
  ]);
  if (!invite || !illustrationBySlug(invite.slug)) return { state: "invalid" };
  return usedBy ? { state: "used", invite } : { state: "valid", invite };
}

export async function deleteInvite(code: string) {
  await getStore().hdel(KEYS.invites, normalizeCode(code));
}

export type InviteRow = Invite & { usedBy: string | null };

export async function listInvites(): Promise<InviteRow[]> {
  const store = getStore();
  const [invites, used] = await Promise.all([store.hgetall(KEYS.invites), store.hgetall(KEYS.used)]);
  return Object.values(invites)
    .map((r) => parse<Invite>(r))
    .filter((i): i is Invite => i !== null)
    .map((i) => ({ ...i, usedBy: used[i.code] ?? null }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ------------------------------------------------------------------- reseñas

export type SubmitResult =
  | { ok: true }
  | { ok: false; error: string; fields?: Partial<Record<"rating" | "name" | "comment", string>> };

export async function submitReview(input: {
  code: string;
  rating: unknown;
  name: unknown;
  comment: unknown;
}): Promise<SubmitResult> {
  const rating = Number(input.rating);
  const name = clean(input.name, LIMITS.name);
  const comment = String(input.comment ?? "").trim().slice(0, LIMITS.comment);

  const fields: NonNullable<Extract<SubmitResult, { ok: false }>["fields"]> = {};
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fields.rating = "Elegí de 1 a 5 estrellas.";
  if (name.length < 2) fields.name = "Escribí tu nombre.";
  if (comment.length < 3) fields.comment = "Contanos algo sobre la obra.";
  if (Object.keys(fields).length) return { ok: false, error: "Revisá los campos marcados.", fields };

  const status = await getInviteStatus(input.code);
  if (status.state === "invalid") return { ok: false, error: "Este link no es válido." };
  if (status.state === "used") return { ok: false, error: "Este link ya se usó para dejar una reseña." };

  const review: Review = {
    id: randomUUID(),
    slug: status.invite.slug,
    code: status.invite.code,
    name,
    rating,
    comment,
    createdAt: new Date().toISOString(),
  };

  const store = getStore();
  // Reservar el código primero: si llegan dos envíos a la vez, sólo uno gana.
  const claimed = await store.hsetnx(KEYS.used, review.code, review.id);
  if (!claimed) return { ok: false, error: "Este link ya se usó para dejar una reseña." };
  await store.hset(KEYS.reviews, review.id, JSON.stringify(review));
  return { ok: true };
}

/** Todas las reseñas, de la más nueva a la más vieja. Sólo para el panel. */
export async function listReviews(): Promise<Review[]> {
  const all = await getStore().hgetall(KEYS.reviews);
  return Object.values(all)
    .map((r) => parse<Review>(r))
    .filter((r): r is Review => r !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteReview(id: string) {
  // El código queda marcado como usado: borrar una reseña no habilita otra.
  await getStore().hdel(KEYS.reviews, id);
}

/**
 * Reseñas para mostrar en el sitio, agrupadas por obra.
 * Si la base no está configurada o falla, el sitio sigue andando sin reseñas.
 */
export async function getPublicReviews(): Promise<Record<string, PublicReview[]>> {
  await connection(); // siempre en el momento del pedido, nunca en el build
  let reviews: Review[] = [];
  try {
    reviews = await listReviews();
  } catch (err) {
    if (!(err instanceof StoreNotConfiguredError)) console.error("[reseñas]", err);
    return {};
  }
  const bySlug: Record<string, PublicReview[]> = {};
  for (const r of reviews) {
    if (!illustrationBySlug(r.slug)) continue;
    const pub: PublicReview = {
      id: r.id,
      slug: r.slug,
      name: r.name,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    };
    (bySlug[r.slug] ??= []).push(pub);
  }
  return bySlug;
}

export function summarize(reviews: { rating: number }[] | undefined): RatingSummary {
  const count = reviews?.length ?? 0;
  if (!count) return { average: 0, count: 0 };
  const sum = reviews!.reduce((s, r) => s + r.rating, 0);
  return { average: sum / count, count };
}
