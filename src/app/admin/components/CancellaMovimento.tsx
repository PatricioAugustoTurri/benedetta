"use client";

import { useState } from "react";
import { Trash } from "@/components/Icon";
import { cancellaMovimentoAzione } from "../conti/actions";

/**
 * Il cestino di un movimento, con un secondo sì: sono soldi, e un tocco
 * sbagliato sul telefono non deve far sparire una vendita.
 */
export default function CancellaMovimento({ id, descrizione }: { id: number; descrizione: string }) {
  const [chiede, setChiede] = useState(false);

  if (!chiede) {
    return (
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
    <form action={cancellaMovimentoAzione} className="flex shrink-0 items-center gap-3 text-xs">
      <input type="hidden" name="id" value={id} />
      <button type="submit" autoFocus className="link-underline text-accent">
        Cancella
      </button>
      <button type="button" onClick={() => setChiede(false)} className="link-underline text-ink-soft hover:text-ink">
        No
      </button>
    </form>
  );
}
