import type { Metadata } from "next";
import ContactClose from "@/components/ContactClose";
import StudioIntro from "./components/StudioIntro";
import StudioOpening from "./components/StudioOpening";
import StudioServices from "./components/StudioServices";
import { openGraphPagina } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About me — illustratrice a Foligno",
  // È il testo che Google mostra sotto il titolo: dice chi è e cosa fa con
  // le parole della sua bio, invece di un «chi sono» che non nomina nessuno.
  description:
    "Sono Benedetta Zibetti, illustratrice freelance a Foligno, in Umbria. Ho studiato al NID di Perugia e realizzo illustrazioni personalizzate, ritratti e packaging.",
  alternates: { canonical: "/studio" },
  openGraph: openGraphPagina({ path: "/studio" }),
};

export default function StudioPage() {
  return (
    <>
      <StudioOpening />
      <StudioIntro />
      <StudioServices />
      <ContactClose cta="Scrivimi">Hai un progetto in mente?</ContactClose>
    </>
  );
}
