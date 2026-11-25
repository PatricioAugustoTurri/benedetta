import type { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { commissioneDi, conForfettario, forfettarioDi, NOME_CANALE, registroPeriodo } from "@/lib/conti";

/**
 * I conti di un mese o di un anno in un foglio di calcolo, per il
 * commercialista.
 *
 * Lo stesso formato dell'esportazione degli ordini, quello che Excel e
 * Numbers aprono da soli in Italia: punto e virgola, decimali con la virgola,
 * BOM in testa. Vendite e spese stanno nello stesso foglio, una per riga e in
 * ordine di data, con le entrate e le uscite in due colonne: così una somma
 * per colonna dà le vendite e le spese, e la differenza il netto. Il
 * forfettario è una colonna di riferimento: non entra in quella differenza.
 */
export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) return new Response("Accedi di nuovo.", { status: 401 });

  const sp = request.nextUrl.searchParams;
  const anno = Number(sp.get("anno"));
  const meseCrudo = sp.get("mese");
  const mese = meseCrudo ? Number(meseCrudo) : null;
  if (!Number.isInteger(anno) || anno < 2000 || anno > 2100) return new Response("Anno non valido.", { status: 400 });
  if (mese !== null && (!Number.isInteger(mese) || mese < 1 || mese > 12)) {
    return new Response("Mese non valido.", { status: 400 });
  }

  const { vendite, spese } = await registroPeriodo(anno, mese);
  const euro = (c: number) => (c / 100).toFixed(2).replace(".", ",");
  const data = (iso: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "");
  const cella = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

  const intestazione = [
    "Tipo", "Numero", "Data", "Canale", "Cliente", "Email", "Telefono", "Descrizione",
    "Entrata €", "Uscita €", "Commissione SumUp €", "Forfettario € (rif.)", "Pagato il", "Consegna", "Consegnato il",
  ];
  const righe = [
    ...vendite.map((v) => ({
      giorno: v.giorno,
      celle: [
        "Vendita",
        v.numero,
        data(v.giorno),
        v.origine === "sito" ? `${NOME_CANALE[v.canale]} (sito)` : NOME_CANALE[v.canale],
        v.nome,
        v.email ?? "",
        v.telefono ?? "",
        v.cosa,
        euro(v.importo),
        "",
        v.canale === "sumup" ? euro(commissioneDi(v)) : "",
        conForfettario(v.canale) ? euro(forfettarioDi(v)) : "",
        v.pagatoIl ? data(v.pagatoIl) : "Da incassare",
        v.consegna === "spedizione" ? "Spedizione" : "A mano",
        v.consegnatoIl ? data(v.consegnatoIl) : "Da fare",
      ],
    })),
    ...spese.map((s) => ({
      giorno: s.giorno,
      celle: ["Spesa", "", data(s.giorno), "", "", "", "", s.descrizione, "", euro(s.importo), "", "", "", "", ""],
    })),
  ].sort((a, b) => a.giorno.localeCompare(b.giorno));

  const csv = "﻿" + [intestazione, ...righe.map((r) => r.celle)].map((r) => r.map(cella).join(";")).join("\r\n");
  const nome = mese ? `conti-${anno}-${String(mese).padStart(2, "0")}.csv` : `conti-${anno}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
      "Cache-Control": "no-store",
    },
  });
}
