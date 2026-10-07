import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { getShopCategory, shopSubject } from "@/data/shop";
import { getServizio } from "@/lib/servizi";
import { getWork } from "@/lib/works";
import Reveal from "@/components/Reveal";
import ContactAside from "./components/ContactAside";
import ContactIntro from "./components/ContactIntro";
import ContactNote from "./components/ContactNote";

export const metadata: Metadata = {
  title: "Contatti",
  description: "Commissioni, collaborazioni e richieste di stampe.",
  // Il canonical resta la pagina pulita anche quando arriva `?opera=<slug>`,
  // `?shop=<slug>` o `?servizio=<slug>`:
  // quel parametro precompila l'oggetto, non cambia cosa mostra la pagina.
  alternates: { canonical: "/contatti" },
};

/**
 * `?opera=<slug>` è quello che lascia «Chiedi info» quando porta qualcuno da
 * un'opera, e l'unica cosa che fa è precompilare l'oggetto.
 *
 * **Viaggia lo slug e non il titolo.** Con il titolo nell'URL, l'oggetto del
 * modulo sarebbe testo che chiunque può scrivere nella barra degli indirizzi:
 * nessuno ci si rompe, ma un link costruito a mano potrebbe mettere qualsiasi
 * cosa nel campo e farla passare per il nome di un'opera. Con lo slug, il
 * titolo lo cerca il server nella tabella, quindi è sempre quello che ha
 * caricato lei, e resta corretto anche se ha rinominato l'opera dopo che
 * qualcuno aveva salvato il link.
 *
 * Uno slug che non esiste più non rompe niente: non c'è opera, non c'è
 * oggetto, e il modulo esce vuoto come se si fosse entrati dal menu.
 *
 * `?servizio=<slug>` è «Chiedi info» su Ritratti Illustrati o Illustrazioni
 * Personalizzate, e funziona come quello di un'opera: lo slug viaggia, il
 * nome lo cerca il server.
 *
 * `?shop=<slug>` è lo stesso gesto per le categorie del negozio, con la
 * stessa regola: viaggia lo slug, e l'oggetto lo scrive il server a partire
 * da `src/data/shop.ts`. Non tocca il database, perché le categorie vivono
 * nel codice.
 *
 * Senza il parametro il database non si tocca. La pagina si serve su
 * richiesta perché guarda `searchParams`, ma chi entra dal menu non paga una
 * query.
 */
export default async function ContattiPage({
  searchParams,
}: {
  searchParams: Promise<{ opera?: string; shop?: string; servizio?: string }>;
}) {
  const { opera, shop, servizio } = await searchParams;
  const obra = opera ? await getWork(opera) : null;
  // «Chiedi info» su un servizio: l'oggetto è il nome del servizio, preso
  // dalla tabella e non dall'indirizzo.
  const lavoro = !obra && servizio ? await getServizio(servizio) : null;
  const categoria = !obra && !lavoro && shop ? getShopCategory(shop) : null;
  const asunto =
    obra?.title ?? lavoro?.title ?? (categoria ? shopSubject(categoria) : undefined);

  return (
    <section className="shell pt-12 pb-8 md:pt-20">
      {/* Misura di 7 colonne e barra laterale sulla 9: la cornice che
          condividono Contatti e About me. */}
      <div className="grid gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7">
          <ContactIntro />
          <Reveal delay={170}>
            <ContactForm asuntoInicial={asunto} opera={obra?.slug} />
          </Reveal>
          <ContactNote conOggetto={asunto !== undefined} />
        </div>

        <ContactAside />
      </div>
    </section>
  );
}
