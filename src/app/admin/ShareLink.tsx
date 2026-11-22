"use client";

import { useState } from "react";

type Props = {
  url: string;
  code: string;
  title: string;
  buyer?: string;
  /** Versión compacta para las filas de la lista. */
  compact?: boolean;
};

export function whatsappText({ url, title, buyer }: Pick<Props, "url" | "title" | "buyer">) {
  const hola = buyer ? `¡Hola, ${buyer}!` : "¡Hola!";
  return `${hola} Gracias por comprar "${title}". Cuando te llegue, me encantaría saber qué te pareció. Podés dejar tu reseña acá (no hace falta crear cuenta): ${url}`;
}

/** Link listo para copiar o mandar por WhatsApp. */
export default function ShareLink({ url, code, title, buyer, compact = false }: Props) {
  const [copied, setCopied] = useState<"link" | "msg" | null>(null);

  async function copy(text: string, what: "link" | "msg") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      window.prompt("Copiá el link:", text);
    }
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(whatsappText({ url, title, buyer }))}`;

  return (
    <div className={compact ? "flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" : "space-y-4"}>
      {!compact && (
        <div className="border border-line bg-paper-deep/50 p-4">
          <p className="break-all font-mono text-sm">{url}</p>
          <p className="mt-2 text-xs text-ink-faint">
            Código para tarjeta impresa: <span className="font-mono text-ink">
              {code.length === 10 ? `${code.slice(0, 5)}-${code.slice(5)}` : code}
            </span> — se
            ingresa en <span className="font-mono">/resena</span>
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <button type="button" onClick={() => copy(url, "link")} className="link-underline text-ink-soft hover:text-ink">
          {copied === "link" ? "¡Copiado!" : "Copiar link"}
        </button>
        <button
          type="button"
          onClick={() => copy(whatsappText({ url, title, buyer }), "msg")}
          className="link-underline text-ink-soft hover:text-ink"
        >
          {copied === "msg" ? "¡Copiado!" : "Copiar mensaje"}
        </button>
        <a href={wa} target="_blank" rel="noreferrer noopener" className="link-underline text-ink-soft hover:text-ink">
          Enviar por WhatsApp
        </a>
      </div>
    </div>
  );
}
