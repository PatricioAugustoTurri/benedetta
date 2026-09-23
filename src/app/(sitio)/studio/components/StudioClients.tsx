import Reveal from "@/components/Reveal";
import { clientes } from "@/data/studio";

/**
 * Con chi ha lavorato.
 *
 * PLACEHOLDER — e quello a rischio più alto del sito: nessuno di questi
 * clienti esiste, sono stati inventati per la bozza. È il sito di una persona
 * vera che manderà il link a editori veri. Vedi PRODUCT.md.
 */
export default function StudioClients() {
  return (
    <section className="shell mt-24" aria-labelledby="clienti">
      <Reveal>
        <h2 id="clienti" className="label border-b border-line pb-4">
          Ho lavorato con
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
