"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, null);

  return (
    <form action={action} className="mt-10 flex max-w-md flex-wrap items-end gap-4">
      <label className="flex-1">
        <span className="eyebrow">Contraseña</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="mt-3 block w-full border-b border-line bg-transparent py-2 text-lg outline-none transition-colors focus:border-ink"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="bg-ink px-6 py-3 text-sm tracking-wide text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
      {state?.error && (
        <p role="alert" className="w-full text-sm text-accent">
          {state.error}
        </p>
      )}
    </form>
  );
}
