import type { Metadata } from "next";
import ContactClose from "@/components/ContactClose";
import StudioClients from "./components/StudioClients";
import StudioIntro from "./components/StudioIntro";
import StudioOpening from "./components/StudioOpening";
import StudioServices from "./components/StudioServices";

export const metadata: Metadata = {
  title: "About me",
  description: "Chi sono, come lavoro e con chi ho lavorato.",
};

export default function StudioPage() {
  return (
    <>
      <StudioOpening />
      <StudioIntro />
      <StudioServices />
      <StudioClients />
      <ContactClose cta="Scrivimi">Hai un progetto in mente?</ContactClose>
    </>
  );
}
