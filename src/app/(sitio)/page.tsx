import Apertura from "@/components/Apertura";
import Works from "@/components/Works";
import { listWorks } from "@/lib/works";
import { site } from "@/data/site";

export const metadata = {
  // `absolute`: il template del layout aggiungerebbe " · Benedetta Zibetti" in
  // coda, e la home direbbe il nome due volte.
  title: { absolute: `${site.name} · ${site.role}` },
  alternates: { canonical: "/" },
};

export default async function Home() {
  const works = await listWorks();

  return (
    <>
      <Apertura />

      {/*
        L'opera comincia nel primo viewport: senza titolo di benvenuto e senza
        anticamera. L'h1 esiste per la struttura del documento e per i lettori
        di schermo, che invece hanno bisogno di sapere dove atterrano.
      */}
      <h1 className="sr-only">
        {`Opere — ${site.signature}, ${site.role.toLowerCase()}. ${works.length} ${
          works.length === 1 ? "lavoro" : "lavori"
        }.`}
      </h1>

      <Works works={works} />
    </>
  );
}
