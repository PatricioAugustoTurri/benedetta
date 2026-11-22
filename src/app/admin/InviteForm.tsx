"use client";

import { useActionState } from "react";
import { createInviteAction, type InviteState } from "./actions";
import ShareLink from "./ShareLink";

type Props = {
  origin: string;
  works: { slug: string; title: string }[];
  limits: { buyer: number; note: number };
};

export default function InviteForm({ origin, works, limits }: Props) {
  const [state, action, pending] = useActionState<InviteState, FormData>(createInviteAction, null);
  const title = (slug: string) => works.find((w) => w.slug === slug)?.title ?? slug;

  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-16">
      <form action={action} className="space-y-6">
        <label className="block">
          <span className="eyebrow">Obra vendida</span>
          <select
            name="slug"
            required
            defaultValue=""
            className="mt-3 block w-full border-b border-line bg-transparent py-2 outline-none focus:border-ink"
          >
            <option value="" disabled>
              Elegí una obra…
            </option>
            {works.map((w) => (
              <option key={w.slug} value={w.slug}>
                {w.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="eyebrow">Nombre del comprador (opcional)</span>
          <input
            name="buyer"
            maxLength={limits.buyer}
            className="mt-3 block w-full border-b border-line bg-transparent py-2 outline-none focus:border-ink"
          />
          <span className="mt-1 block text-xs text-ink-faint">Lo saluda en la página y precarga el formulario.</span>
        </label>

        <label className="block">
          <span className="eyebrow">Nota privada (opcional)</span>
          <input
            name="note"
            maxLength={limits.note}
            placeholder="N.º de pedido, canal de venta…"
            className="mt-3 block w-full border-b border-line bg-transparent py-2 outline-none placeholder:text-ink-faint focus:border-ink"
          />
          <span className="mt-1 block text-xs text-ink-faint">Sólo la ves vos.</span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="bg-ink px-6 py-3 text-sm tracking-wide text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {pending ? "Generando…" : "Generar link"}
        </button>
      </form>

      <div aria-live="polite">
        {state?.ok === false && <p className="text-sm text-accent">{state.error}</p>}
        {state?.ok && (
          <div>
            <p className="eyebrow">Link listo · {title(state.invite.slug)}</p>
            <div className="mt-4">
              <ShareLink
                url={`${origin}/resena/${state.invite.code}`}
                code={state.invite.code}
                title={title(state.invite.slug)}
                buyer={state.invite.buyer}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
