/*
  Gli importi come li scrive una persona e come tornano in un campo. A parte
  da `conti.ts` perché li usa anche il modulo nel browser, che non può
  portarsi dietro il database.
*/

/**
 * Un importo come lo scrive una persona —«12», «12,50», «1.250», «€ 8.5»— in
 * centesimi. Null se non è un importo.
 *
 * Il punto seguito da tre cifre è delle migliaia, all'italiana; con una o due
 * cifre è dei decimali, perché è così che lo scrive chi è abituato al
 * telefono.
 */
export function leggiImporto(crudo: string): number | null {
  let s = crudo.replace(/[€\s]/g, "");
  if (!s) return null;
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const centesimi = Math.round(Number(s) * 100);
  return centesimi > 0 && centesimi <= 100_000_000 ? centesimi : null;
}

/** 1250 → «12,50», per rimettere un importo in un campo da correggere. */
export const importoScritto = (c: number) => (c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2).replace(".", ","));
