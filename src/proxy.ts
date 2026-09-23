import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

/**
 * La porta di /admin.
 *
 * In Next.js 16 questo si chiama `proxy` e non più `middleware`; il file sta
 * accanto ad `app/` e ce ne può essere uno solo.
 *
 * **Qui non si verifica la sessione, si guarda se ce n'è una.** La
 * documentazione è esplicita: il proxy serve per controlli ottimistici, non
 * per l'autorizzazione. Gira prima della pagina, senza accesso all'ambiente
 * completo, e verificare la firma qui obbligherebbe a mettere la password su
 * questo bordo.
 *
 * Quello che fa è evitare lo sfarfallio: senza, chi non ha una sessione
 * vedrebbe caricare l'admin per un istante prima che la pagina lo cacci. La
 * decisione vera la prendono la pagina, che controlla la firma, e ogni Server
 * Action, che la ricontrolla perché la si può invocare con un POST diretto
 * senza passare da nessuna pagina.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // La schermata di accesso resta fuori, altrimenti non ci si potrebbe mai
  // arrivare.
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  if (!request.cookies.has(SESSION_COOKIE)) {
    const login = new URL("/admin/login", request.url);
    // Da dove veniva, per riportarcelo dopo l'accesso invece di lasciarlo
    // sempre sulla home dell'admin.
    if (pathname !== "/admin") login.searchParams.set("desde", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
