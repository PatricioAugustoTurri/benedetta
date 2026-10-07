import type { Metadata } from "next";
import Link from "next/link";
import SvuotaCarrello from "@/components/carrello/SvuotaCarrello";
import { ArrowRight } from "@/components/Icon";
import Reveal from "@/components/Reveal";
import { site } from "@/data/site";
import { stripe, stripeConfigurato } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Grazie",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Dove riporta Stripe dopo il pagamento.
 *
 * La pagina non si fida dell'indirizzo: chiunque può scrivere
 * /carrello/grazie a mano. Chiede a Stripe la sessione e solo se risulta
 * pagata ringrazia e svuota il carrello. L'ordine non lo scrive questa pagina
 * ma il webhook, che arriva anche se chi ha pagato chiude la scheda prima di
 * tornare qui.
 */
export default async function GraziePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let email: string | null = null;
  let pagato = false;
  if (session_id && stripeConfigurato()) {
    try {
      const s = await stripe().checkout.sessions.retrieve(session_id);
      pagato = s.payment_status === "paid" || s.payment_status === "no_payment_required";
      email = s.customer_details?.email ?? null;
    } catch {
      pagato = false;
    }
  }

  return (
    <section className="shell flex min-h-[52vh] flex-col justify-center pt-12 pb-8 md:pt-20">
      {pagato ? (
        <>
          <SvuotaCarrello />
          <Reveal>
            <h1 className="display-h1 max-w-[20ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
              Grazie, l&apos;ordine è arrivato.
            </h1>
          </Reveal>
          <Reveal delay={90}>
            <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft">
              Il pagamento è andato a buon fine.
              {email && (
                <>
                  {" "}
                  Ti arriva una conferma a <span className="break-all text-ink">{email}</span>.
                </>
              )}{" "}
              Per qualsiasi domanda, scrivimi a{" "}
              <a href={`mailto:${site.email}`} className="link-underline text-ink">
                {site.email}
              </a>
              .
            </p>
          </Reveal>
        </>
      ) : (
        <>
          <h1 className="display-h1 text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1]">
            Non trovo questo pagamento.
          </h1>
          <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft">
            Se hai appena pagato e vedi questa pagina, scrivimi a{" "}
            <a href={`mailto:${site.email}`} className="link-underline text-ink">
              {site.email}
            </a>{" "}
            e controllo io. Il carrello è rimasto com&apos;era.
          </p>
        </>
      )}

      <Link
        href="/shop"
        className="group mt-10 inline-flex items-center gap-1.5 self-start text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <span className="link-underline">Torna allo Shop</span>
        <ArrowRight size={16} className="shrink-0" />
      </Link>
    </section>
  );
}
