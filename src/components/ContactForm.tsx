"use client";

import { useId, useRef, useState } from "react";
import { Copy, Mail } from "@/components/Icon";
import { site } from "@/data/site";

/**
 * El formulario de contacto.
 *
 * **A dónde va lo que se escribe.** No hay servidor, ni dominio, ni servicio
 * de formularios contratado: la consulta se resuelve por mail y afuera del
 * sitio. Así que esto no "envía" nada — arma el mensaje y se lo pasa al
 * programa de correo del visitante, con el asunto y el cuerpo ya escritos.
 * Es exactamente lo que ya hace el botón "Chiedi info" de cada obra, con la
 * diferencia de que acá el mensaje llega armado en vez de vacío.
 *
 * Eso tiene una falla conocida y la pantalla de confirmación existe por ella:
 * si el visitante no tiene programa de correo configurado, `mailto:` no hace
 * nada y no avisa. Por eso después de enviar quedan a la vista la dirección y
 * un botón para copiarse el mensaje entero: pase lo que pase con el mailto,
 * hay una salida.
 *
 * El día que haya backend, lo único que cambia es `onSubmit`.
 *
 * **Cómo se dibuja un campo en este sistema**, que no tenía ninguno: un
 * rótulo en versalitas —que es lo que DESIGN.md reserva para nombrar un
 * campo— y debajo el texto sobre un solo filete. Sin caja, sin relleno, sin
 * radio: un renglón sobre el que se escribe, como el resto del sitio separa
 * con filetes y aire en vez de con recuadros.
 *
 * Los estados usan lo que el sistema ya tiene:
 * - **Reposo:** filete `line`, rótulo en tinta pálida.
 * - **Foco:** el filete pasa a tinta plena y el rótulo también. El anillo de
 *   foco es el mismo de todo el sitio, sin tocar: es el indicador que ya
 *   conoce quien tabula, y cambiarlo acá sería inventar un segundo idioma.
 * - **Error:** el filete pasa a terracota y debajo aparece el motivo, también
 *   en terracota. Es color como marca de estado, que es para lo único que
 *   este sistema usa la terracota.
 */

type Field = "nome" | "email" | "oggetto" | "messaggio";
type Errors = Partial<Record<Field, string>>;

const LABEL = "label block text-ink-faint transition-colors";

/*
  El campo entero, sin caja. `peer` deja que el rótulo reaccione al foco del
  control sin JavaScript. El filete es `border-b` del propio control, así que
  mide exactamente lo que mide el campo.
*/
const CONTROL =
  "peer block w-full border-0 border-b border-line bg-transparent py-2.5 text-base text-ink transition-colors placeholder:text-ink-faint focus:border-ink aria-[invalid=true]:border-accent aria-[invalid=true]:focus:border-accent";

/*
  `text-base` no es una elección tipográfica: por debajo de 16px, Safari en
  iPhone hace zoom al enfocar un campo y deja la página corrida. El cuerpo del
  sitio mide 16px, así que coincide sin esfuerzo, pero si alguien lo baja, eso
  es lo que se rompe.

  Los estados de error y de foco pueden darse juntos, y `aria-[invalid=true]:focus`
  pesa más que `focus` por especificidad, no por orden: un campo con error y
  con el cursor adentro sigue siendo un campo con error.
*/

