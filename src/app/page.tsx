import Works from "@/components/Works";
import { illustrations } from "@/data/illustrations";
import { site } from "@/data/site";

export const metadata = {
  title: `${site.name} · ${site.role}`,
};

export default function Home() {
  return (
    <>
      {/*
        La obra arranca en el primer viewport: sin titular de bienvenida y sin
        antesala. El h1 existe para la estructura del documento y para los
        lectores de pantalla, que sí necesitan saber dónde caen.
      */}
      <h1 className="sr-only">
        {`Opere — ${site.author}, ${site.role.toLowerCase()}. ${illustrations.length} lavori.`}
      </h1>

      <Works />
    </>
  );
}
