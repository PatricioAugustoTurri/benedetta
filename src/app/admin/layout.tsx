import type { Metadata } from "next";
import { isAuthenticated } from "@/lib/auth";
import AdminBar from "./components/AdminBar";

export const metadata: Metadata = {
  title: "Archivio",
  // Que no lo indexe nadie. Es una pantalla de trabajo, no una página.
  robots: { index: false, follow: false },
};

/*
  El admin se sirve siempre fresco. Sin esto, la grilla podría venir de una
  respuesta guardada y ella cargaría una obra para encontrarse con el archivo
  de hace un rato: en una pantalla de edición, ver lo que había antes de tu
  último cambio es un error, no una optimización.
*/
export const dynamic = "force-dynamic";

/**
 * El marco del admin.
 *
 * No trae la cabecera ni el pie del sitio —ésos viven en `(sitio)`— porque
 * acá no se navega un portfolio, se trabaja sobre él. Lo único fijo arriba es
 * la barra, y sólo cuando hay sesión: en la pantalla de acceso no hay nada
 * que contar todavía.
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
