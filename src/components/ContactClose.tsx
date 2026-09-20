import Link from "next/link";
import Reveal from "@/components/Reveal";

/**
 * Cierre de página: la invitación a escribir, en la voz de la obra.
 * No lleva rótulo encima — el titular se sostiene solo.
 */
export default function ContactClose({
  children,
  href = "/contatti",
  cta = "Escribime",
}: {
  children: React.ReactNode;
  href?: string;
  cta?: string;
}) {
  return (
    <section className="shell mt-24 md:mt-32">
      <Reveal>
        <div className="border-t border-line pt-12 md:pt-14">
          <p className="display-lead prose-measure font-display text-[clamp(1.75rem,3.6vw,2.75rem)] leading-[1.15] text-balance">
            {children}
          </p>
          <Link
            href={href}
            className="link-underline mt-8 inline-block text-sm"
            data-active="true"
          >
            {cta}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
