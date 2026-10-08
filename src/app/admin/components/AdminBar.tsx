import Link from "next/link";
import { salir } from "../actions";
import { listOrdini, listProdotti } from "@/lib/prodotti";
import { listNovita } from "@/lib/newsletter";
import { listWorks, pingDb } from "@/lib/works";
import AdminNav from "./AdminNav";

/**
 * La barra dell'admin: cosa c'è caricato, se il database risponde, e l'uscita.
 *
 * Fissa in alto e su una sola riga. Porta lo stesso filetto e lo stesso
 * maiuscoletto della scheda di un'opera nel sito: non è la barra degli
 * strumenti di un'altra applicazione, è l'intestazione dell'archivio mentre lo
 * si sta modificando.
 *
 * Lo stato del database si interroga davvero a ogni caricamento. È la
 * differenza fra «non ci sono ancora opere» e «il database non risponde», che
 * a schermo si vedono uguali e significano cose opposte: la prima si risolve
 * caricando, la seconda avviando Postgres.
 */
export default async function AdminBar() {
  const viva = await pingDb();
  const [obras, prodotti, ordini, novita] = viva
    ? await Promise.all([
        listWorks(),
        listProdotti(),
        listOrdini(),
        // Senza la migrazione 006 la barra resta in piedi, senza il numero.
        listNovita().catch(() => null),
      ])
    : [[], [], [], null];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="shell flex h-12 items-center justify-between gap-4">
        <div className="flex min-w-0 items-baseline gap-4">
          <AdminNav
            conti={
              viva
                ? {
                    opere: obras.length,
                    prodotti: prodotti.length,
                    daSpedire: ordini.filter((o) => o.stato === "pagato").length,
                    novita: novita ? novita.opere.length + novita.stampe.length : null,
                  }
                : null
            }
          />

          {/*
            Il punto è l'unico colore della barra, e dice lo stato: terracotta
            quando il database non risponde, inchiostro pallido quando è tutto
            a posto. Mai verde: in questo sistema il colore segna quello che
            chiede attenzione, e «funziona» non ne chiede nessuna.
          */}
          <span
            className={`items-center gap-1.5 text-xs text-ink-faint ${viva ? "hidden md:flex" : "flex"}`}
          >
            <span
              aria-hidden="true"
              className={`block h-1 w-1 rounded-full ${viva ? "bg-ink-faint" : "bg-accent"}`}
            />
            {viva ? "database collegato" : "il database non risponde"}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-5 text-xs">
          {/* Sul telefono la barra serve alle quattro voci: il sito si apre dal menu del browser. */}
          <span className="hidden sm:inline">
            <Link href="/" className="area-tocco link-underline text-ink-soft transition-colors hover:text-ink">
              Vedi il sito
            </Link>
          </span>

          {/*
            Un modulo e non un link: chiudere la sessione cambia qualcosa sul
            server, e quello che cambia lo stato si manda con POST. Un <a> che
            cancella la sessione parte da solo con qualsiasi cosa che
            precarichi.
          */}
          <form action={salir}>
            <button
              type="submit"
              className="area-tocco link-underline text-ink-soft transition-colors hover:text-ink"
            >
              Esci
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
