import Reveal from "@/components/Reveal";
import type { Work } from "@/lib/works";
import WorkAside from "./WorkAside";

/**
 * Quello che si legge sotto le tavole: il testo dell'opera a sinistra, la
 * scheda e il «Chiedi info» nella colonna laterale.
 *
 * Il titolo non è più qui: è salito all'inizio della pagina, prima delle
 * tavole. Quello che resta è contesto di qualcosa che il visitatore ha già
 * visto, che è esattamente l'ordine in cui si è voluta lasciare la pagina.
 *
 * La sezione è padrona della sua griglia e si porta la colonna laterale
 * dentro, come la presentazione di About me.
 */
export default function WorkDetails({ work }: { work: Work }) {
  return (
    <div className="mt-10 grid gap-10 md:mt-14 md:grid-cols-12 md:gap-8">
      {/*
        La colonna del testo non si disegna se non c'è testo. Prima aveva
        sempre qualcosa —il titolo— quindi il caso non esisteva; adesso
        un'opera caricata senza descrizione, che è uno stato che l'admin
        ammette e segnala, lascerebbe qui sette colonne in bianco e, sul
        telefono, un buco di 2.5rem prima della scheda. La colonna laterale non
        si muove: il suo posto lo fissa `col-start-9`, non la presenza del
        vicino.
      */}
      {work.description && (
        <div className="md:col-span-7">
          <Reveal>
            <p className="prose-measure text-lg leading-relaxed text-ink-soft">
              {work.description}
            </p>
          </Reveal>
        </div>
      )}

      <WorkAside work={work} />
    </div>
  );
}
