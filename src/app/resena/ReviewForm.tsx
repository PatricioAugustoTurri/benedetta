"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { StarIcon } from "@/components/Stars";
import { sendReview, type ReviewFormState } from "./actions";

const WORDS = ["", "No me gustó", "Regular", "Bien", "Muy bien", "Me encantó"];

type Props = {
  code: string;
  defaultName?: string;
  limits: { name: number; comment: number };
};

export default function ReviewForm({ code, defaultName = "", limits }: Props) {
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(sendReview, null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  if (state?.ok) {
    return (
      <div role="status" className="border-t border-line pt-10">
        <p className="font-display text-[clamp(1.75rem,3.6vw,2.5rem)] leading-tight tracking-[-0.01em]">
          ¡Gracias! Tu reseña ya está publicada.
        </p>
        <p className="mt-4 max-w-md text-ink-soft">
          Me ayuda muchísimo saber cómo llegó la obra y qué te pareció.
        </p>
        <Link href="/ilustraciones" className="link-underline mt-8 inline-block text-sm" data-active="true">
          Ver más ilustraciones
        </Link>
      </div>
    );
  }

  const fields = state && !state.ok ? state.fields ?? {} : {};
  const shown = hover || rating;

  return (
    <form action={action} className="space-y-10" noValidate>
      <input type="hidden" name="code" value={code} />

      <fieldset>
        <legend className="eyebrow">Tu puntaje</legend>
        <div
          className="mt-4 flex items-center gap-1 text-[2.25rem]"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(n)}>
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="peer sr-only"
                aria-describedby={fields.rating ? "error-rating" : undefined}
              />
              <span className="sr-only">
                {n} {n === 1 ? "estrella" : "estrellas"}
              </span>
              <span className="block rounded-sm transition-transform duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent hover:scale-110">
                <StarIcon filled={shown >= n ? 1 : 0} />
              </span>
            </label>
          ))}
          <span className="ml-4 text-sm text-ink-soft" aria-hidden="true">
            {WORDS[shown]}
          </span>
        </div>
        {fields.rating && (
          <p id="error-rating" className="mt-2 text-sm text-accent">
            {fields.rating}
          </p>
        )}
      </fieldset>

      <div>
        <label htmlFor="name" className="eyebrow">
          Tu nombre
        </label>
        <input
          id="name"
          name="name"
          defaultValue={defaultName}
          maxLength={limits.name}
          autoComplete="given-name"
          aria-invalid={!!fields.name}
          aria-describedby={fields.name ? "error-name" : "hint-name"}
          className="mt-3 block w-full max-w-md border-b border-line bg-transparent py-2 text-lg outline-none transition-colors focus:border-ink"
        />
        {fields.name ? (
          <p id="error-name" className="mt-2 text-sm text-accent">
            {fields.name}
          </p>
        ) : (
          <p id="hint-name" className="mt-2 text-xs text-ink-faint">
            Se publica tal cual lo escribas. Con el nombre de pila alcanza.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="comment" className="eyebrow">
          Tu comentario
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={5}
          maxLength={limits.comment}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="¿Cómo llegó? ¿Dónde la colgaste? ¿Qué te gustó?"
          aria-invalid={!!fields.comment}
          aria-describedby={fields.comment ? "error-comment" : undefined}
          className="mt-3 block w-full resize-y border border-line bg-paper-deep/40 p-4 leading-relaxed outline-none transition-colors placeholder:text-ink-faint focus:border-ink"
        />
        <div className="mt-2 flex justify-between gap-4 text-xs">
          <span id="error-comment" className="text-accent">
            {fields.comment}
          </span>
          <span className="tabular-nums text-ink-faint">
            {comment.length}/{limits.comment}
          </span>
        </div>
      </div>

      {state && !state.ok && !Object.keys(fields).length && (
        <p role="alert" className="text-sm text-accent">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-ink px-7 py-3.5 text-sm tracking-wide text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {pending ? "Enviando…" : "Publicar reseña"}
      </button>
    </form>
  );
}
