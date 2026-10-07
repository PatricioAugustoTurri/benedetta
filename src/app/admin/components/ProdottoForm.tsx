"use client";

import Link from "next/link";
import { useActionState, useId, useMemo, useState } from "react";
import { Plus, Trash } from "@/components/Icon";
import { FORMATI_BASE, prezzo, type Formato } from "@/data/shop";
import { MAX_ARCHIVO_MB, MAX_VIDEO_MB } from "@/lib/limites";
import type { Prodotto } from "@/lib/prodotti";
import type { EstadoFormulario } from "../actions";
import { guardaProdotto } from "../shop/actions";
import CampoImmagini, { type StatoImmagini } from "./CampoImmagini";
import { CONTROL, LABEL } from "./campo";

/** Da titolo a indirizzo, come per le opere: una proposta che smette di seguire appena la si tocca. */
function aDireccion(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Una riga del listino nel modulo. Il prezzo resta testo finché si scrive: «15», «15,50». */
type RigaFormato = { key: string; formato: string; euro: string };

const aRiga = (f: Formato, i: number): RigaFormato => ({
  key: `f-${i}-${f.formato}`,
  formato: f.formato,
  euro: (f.prezzo / 100).toLocaleString("it-IT", { maximumFractionDigits: 2 }),
});

/** «15,50» → 1550. Quello che non è un numero diventa 0, e il server lo rifiuta con un messaggio. */
function aCentesimi(euro: string): number {
  const n = Number(euro.replace(/\s|€/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/**
 * Il modulo di una stampa: titolo, testo, immagini, il listino dei formati e
 * l'opera da cui esce. Ritratti e illustrazioni non passano di qui: sono due
 * servizi fissi e si modificano con ServizioForm.
 *
 * Il listino parte da quello di base (A5 10 €, A4 15 €, A3 30 €) e si cambia
 * per questa stampa sola.
 */
export default function ProdottoForm({
  prodotto,
  opere,
}: {
  prodotto?: Prodotto;
  /** Le opere dell'archivio, per collegare una stampa al suo originale. */
  opere: { slug: string; title: string }[];
}) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(guardaProdotto, {});
  const idBase = useId();


  const [titolo, setTitolo] = useState(prodotto?.title ?? "");
  const [direccion, setDireccion] = useState(prodotto?.slug ?? "");
  const [direccionTocada, setDireccionTocada] = useState(Boolean(prodotto));

  const [righe, setRighe] = useState<RigaFormato[]>(() =>
    (prodotto && prodotto.formati.length > 0 ? prodotto.formati : FORMATI_BASE).map(aRiga),
  );

  const [statoImmagini, setStatoImmagini] = useState<StatoImmagini>({
    subiendo: false,
    falladas: 0,
    pesadas: 0,
  });
  const { subiendo, falladas, pesadas } = statoImmagini;
  const bloqueado = subiendo || falladas > 0 || pesadas > 0;

  const formatiJson = useMemo(
    () => JSON.stringify(righe.map((r) => ({ formato: r.formato, prezzo: aCentesimi(r.euro) }))),
    [righe],
  );

  const cambia = (key: string, cambio: Partial<RigaFormato>) =>
    setRighe((rs) => rs.map((r) => (r.key === key ? { ...r, ...cambio } : r)));

  return (
    <form action={enviar} className="grid gap-12 md:grid-cols-12 md:gap-16">
      {prodotto && <input type="hidden" name="id" value={prodotto.id} />}
      <input type="hidden" name="formati" value={formatiJson} />

      <div className="md:col-span-7">
        <h1 className="display-lead font-display text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15]">
          {prodotto ? prodotto.title : "Nuova stampa"}
        </h1>

        {(falladas > 0 || pesadas > 0) && (
          <p
            role="alert"
            className="mt-5 border-l border-accent bg-paper-deep/60 py-2 pl-3 text-sm text-accent"
          >
            {pesadas > 0
              ? `Un file supera il peso massimo: ${MAX_ARCHIVO_MB} MB per le immagini, ${MAX_VIDEO_MB} MB per i video.`
              : "Un file non è stato caricato. Toglilo e riprova."}
          </p>
        )}

        {estado.error && (
          <p
            role="alert"
            className="mt-5 border-l border-accent bg-paper-deep/60 py-2 pl-3 text-sm text-accent"
          >
            {estado.error}
          </p>
        )}

        {/* ------------------------------------------------------- scheda */}
        <div className="mt-10 space-y-7">
          <div className="group/campo">
            <label htmlFor={`${idBase}-title`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
              Titolo
            </label>
            <input
              id={`${idBase}-title`}
              name="title"
              value={titolo}
              onChange={(e) => {
                setTitolo(e.target.value);
                if (!direccionTocada) setDireccion(aDireccion(e.target.value));
              }}
              required
              autoComplete="off"
              className={`${CONTROL} mt-2`}
            />
          </div>

          <div className="group/campo">
            <label htmlFor={`${idBase}-slug`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
              Indirizzo
            </label>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
              Quello che va dopo /shop/stampe/. Minuscole, numeri e trattini. Se la stampa è
              già stata condivisa, non cambiarlo.
            </p>
            <input
              id={`${idBase}-slug`}
              name="slug"
              value={direccion}
              onChange={(e) => {
                setDireccionTocada(true);
                setDireccion(e.target.value);
              }}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              autoComplete="off"
              className={`${CONTROL} mt-2 text-sm tracking-[0.01em]`}
            />
          </div>

          <div className="group/campo">
            <label
              htmlFor={`${idBase}-description`}
              className={`${LABEL} group-has-[:focus]/campo:text-ink`}
            >
              Testo
            </label>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
              Cosa rappresenta, la carta, come arriva. Può restare vuoto.
            </p>
            <textarea
              id={`${idBase}-description`}
              name="description"
              rows={4}
              defaultValue={prodotto?.description ?? ""}
              className={`${CONTROL} mt-2 field-sizing-content resize-y leading-relaxed`}
            />
          </div>
        </div>

        {/* ------------------------------------------------------- formati */}
        <div className="mt-12 border-t border-line pt-8">
          <h2 className="label text-ink">Formati e prezzi</h2>
          <p className="mt-1.5 max-w-[46ch] text-xs leading-relaxed text-ink-faint">
            Parte dal listino di base. Quello che cambi qui vale solo per questa stampa.
          </p>

          <ul className="mt-5 border-t border-line">
            {righe.map((r, i) => (
              <li key={r.key} className="flex items-center gap-4 border-b border-line py-2.5">
                <input
                  value={r.formato}
                  onChange={(e) => cambia(r.key, { formato: e.target.value })}
                  aria-label={`Nome del formato ${i + 1}`}
                  placeholder="A4"
                  className={`${CONTROL} min-w-0 flex-1 border-transparent py-1.5 text-sm`}
                />
                <span className="flex items-baseline gap-1.5">
                  <input
                    value={r.euro}
                    onChange={(e) => cambia(r.key, { euro: e.target.value })}
                    inputMode="decimal"
                    aria-label={`Prezzo in euro di ${r.formato || `formato ${i + 1}`}`}
                    placeholder="15"
                    className={`${CONTROL} figures w-20 py-1.5 text-right text-sm`}
                  />
                  <span className="text-sm text-ink-faint">€</span>
                </span>
                <button
                  type="button"
                  onClick={() => setRighe((rs) => rs.filter((x) => x.key !== r.key))}
                  title="Togli"
                  className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-faint transition-colors hover:text-accent"
                >
                  <span className="sr-only">Togli il formato {r.formato}</span>
                  <Trash size={15} />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <button
              type="button"
              onClick={() =>
                setRighe((rs) => [...rs, { key: `f-${Date.now()}`, formato: "", euro: "" }])
              }
              className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
            >
              <Plus size={15} />
              <span className="link-underline">Aggiungi un formato</span>
            </button>
            <button
              type="button"
              onClick={() => setRighe(FORMATI_BASE.map(aRiga))}
              className="text-xs text-ink-faint transition-colors hover:text-ink"
            >
              <span className="link-underline">
                Torna al listino di base ({FORMATI_BASE.map((f) => `${f.formato} ${prezzo(f.prezzo)}`).join(" · ")})
              </span>
            </button>
          </div>

          <div className="group/campo mt-10">
            <label htmlFor={`${idBase}-opera`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
              Dall&apos;opera
            </label>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
              Se la stampa riproduce un&apos;opera dell&apos;archivio, la pagina dell&apos;opera
              dirà «Disponibile come stampa».
            </p>
            <select
              id={`${idBase}-opera`}
              name="opera"
              defaultValue={prodotto?.operaSlug ?? ""}
              className={`${CONTROL} mt-2 cursor-pointer`}
            >
              <option value="">Nessuna</option>
              {opere.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ------------------------------------------------------- immagini */}
        <CampoImmagini
          iniziali={prodotto?.image}
          onStato={setStatoImmagini}
          nota={
            <>
              Il primo pezzo è la copertina: quello che esce nella griglia dello Shop, in
              verticale 4:5. Ognuno sale su Cloudinary appena lo scegli.
            </>
          }
        />

        {/* ------------------------------------------------- pubblicazione */}
        <label
          htmlFor={`${idBase}-pubblicato`}
          className="mt-12 flex cursor-pointer items-start gap-3 border-t border-line pt-6"
        >
          <input
            id={`${idBase}-pubblicato`}
            type="checkbox"
            name="pubblicato"
            defaultChecked={prodotto?.pubblicato ?? false}
            className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-accent)]"
          />
          <span>
            <span className="block text-sm text-ink">Pubblicato nello Shop</span>
            <span className="mt-1 block text-xs leading-relaxed text-ink-faint">
              Finché non lo spunti resta una bozza: lo vedi qui, ma nel sito non esce.
            </span>
          </span>
        </label>

        <div className="mt-10 flex items-center gap-6 border-t border-line pt-6">
          <button
            type="submit"
            disabled={enviando || bloqueado}
            className="bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {enviando
              ? "Salvataggio…"
              : subiendo
                ? "Caricamento in corso…"
                : prodotto
                  ? "Salva le modifiche"
                  : "Salva la stampa"}
          </button>
          <Link
            href="/admin/shop"
            className="link-underline text-sm text-ink-soft transition-colors hover:text-ink"
          >
            Annulla
          </Link>
        </div>
      </div>

      <aside className="md:col-span-3 md:col-start-9">
        <h2 className="label">Dove uscirà</h2>
        <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
          <li>Nello Shop, nella sezione Stampe.</li>
          <li>
            Nella sua pagina:{" "}
            <span className="break-all text-xs tracking-[0.01em] text-ink">
              /shop/stampe/{direccion || "…"}
            </span>
          </li>
          <li>Con il carrello e il pagamento su Stripe.</li>
        </ul>
      </aside>
    </form>
  );
}
