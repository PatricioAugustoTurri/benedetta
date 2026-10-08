import { disiscrivi } from "@/lib/newsletter";

/**
 * La disiscrizione in un clic dei programmi di posta (RFC 8058): Gmail e gli
 * altri mostrano «Annulla iscrizione» accanto al mittente e, quando lo si
 * preme, mandano un POST qui. Senza pagine né pulsanti.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await disiscrivi(token);
  return new Response(null, { status: 200 });
}
