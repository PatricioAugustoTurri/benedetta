"use client";

import Image, { type ImageProps } from "next/image";
import { caricatoreCloudinary, esCloudinary } from "@/lib/caricatoreCloudinary";

/**
 * `next/image`, che chiede le immagini di Cloudinary direttamente a
 * Cloudinary (vedi `caricatoreCloudinary`) e lascia le altre all'ottimizzatore
 * di Next.
 *
 * Non è un `loaderFile` globale in next.config: con un caricatore globale Next
 * spegne `/_next/image`, e le immagini di `public/` —la firma, i post di
 * Instagram, gli originali da 2–3 MB— arriverebbero intere. Così ognuna va da
 * chi la sa servire meglio.
 *
 * È un componente client perché un caricatore è una funzione, e una funzione
 * non passa da un componente server a uno client. `next/image` è già client:
 * questo non aggiunge niente al bundle.
 */
export default function Immagine({ alt, ...props }: ImageProps) {
  const cloudinary = typeof props.src === "string" && esCloudinary(props.src);
  return <Image loader={cloudinary ? caricatoreCloudinary : undefined} alt={alt} {...props} />;
}
