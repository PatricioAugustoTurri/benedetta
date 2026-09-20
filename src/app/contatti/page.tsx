import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import Reveal from "@/components/Reveal";
import ContactAside from "./components/ContactAside";
import ContactIntro from "./components/ContactIntro";
import ContactNote from "./components/ContactNote";

export const metadata: Metadata = {
  title: "Contatti",
  description: "Encargos, colaboraciones y consultas por impresiones.",
};

export default function ContattiPage() {
  return (
    <section className="shell pt-12 pb-8 md:pt-20">
      {/* Medida de 7 columnas y lateral en la 9: el marco que comparten
          Contatti, Shop y About me. */}
      <div className="grid gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7">
          <ContactIntro />
          <Reveal delay={170}>
            <ContactForm />
          </Reveal>
          <ContactNote />
        </div>

        <ContactAside />
      </div>
    </section>
  );
}
