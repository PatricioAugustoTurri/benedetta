import { isAuthenticated } from "@/lib/auth";
import { listOrdini } from "@/lib/prodotti";

/**
 * Tutti gli ordini in un foglio di calcolo, per chi tiene la contabilità.
 *
 * Il formato è quello che Excel e Numbers aprono da soli in Italia: colonne
 * separate da punto e virgola, decimali con la virgola, e il segno BOM in
 * testa perché gli accenti non escano storti. Un ordine per riga; le stampe
 * comprate stanno in una colonna sola, una dopo l'altra.
 */
export async function GET() {
  if (!(await isAuthenticated())) return new Response("Accedi di nuovo.", { status: 401 });

  const ordini = await listOrdini();
  const euro = (c: number) => (c / 100).toFixed(2).replace(".", ",");
  const data = (d: Date | null) =>
    d ? new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Rome" }).format(d) : "";
  // Ogni cella fra virgolette, con quelle interne raddoppiate: nomi e
  // indirizzi possono contenere punti e virgola, a capo o virgolette.
  const cella = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

  const intestazione = [
    "Ordine", "Data", "Stato", "Nome", "Email", "Indirizzo", "CAP", "Città", "Provincia", "Paese",
    "Stampe", "Subtotale €", "Spedizione €", "Totale €", "Spedito il", "Corriere", "Tracciamento", "Pagamento Stripe",
  ];
  const righe = ordini.map((o) => [
    o.id,
    data(o.creato),
    o.stato,
    o.nome ?? "",
    o.email,
    [o.indirizzo.line1, o.indirizzo.line2].filter(Boolean).join(", "),
    o.indirizzo.postal_code ?? "",
    o.indirizzo.city ?? "",
    o.indirizzo.state ?? "",
    o.indirizzo.country ?? "",
    o.righe.map((r) => `${r.quantita} × ${r.title} (${r.formato})`).join(" | "),
    euro(o.subtotale),
    euro(o.spedizione),
    euro(o.totale),
    data(o.spedito),
    o.corriere ?? "",
    o.tracking ?? "",
    o.stripeSessionId,
  ]);

  const csv = "﻿" + [intestazione, ...righe].map((r) => r.map(cella).join(";")).join("\r\n");
  const oggi = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ordini-${oggi}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
