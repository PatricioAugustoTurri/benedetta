"use client";

import { useState } from "react";
import { MINIMO_SCONTI } from "@/data/shop";
import { site } from "@/data/site";
import { scaricaBiglietto, type DatiBiglietto } from "@/lib/bigliettoPdf";

const SITO = new URL(site.url).host;
/** La ragazza con la stella dell'apertura del sito, disegnata a linea. */
const LAMINA = "/biglietto-ragazza.png";
const INSTAGRAM = (() => {
  const ig = site.socials.find((s) => s.label === "Instagram");
  const nome = ig?.href.match(/instagram\.com\/([^/?#]+)/)?.[1];
  return nome ? `@${nome}` : undefined;
})();

/**
 * «Scarica il biglietto»: il PDF da stampare e mettere nel pacco, con i dati
 * che ha davanti in quel momento. Si disegna nel browser, e ci mette un
 * attimo: il bottone lo dice mentre lavora.
 */
export default function ScaricaBiglietto({
  dati,
  disabilitato = false,
  className = "",
}: {
  dati: Omit<DatiBiglietto, "sito" | "instagram" | "minimo">;
  disabilitato?: boolean;
  className?: string;
}) {
  const [stato, setStato] = useState<"fermo" | "lavora" | "errore">("fermo");

  async function scarica() {
    setStato("lavora");
    try {
      await scaricaBiglietto({ ...dati, minimo: MINIMO_SCONTI, sito: SITO, instagram: INSTAGRAM }, "/benedetta-zibetti-wordmark.png", LAMINA);
      setStato("fermo");
    } catch (e) {
      console.error(e);
      setStato("errore");
    }
  }

  return (
    <span className={`inline-flex items-baseline gap-3 ${className}`}>
      <button
        type="button"
        onClick={scarica}
        disabled={disabilitato || stato === "lavora"}
        className="area-tocco link-underline whitespace-nowrap text-ink transition-colors hover:text-accent disabled:cursor-not-allowed disabled:text-ink-faint disabled:no-underline"
      >
        {stato === "lavora" ? "Preparo il PDF…" : "Scarica il biglietto"}
      </button>
      {stato === "errore" && (
        <span role="alert" className="text-accent">
          Il PDF non è venuto. Riprova.
        </span>
      )}
    </span>
  );
}
