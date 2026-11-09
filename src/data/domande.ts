import { elencoCorrieri, legale } from "@/data/legale";
import { MINIMO_SCONTI, prezzo } from "@/data/shop";
import { indirizzoNegozio, tariffeSpedizione } from "@/lib/spedizione";

/**
 * Le domande frequenti, con le risposte di lei (cliente, 2026-11-07).
 *
 * **Non ripetono le pagine legali: le traducono.** Una o due frasi, con la sua
 * voce, e un link al punto preciso delle condizioni o delle spedizioni per chi
 * vuole il dettaglio. Tutto quello che ha già un posto —carta, tempi, tariffe,
 * corrieri, indirizzo del negozio, minimo per gli sconti— si legge da lì e non
 * si riscrive a mano: se cambia l'indirizzo o una tariffa, la risposta cambia
 * da sola e non può contraddire le condizioni.
 *
 * Le risposte sono testo semplice, a paragrafi, e un link al massimo in fondo:
 * così lo stesso testo serve alla pagina e ai dati strutturati (`FAQPage`),
 * che vogliono parole e non componenti.
 *
 * Una domanda che lei non ha ancora risposto non entra. Niente prezzi dei
 * lavori su commissione: si chiedono a lei (cliente, 2026-11-07).
 */
export type Domanda = {
  /** L'ancora: `/domande-frequenti#cornice` apre direttamente quella. */
  id: string;
  domanda: string;
  risposta: string[];
  link?: { href: string; testo: string };
};

export type GruppoDomande = { id: string; titolo: string; domande: Domanda[] };

const SCRIVIMI = { href: "/contatti", testo: "Scrivimi" };

