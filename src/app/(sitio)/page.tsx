import Works from "@/components/Works";
import { listWorks } from "@/lib/works";
import { site } from "@/data/site";

export const metadata = {
  title: `${site.name} · ${site.role}`,
};

export default async function Home() {
  const works = await listWorks();

  return (
    <>
      {/*
        La obra arranca en el primer viewport: sin titular de bienvenida y sin
        antesala. El h1 existe para la estructura del documento y para los
        lectores de pantalla, que sí necesitan saber dónde caen.
      */}
      <h1 className="sr-only">
        {`Opere — ${site.author}, ${site.role.toLowerCase()}. ${works.length} ${
          works.length === 1 ? "lavoro" : "lavori"
        }.`}
      </h1>

      <Works works={works} />
    </>
  );
}
