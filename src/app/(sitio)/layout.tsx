import Header from "@/components/Header";
import Footer from "@/components/Footer";

/**
 * Il sito pubblico: tutto quello che vede un visitatore.
 *
 * Esiste separato dal layout radice da quando è entrato `/admin`. L'admin vive
 * nello stesso albero e non vuole né header né footer —un menu con Works,
 * About me e Contatti sopra una schermata di caricamento è rumore, e il footer
 * con l'iscrizione alla newsletter è proprio un'altra conversazione—. Il
 * gruppo fra parentesi non tocca nessun URL: `(sitio)/page.tsx` resta `/`.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
      >
        Vai al contenuto
      </a>
      <Header />
      {/*
        Il sito non si sposta di lato. Qui niente si legge in orizzontale,
        quindi uno sbordo orizzontale non è mai contenuto: è l'avanzo di
        qualcosa che si è mosso —un pezzo che entra dalla sua colonna, un
        filetto di troppo— e lascia la pagina trascinabile di un paio di
        centimetri. Su desktop quasi non si nota; sul telefono si sente come
        un sito mal fatto.

        Va qui e non su `html` né su `body`: l'overflow di quei due si propaga
        al viewport, e lì `clip` viene ignorato. Misurato, non supposto.
        `main` è un elemento comune, quindi taglia davvero, e copre tutto
        quello che disegna una pagina senza toccare l'header né i livelli
        fissi, che sono suoi fratelli.

        `clip` e non `hidden`: `hidden` farebbe di questo un contenitore di
        scroll —addio `position: sticky` a quello che ci vive dentro— mentre
        `clip` taglia senza crearlo. La coppia verticale resta su `visible` e
        la pagina continua a scorrere normalmente.
      */}
      <main id="contenido" className="flex-1 overflow-x-clip">
        {children}
      </main>
      <Footer />
    </>
  );
}
