import StudioFilm from "@/components/StudioFilm";

/**
 * Il filmato che apre la pagina, come tavola sul foglio: gli stessi margini di
 * un'opera dell'archivio, così si legge come un altro pezzo del suo lavoro e
 * non come la copertina di qualcos'altro.
 *
 * Senza `Reveal`, a differenza del resto della pagina. L'apparizione
 * all'entrata in schermo è per quello che arriva con lo scroll; questo è già
 * lì quando si apre la pagina, e farlo apparire sarebbe inventare un arrivo a
 * qualcosa che non viaggia.
 */
export default function StudioOpening() {
  return (
    <section className="shell pt-8 md:pt-10">
      <StudioFilm priority className="aspect-[16/9] w-full" />
    </section>
  );
}