/** Il dato è completo quando le pagine legali sono pubblicate (`legaliPronte`). */
const d = (s: string | null) => s ?? "";
const maiuscola = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function domandeFrequenti(): GruppoDomande[] {
  const tariffe = tariffeSpedizione();
  const italia = tariffe.find((t) => t.zona === "italia");
  const ue = tariffe.find((t) => t.zona === "ue");

  return [
    {
      id: "stampe",
      titolo: "Le stampe",
      domande: [
        {
          id: "carta",
          domanda: "Su che carta sono stampate?",
          risposta: [
            `Su ${d(legale.carta)}. Le illustrazioni nascono ${d(legale.tecnica)}, e ogni stampa si stampa dopo il tuo ordine.`,
          ],
        },
        {
          id: "misure",
          domanda: "Quanto sono grandi i formati?",
          risposta: [
            "Nella pagina di ogni stampa trovi i formati disponibili, con la misura in centimetri accanto al prezzo.",
          ],
          link: { href: "/spedizioni-e-resi#stampe", testo: "Tutte le misure" },
        },
        {
          id: "firma",
          domanda: "Sono firmate? Sono numerate?",
          risposta: ["Le firmo tutte. Non sono numerate."],
        },
        {
          id: "cornice",
          domanda: "La cornice è compresa?",
          risposta: [
            "No: il prezzo è quello della sola stampa. Le foto con la cornice servono a dare l'idea di come sta sul muro.",
            `La cornice ${d(legale.cornice)}.`,
          ],
          link: SCRIVIMI,
        },
        {
          id: "colori",
          domanda: "I colori sono uguali a quelli della foto?",
          risposta: [
            "Le foto sono il più fedeli possibile, ma i colori possono cambiare leggermente da uno schermo all'altro.",
          ],
        },
        {
          id: "originali",
          domanda: "Vendi anche gli originali?",
          risposta: [
            "Sì. Alcuni lavori li faccio a mano, con acrilico, pastello o su legno: non sono nello shop, quindi scrivimi per sapere quali sono disponibili e a che prezzo.",
          ],
          link: SCRIVIMI,
        },
        {
          id: "uso",
          domanda: "Posso usare l'immagine per altro?",
          risposta: [
            "La stampa è per uso personale: i diritti sull'immagine restano miei. Se ti serve per altro, scrivimi e ne parliamo.",
          ],
          link: SCRIVIMI,
        },
      ],
    },
    {
      id: "ordine",
      titolo: "Ordine e pagamento",
      domande: [
        {
          id: "pagamento",
          domanda: "Come posso pagare?",
          risposta: [
            // I metodi li ha confermati lei (cliente, 2026-11-07). PayPal no:
            // SumUp non lo accetta.
            "Con carta di credito o di debito, Apple Pay o Google Pay, sulle pagine protette di SumUp. Appena il pagamento va a buon fine ti arriva una mail con il riepilogo dell'ordine.",
          ],
        },
        {
          id: "fattura",
          domanda: "Posso avere la fattura?",
          risposta: [
            "Sì: scrivimi subito dopo l'ordine con il tuo codice fiscale.",
            "Se ti serve intestata a un'azienda, mandami invece ragione sociale, partita IVA e codice SDI o PEC. Sono in regime forfettario: i prezzi sono senza IVA.",
          ],
          link: SCRIVIMI,
        },
        {
          id: "modifica",
          domanda: "Posso cambiare o annullare un ordine?",
          risposta: [
            "Sì, finché non è partito: scrivimi subito dopo averlo fatto. Se è già in viaggio, puoi sempre restituirlo entro 14 giorni.",
          ],
          link: SCRIVIMI,
        },
        {
          id: "codici",
          domanda: "Come funzionano i codici sconto?",
          risposta: [
            `Si scrivono nel carrello, prima di pagare. Valgono quando le stampe, a prezzo pieno, arrivano almeno a ${prezzo(MINIMO_SCONTI)}, spedizione esclusa. Non si sommano agli sconti di stagione e non si applicano alla spedizione.`,
          ],
        },
        {
          id: "biglietto",
          domanda: "Nel pacco ho trovato un biglietto con un codice: cos'è?",
          risposta: [
            "Uno sconto solo per te, sul prossimo ordine. Vale una volta sola, fino alla data scritta sul biglietto.",
          ],
        },
      ],
    },
    {
      id: "spedizione",
      titolo: "Spedizione e ritiro",
      domande: [
        {
          id: "quando",
          domanda: "Quando parte il mio ordine?",
          risposta: [
            `Entro ${d(legale.tempiProduzione)} dall'ordine. Quando parte ti scrivo, con il numero per seguire il pacco.`,
          ],
        },
        {
          id: "costo-spedizione",
          domanda: "Quanto costa la spedizione?",
          risposta: [
            `${italia ? `In Italia ${prezzo(italia.prezzo)}` : ""}${italia && ue ? ", " : ""}${ue ? `nel resto dell'Unione Europea ${prezzo(ue.prezzo)}` : ""}. Si paga una volta per ordine, anche se compri più stampe.`,
          ],
        },
        {
          id: "tempi",
          domanda: "Quanto ci mette ad arrivare?",
          risposta: [
            `Una volta partito, in genere ${d(legale.tempiConsegna.italia)} in Italia e ${d(legale.tempiConsegna.ue)} nel resto dell'Unione Europea. Spedisco con il corriere più adatto al pacco: ${elencoCorrieri()}.`,
          ],
        },
        {
          id: "natale",
          domanda: "Fino a quando posso ordinare per Natale?",
          risposta: [
            `Per riceverla in tempo, in Italia ordina entro il ${legale.natale.italia}; nel resto dell'Unione Europea entro il ${legale.natale.ue}.`,
            `Un ritratto o un'illustrazione personalizzata richiede ${legale.tempiSuMisura} di lavoro: se è per Natale, scrivimi con molto anticipo.`,
          ],
        },
        {
          id: "regalo",
          domanda: "Posso spedirla direttamente a chi la riceve in regalo?",
          risposta: ["Sì: alla cassa scrivi il suo indirizzo invece del tuo."],
        },
        {
          id: "confezione",
          domanda: "Fai confezioni regalo o biglietti d'auguri?",
          risposta: [
            "Sì. Dopo l'ordine scrivimi cosa preferisci e, se vuoi, il messaggio da mettere nel biglietto.",
          ],
          link: SCRIVIMI,
        },
        {
          id: "ritiro",
          domanda: "Posso ritirarla a Foligno?",
          risposta: [
            `Sì, ed è gratis: alla cassa scegli il ritiro in negozio, in ${indirizzoNegozio()}. Paghi online come per la spedizione; quando è pronta ti scrivo, e passi quando vuoi.`,
          ],
        },
        {
          id: "estero",
          domanda: "Spedisci fuori dall'Unione Europea?",
          risposta: ["Per ora no. Se sei altrove, scrivimi e vediamo insieme."],
          link: SCRIVIMI,
        },
        {
          id: "imballaggio",
          domanda: "Come arriva?",
          risposta: [`${maiuscola(d(legale.imballaggio))}.`],
        },
      ],
    },
    {
      id: "resi",
      titolo: "Resi e problemi",
      domande: [
        {
          id: "rovinata",
          domanda: "È arrivata rovinata: cosa faccio?",
          risposta: [
            "Scrivimi appena puoi, con una foto della stampa e dell'imballaggio: te ne mando un'altra, senza spese.",
          ],
          link: SCRIVIMI,
        },
        {
          id: "reso",
          domanda: "Posso restituirla se cambio idea?",
          risposta: [
            "Sì, entro 14 giorni dalla consegna e senza dover spiegare perché. Me la rispedisci integra, nel suo imballaggio; la spedizione del ritorno è a tuo carico.",
          ],
          link: { href: "/condizioni-di-vendita#recesso", testo: "Il recesso, passo per passo" },
        },
        {
          id: "rimborso",
          domanda: "Quando mi rimborsi?",
          risposta: [
            "Entro 14 giorni da quando mi scrivi che vuoi restituirla: tutto quello che hai pagato, spedizione compresa, con lo stesso metodo di pagamento. Posso aspettare che la stampa torni, o che tu mi mandi la prova di averla spedita.",
          ],
        },
        {
          id: "difetto",
          domanda: "E se ha un difetto?",
          risposta: [
            "Le stampe hanno la garanzia legale di due anni dalla consegna: se una ha un difetto, la ristampo o ti rimborso.",
          ],
          link: { href: "/condizioni-di-vendita#garanzia", testo: "La garanzia" },
        },
        {
          id: "reso-su-misura",
          domanda: "Un lavoro su commissione si può restituire?",
          risposta: [
            "No: è fatto apposta per te, e per i lavori personalizzati la legge non prevede il recesso. Per questo prezzo e dettagli li decidiamo insieme prima di cominciare.",
          ],
          link: { href: "/condizioni-di-vendita#su-misura", testo: "Le condizioni" },
        },
      ],
    },
    {
      id: "commissioni",
      titolo: "Ritratti e illustrazioni su commissione",
      domande: [
        {
          id: "come",
          domanda: "Come si comincia?",
          risposta: [
            "Scrivimi cosa hai in mente: per chi è, quale ricordo o storia vuoi raccontare, e per quando ti serve. Da lì ti propongo come procedere.",
          ],
          link: SCRIVIMI,
        },
        {
          id: "prezzo-su-misura",
          domanda: "Quanto costa?",
          risposta: [
            "Dipende dal lavoro. Scrivimi cosa hai in mente e ti dico il prezzo prima di cominciare.",
          ],
          link: SCRIVIMI,
        },
        {
          id: "tempi-su-misura",
          domanda: "Quanto tempo ci vuole?",
          risposta: [
            `Di solito ${legale.tempiSuMisura}, più la spedizione. Se è un regalo, scrivimi con un po' di anticipo.`,
          ],
        },
        {
          id: "lavoro",
          domanda: "Che foto ti servono, e come funziona il lavoro?",
          risposta: [
            "Ne parliamo per mail prima di cominciare: le foto, le modifiche, il pagamento. Ogni lavoro è diverso, e lo decidiamo insieme.",
          ],
          link: SCRIVIMI,
        },
        {
          id: "digitale",
          domanda: "Posso averlo in digitale invece che stampato?",
          risposta: [
            "Di solito no: ritratti e illustrazioni li consegno stampati. Faccio un'eccezione solo in casi particolari, per esempio se sei molto lontano, negli Stati Uniti o in America Latina.",
          ],
          link: SCRIVIMI,
        },
      ],
    },
    {
      id: "editori",
      titolo: "Per case editrici e studi",
      domande: [
        {
          id: "collaborazioni",
          domanda: "Lavori con case editrici, riviste e studi?",
          risposta: [
            "Sì. Scrivimi con il progetto, i tempi e il formato, e ti rispondo con la mia disponibilità e un preventivo.",
          ],
          link: SCRIVIMI,
        },
        {
          id: "preventivo",
          domanda: "Cosa devo scriverti per un preventivo?",
          risposta: [
            "Il progetto in due righe, dove verrà usata l'illustrazione, quante ne servono, il formato e la scadenza. Più è chiaro, più la risposta è concreta.",
          ],
          link: SCRIVIMI,
        },
      ],
    },
  ];
}
