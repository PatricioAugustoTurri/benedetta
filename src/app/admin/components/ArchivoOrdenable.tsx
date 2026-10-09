"use client";

import type { ReactNode } from "react";
import { reordenarArchivo } from "../actions";
import GrigliaOrdenabile from "./GrigliaOrdenabile";
import ObraEditable from "./ObraEditable";
import PlacaObra from "./PlacaObra";
import type { Work } from "@/lib/works";

/**
 * L'archivio dell'admin, riordinabile. Il gesto è quello di
 * `GrigliaOrdenabile`; qui si dice solo cosa c'è in ogni cella e dove si salva.
 *
 * È client perché passa funzioni di disegno alla griglia, e quelle non
 * attraversano il confine dal server.
 */
export default function ArchivoOrdenable({ obras, hueco }: { obras: Work[]; hueco: ReactNode }) {
  return (
    <GrigliaOrdenabile
      piezas={obras}
      hueco={hueco}
      salvar={reordenarArchivo}
      clasesRejilla="grid gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3"
      celda={(obra, manija) => <ObraEditable obra={obra} manija={manija} />}
      enMano={(obra) => <PlacaObra obra={obra} enMano />}
      testi={{
        aiuto: "Trascina un’opera dalla sua maniglia per cambiare l’ordine.",
        cambiato: "L’archivio è cambiato mentre spostavi un’opera, quindi lo spostamento è stato scartato.",
      }}
    />
  );
}
