"use client";

import Link from "next/link";
import { Plus } from "@/components/Icon";
import type { Prodotto } from "@/lib/prodotti";
import { riordinaStampe } from "../shop/actions";
import GrigliaOrdenabile from "./GrigliaOrdenabile";
import PlacaStampa from "./PlacaStampa";
import StampaEditabile from "./StampaEditabile";

/**
 * Le stampe dell'admin, nella griglia dello Shop e nel suo ordine.
 *
 * Prima erano righe con due frecce: si vedeva se una stampa era pubblicata e
 * a quanto si vendeva, ma non come stava accanto alle altre, che è proprio
 * quello che decide l'ordine. Adesso sono le colonne di /shop/stampe —due sul
 * telefono, tre da 1024px, lo stesso passo stretto fra una copertina e
 * l'altra— e si trascinano come le opere.
 *
 * L'unica cosa che la griglia pubblica non ha è l'aria fra una riga e
 * l'altra: là le copertine non portano parole, qui sì.
 */
export default function StampeOrdenabili({ stampe }: { stampe: Prodotto[] }) {
  return (
    <GrigliaOrdenabile
      piezas={stampe}
      hueco={<NuovaStampa />}
      salvar={riordinaStampe}
      clasesRejilla="grid grid-cols-2 gap-x-1 gap-y-7 sm:gap-x-1.5 md:gap-x-2 lg:grid-cols-3"
      celda={(stampa, manija) => <StampaEditabile stampa={stampa} manija={manija} />}
      enMano={(stampa) => <PlacaStampa stampa={stampa} enMano />}
      testi={{
        aiuto: "Trascina una stampa dalla sua maniglia: l’ordine è quello dello Shop.",
        cambiato: "Le stampe sono cambiate mentre ne spostavi una, quindi lo spostamento è stato scartato.",
      }}
    />
  );
}

/**
 * La casella tratteggiata dell'archivio, prima cella anche qui. Una stampa
 * nuova nasce in cima, quindi compare proprio accanto a questa.
 */
function NuovaStampa() {
  return (
    <Link href="/admin/shop/nuovo" className="group block focus-visible:outline-none">
      <span className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 border border-dashed border-line bg-paper-deep/40 transition-colors duration-300 group-hover:border-accent/50 group-hover:bg-paper-deep/70 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[3px] group-focus-visible:outline-accent">
        <Plus size={24} className="text-ink-faint transition-colors duration-300 group-hover:text-accent" />
        <span className="label text-ink-faint transition-colors duration-300 group-hover:text-ink-soft">
          Nuova stampa
        </span>
      </span>
    </Link>
  );
}
