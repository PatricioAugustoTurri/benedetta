"use server";

import { revalidatePath } from "next/cache";
import { logIn, logOut, requireAdmin } from "@/lib/admin-auth";
import type { Invite } from "@/lib/review-types";
import { createInvite, deleteInvite, deleteReview } from "@/lib/reviews";

export type LoginState = { error: string } | null;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const ok = await logIn(String(formData.get("password") ?? ""));
  if (!ok) return { error: "Contraseña incorrecta." };
  revalidatePath("/admin");
  return null;
}

export async function logoutAction() {
  await logOut();
  revalidatePath("/admin");
}

export type InviteState = { ok: true; invite: Invite } | { ok: false; error: string } | null;

export async function createInviteAction(_prev: InviteState, formData: FormData): Promise<InviteState> {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  if (!slug) return { ok: false, error: "Elegí la obra que se vendió." };
  try {
    const invite = await createInvite({
      slug,
      buyer: String(formData.get("buyer") ?? ""),
      note: String(formData.get("note") ?? ""),
    });
    revalidatePath("/admin");
    return { ok: true, invite };
  } catch (err) {
    console.error("[admin] no se pudo crear el link", err);
    return { ok: false, error: "No se pudo crear el link. Revisá la conexión con la base de datos." };
  }
}

export async function deleteInviteAction(formData: FormData) {
  await requireAdmin();
  await deleteInvite(String(formData.get("code") ?? ""));
  revalidatePath("/admin");
}

export async function deleteReviewAction(formData: FormData) {
  await requireAdmin();
  await deleteReview(String(formData.get("id") ?? ""));
  revalidatePath("/admin");
  revalidatePath("/", "layout");
}
