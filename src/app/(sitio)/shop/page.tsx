import type { Metadata } from "next";
import { listPorte } from "@/lib/copertine";
import { scontiInCorsoConStampe } from "@/lib/sconti";
import PorteShop from "./components/PorteShop";
import ScontiShop from "./components/ScontiShop";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Stampe da comprare online e ritratti e illustrazioni personalizzate su richiesta.",
  alternates: { canonical: "/shop" },
};

/**
 * Lo Shop: le sue categorie, una accanto all'altra. Ognuna porta alla sua
 * pagina, dove c'è il dettaglio. Sotto, quando ce n'è uno in corso, lo
 * sconto di stagione con le sue stampe. Le immagini le sceglie lei da
 * /admin/shop/copertine.
 *
 * Si serve su richiesta e non al build: copertine, servizi e stampe li cambia
 * lei da /admin e devono comparire subito.
 */
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [porte, sconti] = await Promise.all([listPorte(), scontiInCorsoConStampe().catch(() => [])]);

  return (
    <div className="shell pt-10 pb-16 md:pt-16 md:pb-24">
      {/* La pagina parla con le immagini; il titolo resta per chi la legge
          con uno screen reader e per i motori di ricerca. */}
      <h1 className="sr-only">Shop</h1>
      <PorteShop porte={porte} />
      <ScontiShop sconti={sconti} />
    </div>
  );
}
