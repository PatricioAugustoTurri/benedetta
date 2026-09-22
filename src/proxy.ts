import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

/**
 * La puerta de /admin.
 *
 * En Next.js 16 esto se llama `proxy` y ya no `middleware`; el archivo va al
 * lado de `app/` y sólo puede haber uno.
 *
 * **Acá no se verifica la sesión, se mira si hay una.** La documentación es
 * explícita: el proxy sirve para comprobaciones optimistas, no para
 * autorización. Corre antes que la página, sin acceso al entorno completo, y
 * verificar la firma acá obligaría a meter la clave en este borde.
 *
 * Lo que hace es evitar el parpadeo: sin esto, quien no tiene sesión vería
 * cargar el admin un instante antes de que la página lo eche. La decisión de
 * verdad la toman la página, que comprueba la firma, y cada Server Action,
 * que la vuelve a comprobar porque se la puede invocar con un POST directo
 * sin pasar por ninguna página.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // La pantalla de acceso queda afuera, o no se podría llegar nunca a ella.
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  if (!request.cookies.has(SESSION_COOKIE)) {
    const login = new URL("/admin/login", request.url);
    // De dónde venía, para devolverlo ahí después de entrar en vez de
    // dejarlo siempre en la portada del admin.
    if (pathname !== "/admin") login.searchParams.set("desde", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
