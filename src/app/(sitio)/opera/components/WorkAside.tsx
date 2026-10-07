import Link from "next/link";
import { AZIONE } from "@/components/azione";
import { Mail } from "@/components/Icon";
import Reveal from "@/components/Reveal";
import type { Work } from "@/lib/works";
import { ArrowRight } from "@/components/Icon";
import { prezzo, prezzoMinimo, prodottoHref } from "@/data/shop";
import type { Prodotto } from "@/lib/prodotti";

/**
 * La scheda dell'opera e l'azione primaria di tutto il sito, che è l'unica
 * forma chiusa e l'unica cosa arrotondata che il sito si concede —e che
 * ritorna identica solo in «Invia», l'altro capo dello stesso percorso.
 *
 * La scheda è una lista di definizione aperta e chiusa da filetti, una riga
 * per voce: etichetta in maiuscoletto a sinistra, valore allineato a destra
 * con cifre a larghezza fissa. Senza sfondo, senza righe alternate, senza
 * raggio.
 *
 * Oggi sono due righe, anno e tecnica, che è quello che conserva la tabella
 * `works`. È arrivata ad averne cinque —categoria, committente e misure—
 * quando l'opera viveva in un file TypeScript. Se quelle tre dovessero
 * tornare a servire, tornano come colonne della tabella e come campi
 * dell'admin; inventarle qui lascerebbe la scheda a dire cose che nessuno ha
 * caricato.
 */
export default function WorkAside({ work, stampa }: { work: Work; stampa?: Prodotto | null }) {
  const ficha = [
    { label: "Anno", value: String(work.year) },
    { label: "Tecnica", value: work.tecnica },
  ];

  return (
    <aside className="opera__scheda">
      <Reveal delay={90}>
        <dl className="border-t border-line">
          {ficha.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-6 border-b border-line py-3"
            >
              <dt className="label">{row.label}</dt>
              <dd className="figures text-right text-sm">{row.value}</dd>
            </div>
          ))}
        </dl>

        {/*
          L'azione primaria di tutto il sito vive qui, sull'opera concreta.

          **È l'unica forma chiusa del sito** —la ripete solo «Invia» nel
          modulo di Contatti, che è la fine di questo stesso gesto—, e contraddice di proposito due
          regole del sistema: che la terracotta non sia altro che filetti e
          segni, e che niente porti un bordo su tutti e quattro i lati. Si fa
          su richiesta della cliente e per una ragione difendibile: il sito non
          vende e non ha un checkout, e tutto il percorso finisce in una mail.
          C'è esattamente un'azione, ed è questa.

          **Provata in tre forme, e questa è quella scelta.** È stata un blocco
          di terracotta pieno —troppo: un rettangolo saturo accanto a
          un'illustrazione le fa concorrenza—, poi è tornata per un po'
          all'icona con la parola sottolineata, ed è rimasta qui. Lo stato di
          riposo è un filetto da 1px e la parola in terracotta su carta: si
          vede calda e si legge come qualcosa che si tocca, senza mettere un
          blocco di colore accanto all'opera. Il pieno non è sparito, si è
          spostato sull'hover, dove il peso non fa concorrenza a niente perché
          c'è già qualcuno che sta puntando.

          Il raggio è di 6px su 42 di altezza, ed è l'unica cosa arrotondata
          del sito: il gradino più morbido che ancora si noti. Più di così
          comincia a leggersi come una pillola e questo mondo non ne ha
          nessuna.

          **Dove porta.** Non apre più un `mailto:`, che dipendeva dal fatto
          che il visitatore avesse un programma di posta configurato e che su
          un telefono o su una webmail spesso non apre niente e non avvisa.
          Adesso va al modulo di Contatti con l'oggetto già compilato: viaggia
          lo slug e il titolo lo risolve quella pagina contro la tabella.

          La sottolineatura se n'è andata con la forma: dentro una forma chiusa
          sarebbe dire due volte che questo si tocca.
        */}
        <Link
          href={`/contatti?opera=${work.slug}`}
          className={`mt-8 ${AZIONE}`}
        >
          {/*
            L'icona prende `currentColor`: viaggia in terracotta con la parola
            e passa a carta con lei quando lo sfondo si riempie. Non cambia
            colore per conto suo —quello che risponde al puntatore è la forma
            intera— così non ci sono mai due cose che si muovono per un solo
            gesto.
          */}
          <Mail size={18} className="shrink-0" />
          Chiedi info
        </Link>
        <p className="mt-3 text-xs text-ink-faint">
          Ti porta al modulo con l&apos;oggetto già compilato.
        </p>

        {/*
          Se dell'opera esiste una stampa, si dice qui, sotto l'azione e in
          piccolo: è la strada laterale di chi non vuole commissionare ma
          portarsi a casa questa immagine. Il prezzo va con il «da» perché il
          formato si sceglie dall'altra parte.
        */}
        {stampa && (
          <p className="mt-8 border-t border-line pt-4 text-sm text-ink-soft">
            Disponibile come stampa,{" "}
            <span className="figures">
              {stampa.formati.length > 1 ? "da " : ""}
              {prezzo(prezzoMinimo(stampa.formati) ?? 0)}
            </span>
            .{" "}
            <Link
              href={prodottoHref(stampa)}
              className="group inline-flex items-center gap-1 text-ink transition-colors hover:text-accent"
            >
              <span className="link-underline">Vai alla stampa</span>
              <ArrowRight size={14} className="shrink-0" />
            </Link>
          </p>
        )}
      </Reveal>
    </aside>
  );
}
