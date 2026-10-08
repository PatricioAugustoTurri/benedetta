import { isAuthenticated } from "@/lib/auth";
import { anteprimaNewsletter } from "@/lib/correo";
import { listNovita } from "@/lib/newsletter";
import { vociNewsletter } from "@/lib/newsletterVoci";
import { origine } from "@/lib/origine";

/**
 * L'anteprima della newsletter: la mail esatta che riceverà una persona, con
 * le novità spuntate e il messaggio scritto nel modulo in quel momento. Il
 * modulo ci arriva con «Anteprima», che apre una scheda nuova.
 *
 * Il saluto usa un nome d'esempio, «Giulia», perché si veda dove va il nome.
 */
export async function GET(req: Request) {
  if (!(await isAuthenticated())) return new Response("Accedi di nuovo.", { status: 401 });

  const q = new URL(req.url).searchParams;
  const ids = (k: string) => new Set(q.getAll(k).map(Number).filter((n) => Number.isInteger(n)));
  const scelteOpere = ids("opera");
  const scelteStampe = ids("stampa");

  const novita = await listNovita();
  const voci = vociNewsletter(
    novita.opere.filter((w) => scelteOpere.has(w.id)),
    novita.stampe.filter((p) => scelteStampe.has(p.id)),
    await origine(),
  );

  const html = anteprimaNewsletter(
    {
      oggetto: q.get("oggetto") ?? "",
      testo: (q.get("testo") ?? "").trim().slice(0, 3000) || null,
      voci,
    },
    "Giulia",
  );
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}
