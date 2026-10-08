import { headers } from "next/headers";
import { site } from "@/data/site";

/**
 * L'indirizzo da cui si sta servendo il sito: il dominio in produzione,
 * localhost in sviluppo. Per i link che escono dal sito —il ritorno da
 * Stripe, i link delle mail— e che devono riportare dove si è.
 */
export async function origine(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return host
    ? `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`
    : site.url;
}
