import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";
import Link from "next/link";
import Stars from "@/components/Stars";
import { illustrations } from "@/data/illustrations";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { illustrationBySlug, LIMITS, listInvites, listReviews } from "@/lib/reviews";
import { deleteInviteAction, deleteReviewAction, logoutAction } from "./actions";
import InviteForm from "./InviteForm";
import LoginForm from "./LoginForm";
import ShareLink from "./ShareLink";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });

async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function AdminPage() {
  await connection(); // siempre en el momento del pedido (lee la cookie y la base)
  if (!adminConfigured()) {
    return (
      <Shell title="Falta configurar el panel">
        <p className="max-w-xl text-ink-soft">
          Definí la variable de entorno <code className="font-mono text-ink">ADMIN_PASSWORD</code> (8
          caracteres o más) en el hosting y volvé a publicar. Está explicado en el README.
        </p>
      </Shell>
    );
  }

  if (!(await isAdmin())) {
    return (
      <Shell title="Panel de reseñas">
        <LoginForm />
      </Shell>
    );
  }

  let invites: Awaited<ReturnType<typeof listInvites>> = [];
  let reviews: Awaited<ReturnType<typeof listReviews>> = [];
  let dbError: string | null = null;
  try {
    [invites, reviews] = await Promise.all([listInvites(), listReviews()]);
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const origin = await requestOrigin();
  const pending = invites.filter((i) => !i.usedBy);
  const works = illustrations.map((i) => ({ slug: i.slug, title: i.title }));
  const titleOf = (slug: string) => illustrationBySlug(slug)?.title ?? slug;

  return (
    <Shell
      title="Panel de reseñas"
      aside={
        <form action={logoutAction}>
          <button type="submit" className="link-underline text-sm text-ink-soft hover:text-ink">
            Salir
          </button>
        </form>
      }
    >
      {dbError && (
        <p role="alert" className="mb-12 border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
          No se pudo leer la base de datos: {dbError}
        </p>
      )}

      <Block title="Nuevo link para un comprador">
        <p className="mb-8 max-w-2xl text-sm text-ink-soft">
          Generá un link por cada obra vendida y mandáselo al comprador cuando le llegue (o
          imprimí el código en una tarjeta dentro del paquete). Cada link sirve para una sola
          reseña, que se publica al instante.
        </p>
        <InviteForm origin={origin} works={works} limits={LIMITS} />
      </Block>

      <Block title={`Links sin usar (${pending.length})`}>
        {pending.length === 0 ? (
          <Empty>No hay links pendientes.</Empty>
        ) : (
          <ul className="divide-y divide-line border-b border-line">
            {pending.map((i) => (
              <li key={i.code} className="grid gap-3 py-5 md:grid-cols-12 md:items-center">
                <div className="md:col-span-5">
                  <p className="font-display tracking-tight">{titleOf(i.slug)}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {[i.buyer, i.note, date(i.createdAt)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="md:col-span-5">
                  <ShareLink
                    compact
                    url={`${origin}/resena/${i.code}`}
                    code={i.code}
                    title={titleOf(i.slug)}
                    buyer={i.buyer}
                  />
                </div>
                <form action={deleteInviteAction} className="md:col-span-2 md:text-right">
                  <input type="hidden" name="code" value={i.code} />
                  <button type="submit" className="link-underline text-sm text-ink-faint hover:text-accent">
                    Anular
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block title={`Reseñas publicadas (${reviews.length})`}>
        {reviews.length === 0 ? (
          <Empty>Todavía no hay reseñas.</Empty>
        ) : (
          <ul className="divide-y divide-line border-b border-line">
            {reviews.map((r) => {
              const invite = invites.find((i) => i.code === r.code);
              return (
                <li key={r.id} className="grid gap-3 py-6 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <Stars value={r.rating} className="text-sm" />
                    <p className="mt-2 font-display tracking-tight">{titleOf(r.slug)}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {[r.name, invite?.note, date(r.createdAt)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <p className="whitespace-pre-line text-ink-soft md:col-span-7">{r.comment}</p>
                  <form action={deleteReviewAction} className="md:col-span-2 md:text-right">
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" className="link-underline text-sm text-ink-faint hover:text-accent">
                      Borrar
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Block>

      <p className="mt-16 text-xs text-ink-faint">
        <Link href="/" className="link-underline">
          Volver al sitio
        </Link>
      </p>
    </Shell>
  );
}

function Shell({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="shell pt-16 pb-8 md:pt-24">
      <div className="flex items-baseline justify-between gap-6">
        <div>
          <p className="eyebrow">Privado</p>
          <h1 className="mt-5 font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] tracking-[-0.02em]">
            {title}
          </h1>
        </div>
        {aside}
      </div>
      <div className="mt-14">{children}</div>
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-20">
      <h2 className="eyebrow mb-6 border-b border-line pb-5">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-ink-faint">{children}</p>;
}
