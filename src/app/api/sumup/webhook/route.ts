import { confermaPagamento, riferimentoDi } from "@/lib/pagamento";
import { sumupConfigurato } from "@/lib/sumup";

/**
 * L'avviso di SumUp: «il pagamento X ha cambiato stato».
 *
 * È uno dei due ingressi da cui nasce un ordine; l'altro è la pagina di
 * ringraziamento. Serve per chi paga e chiude la scheda prima di tornare sul
 * sito: SumUp chiama qui comunque, e se non riceve un 2xx riprova dopo 1, 5
 * e 20 minuti e dopo 2 ore.
 *
 * **L'avviso non è firmato**, quindi non si crede a niente di quello che
 * porta: se ne usa solo l'id, per rileggere il pagamento da SumUp con la
 * chiave segreta. Un «pagato» finto mandato qui da chiunque fa al massimo
 * una lettura in più, e la lettura dice la verità.
 */
export async function POST(request: Request) {
  if (!sumupConfigurato()) return new Response("SumUp non configurato", { status: 503 });

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return new Response("Corpo non valido", { status: 400 });
  }

  const { event_type: evento, id } = (corpo ?? {}) as { event_type?: unknown; id?: unknown };
  // Gli eventi che non si conoscono si ignorano in silenzio: SumUp può
  // aggiungerne senza avvisare.
  if (evento !== "CHECKOUT_STATUS_CHANGED" || typeof id !== "string" || !/^[\w-]{1,64}$/.test(id)) {
    return new Response(null, { status: 200 });
  }

  try {
    const riferimento = await riferimentoDi(id);
    // Un pagamento che non è partito da questo sito: niente da fare.
    if (!riferimento) return new Response(null, { status: 200 });

    const esito = await confermaPagamento(riferimento);
    // Pagato ma non scritto: un 500 fa riprovare SumUp più tardi.
    if (esito.stato === "pagato" && esito.errore) {
      return new Response("Errore nel registrare l'ordine", { status: 500 });
    }
  } catch (e) {
    console.error("Webhook SumUp: non ho potuto controllare il pagamento", id, e);
    return new Response("Errore", { status: 500 });
  }

  return new Response(null, { status: 200 });
}
