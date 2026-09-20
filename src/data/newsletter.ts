import { site } from "@/data/site";

/**
 * La newsletter.
 *
 * **Esto es un pendiente de infraestructura, no de contenido.** No hay
 * servicio de envío contratado —Buttondown, Mailchimp, Resend— ni base donde
 * guardar una dirección, y montar un campo que no guarda nada sería prometer
 * una lista que no existe. Así que mientras `endpoint` sea `null`, el
 * formulario hace exactamente lo que ya hacen el Shop y el formulario de
 * contacto: arma un mail y se lo pasa al programa de correo del visitante.
 *
 * La diferencia importa: la dirección llega igual, a su bandeja, y ella la
 * anota a mano. Es una lista de correo administrada a mano, que es una cosa
 * que sí existe, en vez de un alta automática que no.
 *
 * El día que haya servicio cambia una línea:
 *
 *   export const endpoint: string | null = "https://…/subscribe";
 *
 * y `NewsletterForm` hace POST en vez de abrir el mail. Lo que no cambia es
 * el texto de acá abajo: lo que promete ya es lo que se puede cumplir.
 */
export const endpoint: string | null = null;

/**
 * Qué se promete. Sin frecuencia —"una vez al mes" es una promesa que nadie
 * hizo— y sin exclusividades inventadas. Sólo el motivo del mensaje.
 */
export const pitch = "Ti scrivo quando ci sono lavori nuovi o stampe disponibili.";

/** El mail de alta, con la dirección del visitante ya en el cuerpo. */
export function subscribeHref(email: string): string {
  const subject = "Newsletter — iscrizione";
  const body = `Vorrei iscrivermi alla newsletter.\n\n${email.trim()}`;
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
