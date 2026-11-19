"use client";

import { useState } from "react";
import { Trash } from "@/components/Icon";

/**
 * Il cestino di una riga dei conti, con un secondo sì: sono soldi, e un tocco
 * sbagliato sul telefono non deve far sparire una vendita o una spesa.
 *
 * Con `testo` diventa un bottone scritto —«Cancella la vendita»— per la
 * pagina della vendita, dove il cestino da solo sarebbe troppo poco.
 */
export default function CancellaRiga({
  azione,
  id,
  descrizione,
  testo,
}: {
  azione: (fd: FormData) => Promise<void>;
  id: number;
  descrizione: string;
  testo?: string;
}) {
  const [chiede, setChiede] = useState(false);

  if (!chiede) {
    return testo ? (
      <button
        type="button"
        onClick={() => setChiede(true)}
        className="area-tocco inline-flex items-center gap-1.5 text-xs text-ink-soft transition-colors hover:text-accent"
      >
        <Trash size={14} />
        <span className="link-underline">{testo}</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setChiede(true)}
        title="Cancella"
        className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-faint transition-colors hover:text-accent"
      >
        <span className="sr-only">Cancella {descrizione}</span>
        <Trash size={15} />
      </button>
    );
  }

  return (
    <form action={azione} className="flex shrink-0 items-center gap-3 text-xs">
      <input type="hidden" name="id" value={id} />
      {testo && <span className="text-ink-soft">Cancellare {descrizione}?</span>}
      <button type="submit" autoFocus className="link-underline text-accent">
        Sì, cancella
      </button>
      <button type="button" onClick={() => setChiede(false)} className="link-underline text-ink-soft hover:text-ink">
        No
      </button>
    </form>
  );
}
