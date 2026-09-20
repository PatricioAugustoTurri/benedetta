import Reveal from "@/components/Reveal";
import { clientes } from "@/data/studio";

/**
 * Con quién trabajó.
 *
 * PLACEHOLDER — y el de mayor riesgo del sitio: ninguno de estos clientes
 * existe, se inventaron para la maqueta. Es el sitio de una persona real que
 * le va a mandar el link a editores reales. Ver PRODUCT.md.
 */
export default function StudioClients() {
  return (
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
  );
}
