import { prezzo, prezzoMinimo, prodottoHref } from "@/data/shop";
import type { VoceNewsletter } from "@/lib/correo";
import type { VoceInvio } from "@/lib/newsletter";
import type { Prodotto } from "@/lib/prodotti";
import { immagineFerma } from "@/lib/video";
import type { Work, WorkImage } from "@/lib/works";

/**
 * L'immagine come entra in una mail: assoluta, ferma, e già tagliata in 4:5
 * alla misura della colonna (il doppio, per gli schermi densi). I programmi di
 * posta non ridimensionano bene, e una scansione da 8 MB in una mail è una
 * mail che non si apre.
 */
function immagineMail(img: WorkImage | undefined, base: string): string | null {
  if (!img) return null;
  const url = immagineFerma(img);
  if (url.startsWith("/")) return `${base}${url}`;
  return url.replace("/upload/", "/upload/c_fill,g_auto,w_1040,h_1300,q_auto,f_jpg/");
}

/**
 * Le novità come entrano nella newsletter, prima le opere e poi le stampe.
 * Lo usano l'invio, la prova e l'anteprima, così le tre mostrano la stessa
 * mail.
 */
export function vociNewsletter(
  opere: Work[],
  stampe: Prodotto[],
  base: string,
): (VoceNewsletter & VoceInvio)[] {
  return [
    ...opere.map((w) => ({
      tipo: "opera" as const,
      id: w.id,
      title: w.title,
      riga: ["Nuova opera", String(w.year), w.tecnica].filter(Boolean).join(" · "),
      url: `${base}/opera/${w.slug}`,
      immagine: immagineMail(w.image[0], base),
    })),
    ...stampe.map((p) => {
      const minimo = prezzoMinimo(p.formati);
      return {
        tipo: "stampa" as const,
        id: p.id,
        title: p.title,
        riga: minimo !== null ? `Stampa · da ${prezzo(minimo)}` : "Stampa",
        url: `${base}${prodottoHref(p)}`,
        immagine: immagineMail(p.image[0], base),
      };
    }),
  ];
}
