"use client";

import { useId, useState } from "react";
import { ArrowRight } from "@/components/Icon";
import { endpoint, pitch, subscribeHref } from "@/data/newsletter";

/**
 * El alta a la newsletter, en una sola línea.
 *
 * A dónde va: ver `src/data/newsletter.ts`. Hoy abre el mail con la dirección
 * ya escrita; el día que haya servicio, el POST entra en `onSubmit` y nada
 * más de este archivo cambia.
 *
 * **Por qué el campo no lleva rótulo a la vista**, que es lo contrario de lo
 * que hace el formulario de contacto: allá hay tres campos y el rótulo es lo
 * único que los distingue. Acá hay uno solo, y la columna ya está encabezada
 * por sus versalitas —"Newsletter"— con la frase que dice qué se recibe justo
 * encima del renglón. Un segundo rótulo en versalitas debajo del primero sería
 * dos encabezados para una cosa. El `<label>` existe igual, en `sr-only`: la
 * excepción es visual, no de accesibilidad.
 */
export default function NewsletterForm() {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();

    // La misma comprobación mínima del formulario de contacto, y por la misma
    // razón: la validación de verdad la hace el mail al llegar o no llegar.
    if (!email) {
      setError("Manca la tua email.");
      form.querySelector<HTMLElement>('[name="email"]')?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Questa email non sembra completa.");
      form.querySelector<HTMLElement>('[name="email"]')?.focus();
      return;
    }

    setError(null);
    setSent(true);

    // `endpoint` todavía es null en todo el sitio, así que esta rama está
    // apagada. Queda escrita para que el día del servicio no haya que
    // reconstruirla desde cero: es un POST y una confirmación, nada más.
    if (endpoint) {
      void fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).catch(() => {
        /* El alta a mano por mail sigue siendo la salida; ver el estado de abajo. */
      });
      return;
    }

    window.location.href = subscribeHref(email);
  };

  if (sent) {
    return (
      <p role="status" className="mt-4 text-sm leading-relaxed text-ink-soft">
        Si è aperto il tuo programma di posta con il messaggio già scritto.
        Controllalo e invialo: l&apos;iscrizione la segno a mano.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-4">
      <p className="text-sm leading-relaxed text-ink-soft">{pitch}</p>

      {/*
        El renglón: un solo filete abajo, como cualquier campo del sitio, y el
        botón adentro del mismo filete en vez de debajo. `has-[:focus]` lleva
        el filete a tinta plena —no hay `:focus-within` acá porque el botón
        también vive adentro y su foco no debe encender el campo.
      */}
      {/*
        El renglón con error y con el cursor adentro sigue siendo un renglón
        con error: por eso la última clase repite el estado de error bajo el
        de foco. `:has(input:focus)` pesa más que `[data-error]` por
        especificidad, no por orden, así que sin esa tercera clase el filete
        volvía a tinta plena en cuanto el campo recuperaba el foco —que es
        justo lo que hace el envío fallido— y el error se quedaba sin color.
        Misma regla y mismo motivo que en el formulario de contacto.
      */}
      <div
        data-error={Boolean(error)}
        className="mt-5 flex items-center gap-2 border-b border-line transition-colors has-[input:focus]:border-ink data-[error=true]:border-accent data-[error=true]:has-[input:focus]:border-accent"
      >
        <label htmlFor={`${id}-email`} className="sr-only">
          La tua email
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="la tua email"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onInput={() => error && setError(null)}
          /*
            `text-base` no es tipografía: por debajo de 16px Safari en iPhone
            hace zoom al enfocar y deja la página corrida. Misma razón, misma
            medida y mismo comentario que en el formulario de contacto.
          */
          className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-base text-ink outline-none placeholder:text-ink-faint"
        />
        <button
          type="submit"
          /*
            El área de toque mide 40px de alto aunque la flecha mida 16: el
            renglón es angosto y el blanco no puede serlo. El anillo de foco
            es el del sitio, sin tocar.
          */
          className="group -mr-1 flex h-10 w-10 shrink-0 items-center justify-center text-ink-faint transition-colors hover:text-accent"
        >
          <span className="sr-only">Iscriviti</span>
          <ArrowRight size={16} className="shrink-0" />
        </button>
      </div>

      {error && (
        <p id={`${id}-error`} className="mt-2 text-xs text-accent">
          {error}
        </p>
      )}
    </form>
  );
}