export default function ContactForm({ asuntoInicial }: { asuntoInicial?: string }) {
  const id = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const validate = (data: Record<Field, string>): Errors => {
    const next: Errors = {};
    if (!data.nome.trim()) next.nome = "Falta tu nombre.";
    // Comprobación mínima a propósito: la de verdad la hace el mail al llegar
    // o no llegar. Una expresión estricta rechaza direcciones válidas raras.
    if (!data.email.trim()) next.email = "Falta tu mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
      next.email = "Ese mail no parece completo.";
    if (!data.messaggio.trim()) next.messaggio = "Contame algo, aunque sea corto.";
    return next;
  };

  const read = (form: HTMLFormElement): Record<Field, string> => {
    const fd = new FormData(form);
    return {
      nome: String(fd.get("nome") ?? ""),
      email: String(fd.get("email") ?? ""),
      oggetto: String(fd.get("oggetto") ?? ""),
      messaggio: String(fd.get("messaggio") ?? ""),
    };
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = read(form);
    const found = validate(data);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      // El foco va al primer campo con problema: quien no ve la página
      // necesita que el error tenga lugar, no sólo texto.
      const first = Object.keys(found)[0] as Field;
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const cuerpo = `${data.messaggio.trim()}\n\n—\n${data.nome.trim()}\n${data.email.trim()}`;
    setSent(cuerpo);
    setCopied(false);

    /*
      El asunto lo escribe quien consulta, y cuando llega desde una obra ya
      viene puesto. Si lo dejó vacío vuelve el de antes, con su nombre: un mail
      sin asunto se pierde en cualquier bandeja, y dejarlo en blanco porque el
      campo es opcional sería trasladarle a ella ese costo.
    */
    const asunto = data.oggetto.trim() || `Contatto — ${data.nome.trim()}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(
      asunto,
    )}&body=${encodeURIComponent(cuerpo)}`;
  };

  /*
    Revalidar al escribir, pero sólo el campo que ya falló. Antes del primer
    envío nadie se equivocó todavía; marcarlo mientras escribe es apurarlo.
  */
  const revalidate = (field: Field) => {
    if (!errors[field] || !formRef.current) return;
    const found = validate(read(formRef.current));
    setErrors((prev) => ({ ...prev, [field]: found[field] }));
  };

  if (sent) {
    return (
      <div className="mt-10 border-t border-line pt-8">
        <p role="status" className="text-lg leading-relaxed text-ink">
          Se abrió tu programa de mail con el mensaje ya escrito. Revisalo y mandalo.
        </p>
        <p className="prose-measure mt-4 text-sm text-ink-soft">
          ¿No se abrió nada? Copiate el mensaje y mandámelo a{" "}
          <a
            href={`mailto:${site.email}`}
            className="link-underline break-all text-ink"
          >
            {site.email}
          </a>
          .
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(sent);
                setCopied(true);
              } catch {
                // Sin permiso de portapapeles no hay nada que hacer desde acá,
                // y el mensaje sigue estando a la vista para seleccionarlo.
                setCopied(false);
              }
            }}
            className="group flex items-center gap-2 text-sm text-ink"
          >
            <Copy className="shrink-0 text-ink-faint transition-colors group-hover:text-accent" />
            <span className="link-underline" data-active="true">
              {copied ? "Copiado" : "Copiar el mensaje"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSent(null);
              setErrors({});
            }}
            className="text-sm text-ink-faint transition-colors hover:text-ink"
          >
            <span className="link-underline">Escribir otro</span>
          </button>
        </div>

        {/*
          El mensaje queda a la vista, no escondido detrás del botón de copiar:
          si el portapapeles falla, todavía se puede seleccionar con el dedo.
        */}
        <pre className="mt-8 whitespace-pre-wrap border-t border-line pt-6 font-sans text-sm leading-relaxed text-ink-soft">
          {sent}
        </pre>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      /*
        `noValidate` para que los globos del navegador no hablen por el sitio:
        salen sin estilo, en el idioma del navegador y no en el de la página.
        La validación es la de arriba, con los mismos mensajes y la misma voz.
      */
      noValidate
      className="mt-10 border-t border-line pt-8"
    >
      <div className="space-y-8">
        <Campo
          id={`${id}-nome`}
          name="nome"
          label="Nome"
          error={errors.nome}
          onInput={() => revalidate("nome")}
        />
        <Campo
          id={`${id}-email`}
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          error={errors.email}
          onInput={() => revalidate("email")}
        />
        {/*
          El asunto va entre el mail y el mensaje, y no es un campo más: es el
          que llega ya escrito cuando alguien toca «Chiedi info» en una obra.
          Ahí el visitante ve, antes de escribir una palabra, que el formulario
          sabe de qué obra viene — que es lo que antes intentaba hacer el asunto
          de un `mailto:` que muchas veces no llegaba a abrirse.

          Opcional a propósito: quien entra por el menú, sin venir de una obra,
          no tiene por qué completar un campo más para escribir.
        */}
        <Campo
          id={`${id}-oggetto`}
          name="oggetto"
          label="Oggetto"
          hint="El título de la obra, o de qué querés hablar."
          defaultValue={asuntoInicial}
          error={errors.oggetto}
          onInput={() => revalidate("oggetto")}
        />
        <Campo
          id={`${id}-messaggio`}
          name="messaggio"
          label="Messaggio"
          hint="De qué se trata el proyecto, para cuándo lo necesitás y en qué formato."
          multiline
          error={errors.messaggio}
          onInput={() => revalidate("messaggio")}
        />
      </div>

      {/*
        El envío toma prestado el dibujo de la acción principal del sitio —el
        sobre en tinta pálida y la palabra subrayada de "Chiedi info"—, porque
        hace lo mismo: abrir un mail. Es el primer `<button>` que actúa en
        todo el sitio y no inventa una forma nueva para hacerlo.
      */}
      <div className="mt-10">
        <button type="submit" className="group flex items-center gap-2 text-base text-ink">
          <Mail
            size={20}
            className="shrink-0 text-ink-faint transition-colors group-hover:text-accent"
          />
          <span className="link-underline" data-active="true">
            Invia
          </span>
        </button>
        <p className="mt-3 text-xs text-ink-faint">
          Se abre tu programa de mail con el mensaje ya escrito. No se manda solo.
        </p>
      </div>
    </form>
  );
}

