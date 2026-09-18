import type { Metadata } from "next";
import Image from "next/image";
import ContactClose from "@/components/ContactClose";
import Reveal from "@/components/Reveal";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Studio",
  description: "Quién soy, cómo trabajo y con quién trabajé.",
};

// PLACEHOLDER: los tres servicios y la lista de clientes son de relleno.
const servicios = [
  {
    title: "Editorial",
    body: "Ilustración para notas, tapas y suplementos. Entrego en los formatos y plazos que pide la redacción.",
  },
  {
    title: "Libro infantil",
    body: "Desarrollo de personajes, storyboard y arte final para libro álbum, en diálogo con autores y editores.",
  },
  {
    title: "Series botánicas",
    body: "Láminas y herbarios por encargo, en acuarela o lápiz de color, con opción de impresión fine art.",
  },
];

const clientes = [
  "Revista Campo",
  "Ediciones Sur",
  "La Nube",
  "Cuadernos del Este",
  "Estudio Pampa",
  "Fundación Raíz",
];

export default function StudioPage() {
  return (
    <>
      <section className="shell pt-12 pb-12 md:pt-20">
        <div className="grid gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <Reveal>
              {/* Retrato: proporción fija para que no salte al cargar. */}
              <Image
                src="/retrato.svg"
                alt="Retrato de la ilustradora en su taller."
                width={800}
                height={1000}
                sizes="(max-width: 768px) 100vw, 40vw"
                priority
                className="w-full bg-paper-deep"
              />
            </Reveal>
          </div>

          <div className="md:col-span-7">
            <Reveal delay={80}>
              <h1 className="display-lead font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] tracking-[-0.02em] text-balance">
                Hola, soy {site.author}.
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <div className="prose-measure mt-8 space-y-5 text-lg leading-relaxed text-ink-soft">
                <p>
                  Ilustro desde {site.location}. Estudié diseño y pasé de las tipografías a los
                  pinceles sin mirar atrás: hoy la mayor parte de lo que hago empieza en papel,
                  con acuarela y lápiz, y sólo pasa a digital cuando el encargo lo pide.
                </p>
                <p>
                  Me interesa el detalle chico —la nervadura de una hoja, el gesto de una mano— y
                  el silencio alrededor. Trabajo mejor cuando hay espacio para probar, así que
                  suelo arrancar con bocetos rápidos antes de comprometerme con una dirección.
                </p>
                <p>
                  Mis trabajos aparecieron en revistas, libro álbum y colecciones privadas.
                  Si querés ver el proceso más de cerca, lo comparto seguido en Instagram.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="shell mt-16" aria-labelledby="servizi">
        <Reveal>
          <h2 id="servizi" className="label border-b border-line pb-4">
            Cómo trabajo
          </h2>
        </Reveal>
        <dl className="mt-10 grid gap-10 md:grid-cols-3 md:gap-12">
          {servicios.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <dt className="font-display text-xl tracking-tight">{s.title}</dt>
              <dd className="mt-3 text-ink-soft">{s.body}</dd>
            </Reveal>
          ))}
        </dl>
      </section>

      <section className="shell mt-24" aria-labelledby="clienti">
        <Reveal>
          <h2 id="clienti" className="label border-b border-line pb-4">
            Trabajé con
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-y-4 md:grid-cols-3">
            {clientes.map((c) => (
              <li key={c} className="text-ink-soft">
                {c}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <ContactClose cta="Escribime">¿Tenés un proyecto en mente?</ContactClose>
    </>
  );
}
