"use client";

import { useSyncExternalStore } from "react";

/**
 * Una riga del carrello: una stampa in un formato, con quante copie.
 *
 * Porta con sé titolo, prezzo e copertina perché il carrello si disegni
 * subito, anche nell'icona dell'header, senza chiedere niente al server. Ma
 * sono una **fotografia per mostrare**, non un dato di cui fidarsi: vivono nel
 * browser e chiunque le può riscrivere. La pagina del carrello le riconferma
 * contro la tabella appena si apre, e il pagamento non legge altro che slug,
 * formato e quantità: il prezzo lo prende sempre dal database.
 */
export type VoceCarrello = {
  slug: string;
  formato: string;
  quantita: number;
  title: string;
  /** Centesimi, per copia. */
  prezzo: number;
  immagine?: { url: string; width: number; height: number; alt: string };
};

/**
 * Le copie di una stampa in un formato: da 1 a 10 (cliente, 2026-10-07).
 * Il tetto lo ripete il server in carrello/actions.ts, che non si fida di
 * quello che arriva dal browser.
 */
export const MAX_QUANTITA = 10;

const CHIAVE = "illustrando.carrello";
const VUOTO: VoceCarrello[] = [];

/*
  Il carrello è uno stato del visitatore e del suo browser —non c'è un conto
  né un login— quindi vive in localStorage. È l'unico posto in cui sopravvive
  a una pagina chiusa e riaperta il giorno dopo, che è esattamente quello che
  ci si aspetta da un carrello.

  Ogni accesso va in try/catch: in una finestra privata, o con i dati del sito
  bloccati, localStorage lancia invece di rispondere, e un carrello che rompe
  la pagina è peggio di un carrello che si dimentica.
*/
let cache: VoceCarrello[] | null = null;
const ascoltatori = new Set<() => void>();

function leggi(): VoceCarrello[] {
  if (cache) return cache;
  try {
    const crudo = window.localStorage.getItem(CHIAVE);
    const lista: unknown = crudo ? JSON.parse(crudo) : [];
    // Un carrello salvato quando il tetto era più alto torna dentro il limite.
    cache = Array.isArray(lista)
      ? lista.filter(valida).map((v) => ({ ...v, quantita: Math.min(v.quantita, MAX_QUANTITA) }))
      : VUOTO;
  } catch {
    cache = VUOTO;
  }
  return cache;
}

function valida(v: unknown): v is VoceCarrello {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.slug === "string" &&
    typeof r.formato === "string" &&
    typeof r.title === "string" &&
    Number.isInteger(r.quantita) &&
    (r.quantita as number) > 0 &&
    Number.isInteger(r.prezzo)
  );
}

function scrivi(lista: VoceCarrello[]) {
  cache = lista;
  try {
    window.localStorage.setItem(CHIAVE, JSON.stringify(lista));
  } catch {
    // Senza memoria, il carrello dura finché la pagina resta aperta.
  }
  for (const a of ascoltatori) a();
}

function iscrivi(a: () => void) {
  ascoltatori.add(a);
  // Un'altra scheda ha cambiato il carrello: questa lo rilegge, così l'icona
  // di tutte e due dice lo stesso numero.
  const daAltraScheda = (e: StorageEvent) => {
    if (e.key !== CHIAVE) return;
    cache = null;
    a();
  };
  window.addEventListener("storage", daAltraScheda);
  return () => {
    ascoltatori.delete(a);
    window.removeEventListener("storage", daAltraScheda);
  };
}

/**
 * Il carrello, vivo. Sul server e al primo disegno è vuoto: il server non sa
 * cosa c'è nel browser, e partire da vuoto evita che l'HTML e il primo
 * disegno del client non coincidano. Il numero compare appena la pagina si
 * idrata.
 */
export function useCarrello(): VoceCarrello[] {
  return useSyncExternalStore(iscrivi, leggi, () => VUOTO);
}

/**
 * Quante stampe diverse: il numero dell'icona. Ogni riga del carrello conta
 * una, quante che siano le copie (cliente, 2026-10-07): due stampe, una in
 * due copie e l'altra in cinque, fanno 2 e non 7. La stessa stampa in due
 * formati sono due righe, e conta due, come le righe che si vedono nel
 * carrello.
 */
export function contaStampe(voci: VoceCarrello[]): number {
  return voci.length;
}

export function totaleCarrello(voci: VoceCarrello[]): number {
  return voci.reduce((n, v) => n + v.prezzo * v.quantita, 0);
}

const stessa = (v: VoceCarrello, slug: string, formato: string) =>
  v.slug === slug && v.formato === formato;

/**
 * Aggiunge una copia. Se la stampa in quel formato c'è già, ne aumenta la
 * quantità. Restituisce false se non è cambiato niente perché quella riga è
 * già al tetto: allora non si conferma e la borsa non si muove.
 */
export function aggiungi(voce: Omit<VoceCarrello, "quantita">): boolean {
  const lista = leggi();
  const presente = lista.find((v) => stessa(v, voce.slug, voce.formato));
  if (presente && presente.quantita >= MAX_QUANTITA) return false;
  scrivi(
    presente
      ? lista.map((v) =>
          stessa(v, voce.slug, voce.formato)
            ? { ...v, ...voce, quantita: Math.min(v.quantita + 1, MAX_QUANTITA) }
            : v,
        )
      : [...lista, { ...voce, quantita: 1 }],
  );
  // L'icona dell'header ascolta questo e non il numero: deve muoversi quando
  // qualcuno aggiunge, non quando il carrello si carica o cambia in un'altra
  // scheda. `nuova` dice se è entrata una riga: solo allora il numero cambia,
  // e solo allora sale.
  window.dispatchEvent(
    new CustomEvent<DettaglioAggiunto>(EVENTO_AGGIUNTO, { detail: { nuova: !presente } }),
  );
  return true;
}

export const EVENTO_AGGIUNTO = "carrello:aggiunto";
export type DettaglioAggiunto = { nuova: boolean };

/**
 * Cambia le copie di una riga, sempre fra 1 e MAX_QUANTITA. Scendere sotto
 * 1 non toglie la stampa: per quello c'è «Togli», che è un gesto deciso e non
 * un clic di troppo sul meno.
 */
export function cambiaQuantita(slug: string, formato: string, quantita: number) {
  const giusta = Math.min(Math.max(quantita, 1), MAX_QUANTITA);
  scrivi(leggi().map((v) => (stessa(v, slug, formato) ? { ...v, quantita: giusta } : v)));
}

export function togli(slug: string, formato: string) {
  scrivi(leggi().filter((v) => !stessa(v, slug, formato)));
}

/** Sostituisce tutto: lo usa il carrello quando il server ha riconfermato le righe. */
export function sostituisci(lista: VoceCarrello[]) {
  scrivi(lista);
}

export function svuota() {
  scrivi(VUOTO);
}
