import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getInviteStatus, illustrationBySlug, LIMITS } from "@/lib/reviews";
import ReviewForm from "../ReviewForm";

export const metadata: Metadata = {
  title: "Dejá tu reseña",
  robots: { index: false, follow: false },
};

export default async function ResenaPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  let status: Awaited<ReturnType<typeof getInviteStatus>>;
  try {
    status = await getInviteStatus(code);
  } catch (err) {
    console.error("[reseñas]", err);
    return (
      <Message title="Ahora no podemos cargar tu reseña.">
        Probá de nuevo en un rato. Si sigue sin andar, escribime y lo resolvemos.
      </Message>
    );
  }

  if (status.state === "invalid") {
    return (
      <Message title="Este link no es válido.">
        Revisá que esté completo o probá{" "}
        <Link href="/resena" className="link-underline text-ink">
          tipear el código a mano
        </Link>
        .
      </Message>
    );
  }

  if (status.state === "used") {
    return (
      <Message title="Ya dejaste tu reseña. ¡Gracias!">
        Cada link sirve para una sola reseña.{" "}
        <Link href="/ilustraciones" className="link-underline text-ink">
          Ver ilustraciones
        </Link>
      </Message>
    );
  }

  const work = illustrationBySlug(status.invite.slug)!;

  return (
    <section className="shell pt-16 pb-8 md:pt-24">
      <div className="grid gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-4">
          <div className="bg-paper-deep">
            <Image
              src={work.src}
              alt={work.alt}
              width={work.width}
              height={work.height}
              sizes="(max-width: 768px) 100vw, 30vw"
              priority
              className="w-full"
            />
          </div>
          <p className="mt-3 font-display text-base tracking-tight">{work.title}</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {work.medium} · {work.year}
          </p>
        </div>

        <div className="md:col-span-7 md:col-start-6">
          <p className="eyebrow">Reseña</p>
          <h1 className="mt-5 font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] tracking-[-0.02em]">
            {status.invite.buyer ? `¡Hola, ${status.invite.buyer}!` : "¡Gracias por tu compra!"}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Contame qué te pareció <span className="italic">{work.title}</span>. Tu opinión se
            publica en el sitio junto a la obra. No hace falta crear ninguna cuenta.
          </p>

          <div className="mt-12">
            <ReviewForm code={status.invite.code} defaultName={status.invite.buyer} limits={LIMITS} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="shell flex min-h-[60vh] flex-col justify-center py-24">
      <p className="eyebrow">Reseña</p>
      <h1 className="mt-5 max-w-2xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] tracking-[-0.02em]">
        {title}
      </h1>
      <p className="mt-6 max-w-md text-ink-soft">{children}</p>
    </section>
  );
}
