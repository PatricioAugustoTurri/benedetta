import type { Metadata } from "next";
import { goToCode } from "./actions";

export const metadata: Metadata = {
  title: "Dejá tu reseña",
  description: "Ingresá el código que vino con tu compra para dejar una reseña.",
  robots: { index: false, follow: false },
};

/** Para quien tiene el código impreso en la tarjeta y no el link. */
export default function ResenaCodigoPage() {
  return (
    <section className="shell flex min-h-[60vh] flex-col justify-center py-24">
      <p className="eyebrow">Reseña</p>
      <h1 className="mt-5 max-w-2xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] tracking-[-0.02em]">
        Ingresá tu código
      </h1>
      <p className="mt-6 max-w-md text-ink-soft">
        Es el que vino con tu compra. Mayúsculas, minúsculas y guiones da igual.
      </p>

      <form action={goToCode} className="mt-10 flex max-w-md flex-wrap items-end gap-4">
        <label className="flex-1">
          <span className="sr-only">Código</span>
          <input
            name="code"
            required
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="abcde-fghjk"
            className="block w-full border-b border-line bg-transparent py-2 font-mono text-lg tracking-wider outline-none transition-colors placeholder:text-ink-faint focus:border-ink"
          />
        </label>
        <button
          type="submit"
          className="bg-ink px-6 py-3 text-sm tracking-wide text-paper transition-opacity hover:opacity-85"
        >
          Continuar
        </button>
      </form>
    </section>
  );
}
