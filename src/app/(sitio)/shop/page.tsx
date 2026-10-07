import type { Metadata } from "next";
import { getShopCategory } from "@/data/shop";
import { listPubblicati } from "@/lib/prodotti";
import { listServizi } from "@/lib/servizi";
import ServiziInBreve from "./components/ServiziInBreve";
import SezioneCategoria from "./components/SezioneCategoria";
import ShopAside from "./components/ShopAside";
import ShopIntro from "./components/ShopIntro";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Stampe da comprare online e ritratti e illustrazioni personalizzate su richiesta.",
  alternates: { canonical: "/shop" },
};

/**
 * Lo Shop intero: l'ingresso, poi i due lavori su commissione —due porte, non
 * una lista— e poi le stampe, che sono il negozio vero e proprio.
 *
 * Si serve su richiesta e non al build: i prodotti li carica lei da /admin e
 * devono comparire appena li pubblica. Le azioni dell'admin rivalidano
 * comunque questo percorso.
 */
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [servizi, stampe] = await Promise.all([listServizi(), listPubblicati("stampe")]);
  const categoriaStampe = getShopCategory("stampe")!;

  return (
    <div className="shell pt-12 pb-8 md:pt-20">
      {/* La cornice di Contatti e About me: misura di 7 colonne e barra
          laterale sulla 9. */}
      <div className="grid gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7">
          <ShopIntro />
        </div>
        <ShopAside />
      </div>

      <div className="mt-16 space-y-20 md:mt-24 md:space-y-28">
        <ServiziInBreve servizi={servizi} />
        <SezioneCategoria categoria={categoriaStampe} prodotti={stampe} conLink eager={0} />
      </div>
    </div>
  );
}
