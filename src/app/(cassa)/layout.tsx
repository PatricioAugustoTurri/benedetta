import Statistiche from "@/components/Statistiche";

/**
 * La cassa, da sola.
 *
 * Fuori da `(sitio)` di proposito: niente menu, niente cinta degli sconti,
 * niente footer con la newsletter. Chi è arrivato qui ha già deciso cosa
 * comprare, e ogni link in più è una strada per non finire. Come una pagina
 * di pagamento: la firma di lei per sapere dov'è, una freccia per tornare al
 * carrello, e nient'altro. Il gruppo fra parentesi non tocca l'indirizzo:
 * resta /carrello/cassa.
 */
export default function CassaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Statistiche />
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
      >
        Vai al contenuto
      </a>
      <main id="contenido" className="flex flex-1 flex-col overflow-x-clip">
        {children}
      </main>
    </>
  );
}
