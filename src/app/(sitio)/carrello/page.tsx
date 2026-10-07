import type { Metadata } from "next";
import CarrelloVista from "@/components/carrello/CarrelloVista";
import Reveal from "@/components/Reveal";
import { stripeInProva, tariffeSpedizione } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Carrello",
  // Un carrello è di chi lo guarda: niente da indicizzare.
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default function CarrelloPage() {
  return (
    <section className="shell pt-12 pb-8 md:pt-20">
      <Reveal>
        <h1 className="display-h1 text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1]">Carrello</h1>
      </Reveal>
      <div className="mt-10 md:mt-14">
        <CarrelloVista tariffe={tariffeSpedizione()} inProva={stripeInProva()} />
      </div>
    </section>
  );
}
