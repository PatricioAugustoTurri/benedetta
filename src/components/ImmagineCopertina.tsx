"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * Un `<Image>` che dice quando è arrivato.
 *
 * Serve alla cella che lo contiene (`.copertina-attesa` in globals.css):
 * finché la copertina non c'è, la cella disegna il suo scheletro —il
 * ritaglio 4:5 in carta più scura, con una luce che lo attraversa— e così chi
 * apre una categoria vede che lì va una stampa, non un buco. Appena
 * l'immagine si carica (o fallisce: uno scheletro che gira per sempre mente
 * peggio di una cella vuota) segna `data-caricata` e lo scheletro si spegne.
 *
 * **Le copertine della prima schermata non sfumano.** Sono `priority`,
 * arrivano spesso prima che React si svegli, e nasconderle fino ad allora
 * vorrebbe dire mostrarle più tardi —anche a Google, che conta l'immagine
 * più grande solo quando si vede. Sfumano solo quelle che si caricano
 * scorrendo, che arrivano sempre dopo.
 */
export default function ImmagineCopertina({
  alt,
  className = "",
  priority,
  onLoad,
  onError,
  ...props
}: ImageProps) {
  const [caricata, setCaricata] = useState(false);

  return (
    <Image
      {...props}
      alt={alt}
      priority={priority}
      data-caricata={caricata || undefined}
      onLoad={(e) => {
        setCaricata(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        setCaricata(true);
        onError?.(e);
      }}
      className={`copertina-img${priority ? "" : " copertina-img--sfuma"} ${className}`}
    />
  );
}
