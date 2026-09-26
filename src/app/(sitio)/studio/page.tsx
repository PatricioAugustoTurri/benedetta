import type { Metadata } from "next";
import ContactClose from "@/components/ContactClose";
import StudioIntro from "./components/StudioIntro";
import StudioOpening from "./components/StudioOpening";
import StudioServices from "./components/StudioServices";

export const metadata: Metadata = {
  title: "About me",
  description: "Chi sono e come lavoro.",
  alternates: { canonical: "/studio" },
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