function Campo({
  id,
  name,
  label,
  hint,
  error,
  type = "text",
  multiline = false,
  autoComplete,
  defaultValue,
  onInput,
}: {
  id: string;
  name: Field;
  label: string;
  hint?: string;
  error?: string;
  type?: string;
  multiline?: boolean;
  autoComplete?: string;
  /*
    Valor inicial y no valor: el campo queda sin controlar a propósito, para
    que lo que llega puesto se pueda corregir, ampliar o borrar como cualquier
    otra cosa que se escriba acá. Un asunto que el visitante no puede tocar
    sería decirle de qué tiene permitido hablar.
  */
  defaultValue?: string;
  onInput: () => void;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const shared = {
    id,
    name,
    autoComplete,
    defaultValue,
    onInput,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": describedBy,
    className: CONTROL,
  };

  return (
    <div>
      {/*
        El rótulo va arriba y es un rótulo de verdad, no un texto de relleno
        adentro del campo: un placeholder desaparece justo cuando se lo
        necesita, que es mientras se escribe.

        `peer-focus:` lo lleva a tinta plena con el campo enfocado —el orden
        en el DOM es rótulo, después control, así que va con `peer/…` sobre el
        contenedor en vez de `peer-focus` hacia atrás. Se resuelve con
        `has-[:focus]` en el div, que sí mira hacia adelante.
      */}
      <div className="group/campo" data-error={Boolean(error)}>
        <label
          htmlFor={id}
          className={`${LABEL} group-has-[:focus]/campo:text-ink group-data-[error=true]/campo:text-accent`}
        >
          {label}
        </label>

        {hint && (
          <p id={hintId} className="mt-1.5 text-xs leading-relaxed text-ink-faint">
            {hint}
          </p>
        )}

        {multiline ? (
          /*
            `field-sizing-content` hace que crezca con lo que se escribe en vez
            de abrir una barra de scroll adentro de un cajón de cinco renglones.
            Donde todavía no está soportado quedan los cinco renglones y el
            tirador manual, que por eso sigue habilitado.
          */
          <textarea
            {...shared}
            rows={5}
            className={`${CONTROL} mt-2 field-sizing-content resize-y`}
          />
        ) : (
          <input {...shared} type={type} className={`${CONTROL} mt-2`} />
        )}

        {error && (
          <p id={errorId} className="mt-2 text-xs text-accent">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
