import type Stripe from "stripe";
import { creaBiglietto, segnaUsato } from "@/lib/codici";
import { avvisaOrdine, confermaOrdine, correoConfigurado } from "@/lib/correo";
import { registraOrdine, type RigaOrdine } from "@/lib/prodotti";
import { stripe, stripeConfigurato } from "@/lib/stripe";

/**
 * Il webhook di Stripe: l'unico posto in cui nasce un ordine.
 *
 * Non la pagina di ringraziamento, perché quella dipende dal fatto che chi
 * paga torni sul sito, e chi chiude la scheda subito dopo aver pagato non ci
 * torna. Stripe invece chiama qui sempre, e se non riceve un 200 riprova per
 * giorni.
 *
 * **Si verifica la firma prima di leggere una sola riga.** L'indirizzo è
 * pubblico: senza la firma, chiunque potrebbe mandare qui un «pagato» finto e
 * far nascere un ordine. La firma la calcola Stripe con il segreto del
 * webhook (`STRIPE_WEBHOOK_SECRET`), sul corpo esatto della richiesta: per
 * questo il corpo si legge come testo e non come JSON.
 */
export async function POST(request: Request) {
  const segreto = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeConfigurato() || !segreto) {
    return new Response("Stripe non configurato", { status: 503 });
  }

  const corpo = await request.text();
  const firma = request.headers.get("stripe-signature");
  if (!firma) return new Response("Firma mancante", { status: 400 });

  let evento: Stripe.Event;
  try {
    evento = stripe().webhooks.constructEvent(corpo, firma, segreto);
  } catch {
    return new Response("Firma non valida", { status: 400 });
  }

  /*
    Due eventi e non uno: con la carta il pagamento è confermato già a
    `completed`; con i metodi che si confermano dopo —un bonifico, alcuni
    portafogli— `completed` arriva non pagato e il pagamento vero arriva con
    `async_payment_succeeded`. Si registra quando risulta pagato, in uno dei
    due.
  */
  if (
    evento.type === "checkout.session.completed" ||
    evento.type === "checkout.session.async_payment_succeeded"
  ) {
    const sessione = evento.data.object;
    if (sessione.payment_status === "paid") {
      try {
        await registra(sessione);
      } catch (e) {
        // Un 500 fa riprovare Stripe più tardi: meglio che perdere l'ordine.
        console.error("Webhook: non ho potuto registrare l'ordine", sessione.id, e);
        return new Response("Errore nel registrare l'ordine", { status: 500 });
      }
    }
  }

  return Response.json({ ricevuto: true });
}

async function registra(sessione: Stripe.Checkout.Session) {
  const righe = await stripe().checkout.sessions.listLineItems(sessione.id, {
    expand: ["data.price.product"],
    limit: 100,
  });

  const voci: RigaOrdine[] = righe.data.map((r) => {
    const prodotto = r.price?.product;
    const meta =
      prodotto && typeof prodotto === "object" && !("deleted" in prodotto && prodotto.deleted)
        ? (prodotto as Stripe.Product).metadata
        : {};
    const quantita = r.quantity ?? 1;
    return {
      slug: meta.slug ?? "",
      title: meta.title ?? r.description ?? "",
      formato: meta.formato ?? "",
      prezzo: Math.round((r.amount_subtotal ?? 0) / quantita),
      quantita,
    };
  });

  const spedizione = sessione.collected_information?.shipping_details;
  const indirizzo = spedizione?.address ?? sessione.customer_details?.address ?? null;
  const email = sessione.customer_details?.email;
  if (!email) throw new Error("La sessione non ha un'email");

  const ordine = await registraOrdine({
    stripeSessionId: sessione.id,
    nome: spedizione?.name ?? sessione.customer_details?.name ?? null,
    email,
    indirizzo: {
      line1: indirizzo?.line1 ?? null,
      line2: indirizzo?.line2 ?? null,
      city: indirizzo?.city ?? null,
      postal_code: indirizzo?.postal_code ?? null,
      state: indirizzo?.state ?? null,
      country: indirizzo?.country ?? null,
    },
    righe: voci,
    subtotale: sessione.amount_subtotal ?? 0,
    spedizione: sessione.total_details?.amount_shipping ?? 0,
    sconto: sessione.total_details?.amount_discount ?? 0,
    codice: sessione.metadata?.codice || null,
    totale: sessione.amount_total ?? 0,
  });

  // Già registrato: è un evento ripetuto, e le mail sono già partite.
  if (!ordine) return;

  /*
    I codici, dopo l'ordine e senza farlo fallire: l'ordine è la cosa che non
    si può perdere. Un biglietto che non nasce qui si crea dalla pagina degli
    ordini; un codice monouso non segnato è al peggio un secondo uso.
  */
  try {
    if (ordine.codice) await segnaUsato(ordine.codice, ordine.id);
    await creaBiglietto(ordine.id);
  } catch (e) {
    console.error("Webhook: codici dell'ordine non aggiornati", ordine.id, e);
  }

  if (!correoConfigurado()) return;

  /*
    Le mail non fanno fallire il webhook. L'ordine è già scritto; se Resend
    non risponde e qui si restituisse un errore, Stripe riproverebbe, il
    secondo tentativo troverebbe l'ordine già registrato e non manderebbe
    niente lo stesso. Meglio registrare il fallimento e rispondere 200: lei
    vede l'ordine in /admin/ordini comunque.
  */
  const esiti = await Promise.allSettled([avvisaOrdine(ordine), confermaOrdine(ordine)]);
  for (const e of esiti) {
    if (e.status === "rejected") console.error("Webhook: mail dell'ordine non partita", e.reason);
  }
}
