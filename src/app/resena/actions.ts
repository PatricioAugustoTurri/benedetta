"use server";

import { redirect } from "next/navigation";
import { normalizeCode, submitReview, type SubmitResult } from "@/lib/reviews";

export type ReviewFormState = SubmitResult | null;

export async function sendReview(_prev: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  try {
    return await submitReview({
      code: String(formData.get("code") ?? ""),
      rating: formData.get("rating"),
      name: formData.get("name"),
      comment: formData.get("comment"),
    });
  } catch (err) {
    console.error("[reseñas] no se pudo guardar", err);
    return { ok: false, error: "No pudimos guardar tu reseña. Probá de nuevo en un rato." };
  }
}

/** Formulario de /resena: lleva a la página del código tipeado. */
export async function goToCode(formData: FormData) {
  const code = normalizeCode(String(formData.get("code") ?? ""));
  redirect(code ? `/resena/${code}` : "/resena");
}
