import type { Metadata } from "next";
import { isAuthenticated } from "@/lib/auth";
import AdminBar from "./components/AdminBar";

export const metadata: Metadata = {
  title: "Archivio",
  // Che non lo indicizzi nessuno. È una schermata di lavoro, non una pagina.
  robots: { index: false, follow: false },
};

/*
  L'admin si serve sempre fresco. Senza questo, la griglia potrebbe arrivare da
  una risposta in cache e lei caricherebbe un'opera per ritrovarsi l'archivio
  di poco fa: in una schermata di modifica, vedere quello che c'era prima del
  tuo ultimo cambiamento è un errore, non un'ottimizzazione.
*/
export const dynamic = "force-dynamic";

/**
 * La cornice dell'admin.
 *
 * Non porta l'header né il footer del sito —quelli vivono in `(sitio)`— perché
 * qui non si naviga un portfolio, ci si lavora sopra. L'unica cosa fissa in
 * alto è la barra, e solo quando c'è una sessione: nella schermata di accesso
 * non c'è ancora niente da raccontare.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const conSesion = await isAuthenticated();

  return (
    <>
      {conSesion && <AdminBar />}
      <main className="flex-1">{children}</main>
    </>
  );
}
