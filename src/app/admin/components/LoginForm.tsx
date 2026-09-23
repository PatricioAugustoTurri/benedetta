"use client";

import { useActionState, useId } from "react";
import { entrar, type EstadoFormulario } from "../actions";

/**
 * La schermata di accesso: un campo e un pulsante.
 *
 * Il messaggio di errore dice «questa password non è quella giusta» e
 * nient'altro. Non distingue fra password vuota, corta o sbagliata oltre
 * l'ovvio, e soprattutto non dice se la password esiste: ogni dettaglio in più
 * è un indizio per chi sta provando password.
 */
export default function LoginForm({ desde }: { desde: string }) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(entrar, {});
  const id = useId();

  return (
    <form action={enviar} className="mt-8">
      <input type="hidden" name="desde" value={desde} />

      <label htmlFor={id} className="label block text-ink-faint">
        Password
      </label>
      <input
        id={id}
        name="clave"
        type="password"
        autoComplete="current-password"
        autoFocus
        required
        aria-invalid={estado.error ? true : undefined}
        aria-describedby={estado.error ? `${id}-error` : undefined}
        className="peer mt-2 block w-full border-0 border-b border-line bg-transparent py-2.5 text-base text-ink transition-colors focus:border-ink aria-[invalid=true]:border-accent"
      />

      {estado.error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-xs text-accent">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-8 bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {enviando ? "Accesso in corso…" : "Accedi"}
      </button>
    </form>
  );
}
