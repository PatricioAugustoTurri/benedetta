import Link from "next/link";
import { Pencil, Plus } from "@/components/Icon";
import { cloudinaryConfigurado } from "@/lib/cloudinary";
import { listProdotti } from "@/lib/prodotti";
import { listServizi, type Servizio } from "@/lib/servizi";
import { contarPezzi, immagineFerma } from "@/lib/video";
import { pingDb } from "@/lib/works";
import RigaProdotto from "../components/RigaProdotto";

export const metadata = { title: "Shop" };

/**
 * Lo Shop, con le mani dentro. Due parti che si comportano in modo diverso, e
 * la pagina lo dice con la forma:
 *
 * - **Su commissione**: i due servizi. Sono sempre due, quindi non c'è
 *   «nuovo», né cestino, né frecce: solo una riga ciascuno che porta a
 *   modificarli.
 * - **Stampe**: la lista che cresce. Si aggiungono, si ordinano con le frecce
 *   e si cancellano.
 */
export default async function AdminShopPage() {
  if (!(await pingDb())) {
    return (
      <section className="shell py-24">
        <h1 className="display-lead font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.15]">
          Il database non risponde.
        </h1>
      </section>
    );
  }

  const [servizi, stampe] = await Promise.all([listServizi(), listProdotti()]);
  const conCloudinary = cloudinaryConfigurado();

  return (
    <section className="shell pt-8 pb-16 md:pt-12">
      {!conCloudinary && (
        <p className="mb-8 border-l border-accent bg-paper-deep/60 py-2 pl-3 text-sm text-accent">
          Mancano le chiavi di Cloudinary: senza, non si possono caricare immagini.
        </p>
      )}

      <div className="grid gap-16 md:grid-cols-12">
        <div className="space-y-16 md:col-span-8">
          <section aria-labelledby="adm-servizi">
            <div className="flex items-baseline justify-between gap-6">
              <h2 id="adm-servizi" className="display-section font-display text-xl leading-tight">
                Su commissione
              </h2>
              <span className="text-xs text-ink-faint">Due servizi, sempre quelli</span>
            </div>
            <ul className="mt-4 border-t border-line">
              {servizi.map((s) => (
                <RigaServizio key={s.slug} servizio={s} />
              ))}
            </ul>
          </section>

          <section aria-labelledby="adm-stampe">
            <div className="flex items-baseline justify-between gap-6">
              <h2 id="adm-stampe" className="display-section font-display text-xl leading-tight">
                Stampe
              </h2>
              <span className="figures text-xs text-ink-faint">
                {stampe.length} {stampe.length === 1 ? "stampa" : "stampe"}
              </span>
            </div>

            <ul className="mt-4 border-t border-line">
              {stampe.map((p, i) => (
                <RigaProdotto key={p.id} prodotto={p} primo={i === 0} ultimo={i === stampe.length - 1} />
              ))}
            </ul>

            {/*
              L'aggiunta è la casella tratteggiata dell'archivio, distesa in
              una riga: lo stesso segno per «qui ne entra un'altra». Solo qui:
              i servizi non si aggiungono.
            */}
            <Link
              href="/admin/shop/nuovo"
              className="mt-4 flex w-full items-center justify-center gap-2 border border-dashed border-line bg-paper-deep/40 py-4 text-ink-faint transition-colors hover:border-accent/50 hover:bg-paper-deep/70 hover:text-ink-soft"
            >
              <Plus size={16} />
              <span className="label">Nuova stampa</span>
            </Link>
          </section>
        </div>

        <aside className="md:col-span-3 md:col-start-10">
          <h2 className="label">Come funziona</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
            <li>
              Illustrazioni e ritratti sono due servizi: non hanno prezzo e portano al modulo di
              contatto. Ne cambi il testo e le immagini quando vuoi rinnovarli.
            </li>
            <li>Le stampe hanno formati e prezzi e vanno nel carrello.</li>
            <li>Una stampa nuova nasce come bozza: nel sito non esce finché non la pubblichi.</li>
            <li>Le frecce cambiano l&apos;ordine in cui escono le stampe.</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}

/**
 * Un servizio nella lista: copertina, nome, cosa ha dentro. Tutta la riga
 * porta a modificarlo, perché è l'unica cosa che si può fare. Quando manca il
 * testo o le immagini lo dice in terracotta: è la pagina pubblica che resta
 * vuota, ed è quello che chiede attenzione.
 */
function RigaServizio({ servizio: s }: { servizio: Servizio }) {
  const portada = s.image[0];
  const manca = [s.image.length === 0 && "immagini", !s.description && "testo"].filter(Boolean);

  return (
    <li className="border-b border-line">
      <Link href={`/admin/shop/servizi/${s.slug}`} className="group flex items-center gap-4 py-4">
        <span className="block w-14 shrink-0 bg-paper-deep">
          {portada ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={immagineFerma(portada)} alt="" className="aspect-[4/5] w-full object-cover" />
          ) : (
            <span className="block aspect-[4/5] w-full" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="link-underline text-[0.9375rem] text-ink transition-colors group-hover:text-accent">
            {s.title}
          </span>
          <span className="mt-1 block text-xs text-ink-faint">
            {s.image.length > 0 ? contarPezzi(s.image) : "Nessuna immagine"}
            {manca.length > 0 && (
              <span className="text-accent"> · manca {manca.join(" e ")}</span>
            )}
          </span>
        </span>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-soft transition-colors group-hover:text-ink">
          <Pencil size={16} />
        </span>
      </Link>
    </li>
  );
}
