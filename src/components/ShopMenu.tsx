"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "@/components/Icon";
import { shopCategories, shopHref } from "@/data/shop";

/**
 * "Shop" nella barra: un'etichetta che fa due cose.
 *
 * Sono due controlli, non uno con due significati. La parola è un link a
 * `/shop`, l'indice completo delle categorie; il chevron accanto è un
 * pulsante che apre il foglio. Si vedono come una cosa sola —la
 * sottolineatura e il cambio d'inchiostro li percorrono insieme— ma ognuno ha
 * la sua destinazione, il suo fuoco e la sua area di tocco.
 *
 * Dividerlo è quello che rende il gesto non ambiguo. Un solo elemento che
 * naviga al click e si apre al passaggio del mouse lascia senza uscita chi non
 * ha un mouse: su un tablet lo stesso tocco dovrebbe scegliere fra andare
 * alla pagina e aprire il menu, e qualunque cosa scelga si porta via l'altra.
 *
 * I tre gesti, quindi:
 *
 * - **Mouse:** appoggiarlo su qualsiasi parte dell'insieme apre il foglio,
 *   con 140ms di ritardo perché attraversare l'etichetta diretti a un'altra
 *   non lo faccia scattare, e 220ms all'uscita, perché il viaggio del cursore
 *   dall'etichetta al foglio non lo chiuda a metà. Il click va alla pagina.
 * - **Tastiera:** il link naviga con Invio; il chevron è un `button` con
 *   `aria-expanded`, quindi apre con Invio o Spazio. Non apre ricevendo il
 *   fuoco: un pannello che si apre solo tabulando sorprende. Finché il fuoco
 *   è dentro resta aperto; uscendo dall'insieme si chiude, ed Esc lo chiude
 *   restituendo il fuoco al chevron, che è quello che l'ha aperto.
 * - **Dito:** la parola porta alla pagina, il chevron apre il foglio. Per
 *   questo l'entrata del puntatore conta solo se `pointerType` è mouse —
 *   altrimenti lo stesso tocco aprirebbe e chiuderebbe.
 *
 * Chiuso, il foglio resta `inert`: fuori dall'ordine di tabulazione e
 * dall'albero di accessibilità, perché non si possa tabulare su categorie
 * invisibili.
 */
export default function ShopMenu() {
  const pathname = usePathname();
  const onShop = pathname.startsWith("/shop");
  const [open, setOpen] = useState(false);
  const [gap, setGap] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const disclosureRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const schedule = (next: boolean, delay: number) => {
    cancel();
    timer.current = setTimeout(() => setOpen(next), delay);
  };

  // Chiudere navigando: dopo il click il mouse resta sopra, quindi la chiusura
  // per uscita del puntatore non arriva mai, e il foglio resterebbe aperto
  // sopra la pagina che ha appena aperto.
  const closeNow = () => {
    cancel();
    setOpen(false);
  };

  useEffect(() => cancel, [cancel]);

  /*
    Il foglio pende dal filetto in basso dell'insegna, non dall'etichetta: è
    quello il bordo che gli fa da coperchio, e per questo non ha bordo sopra.
    Il tratto dall'etichetta a quel filetto è il margine inferiore
    dell'header, che cambia con il breakpoint, quindi si misura invece di
    scriversi: si legge la distanza fra il fondo di questo blocco e il fondo
    dell'header, e si rilegge quando l'header cambia altezza.

    Si posiziona `absolute` e non `fixed` di proposito: l'header prende
    `backdrop-filter` scorrendo, e un antenato con filtro diventa il blocco
    contenitore di ogni discendente `fixed`. Con `absolute` l'ancora è questo
    blocco —l'etichetta— e il foglio resta centrato sotto di essa qualunque
    cosa succeda all'header.
  */
  useEffect(() => {
    const root = rootRef.current;
    const header = root?.closest("header");
    if (!root || !header) return;
    const measure = () =>
      setGap(header.getBoundingClientRect().bottom - root.getBoundingClientRect().bottom);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      cancel();
      setOpen(false);
      disclosureRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, cancel]);

  return (
    /*
      `data-shop-open` lo legge l'header con `:has()` per prendere carta,
      filetto e sfocatura mentre il foglio è aperto, anche con la pagina in
      cima. Senza, il foglio penderebbe da un bordo che non è disegnato.
    */
    <div
      ref={rootRef}
      data-shop-open={open}
      className="relative"
      onPointerEnter={(e) => e.pointerType === "mouse" && schedule(true, 140)}
      onPointerLeave={(e) => e.pointerType === "mouse" && schedule(false, 220)}
      onFocus={cancel}
      onBlur={(e) => {
        // Non chiude passando da una categoria alla successiva dentro il foglio.
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        closeNow();
      }}
    >
      {/*
        I due controlli vivono sulla stessa riga e condividono lo stato
        visivo: `link-underline-host` fa sì che la sottolineatura della parola
        si disegni anche quando il mouse o il fuoco sono sul chevron, così la
        coppia si legge come un'etichetta e non come due cose rimaste
        attaccate.

        Due attributi e non uno: `data-open` è lo stato del foglio e lo legge
        solo la rotazione del chevron; `data-active` è "sei qui", che vale con
        il foglio aperto e anche stando su /shop. Uniti, il chevron
        comparirebbe girato entrando nella pagina con il menu chiuso.
      */}
      <div
        data-open={open}
        data-active={open || onShop}
        className="group/shop link-underline-host flex items-center text-[0.9375rem] text-ink-soft transition-colors hover:text-ink data-[active=true]:text-ink"
      >
        <Link
          href="/shop"
          aria-current={onShop ? "page" : undefined}
          onClick={closeNow}
          className="link-underline"
          data-active={open || onShop}
        >
          Shop
        </Link>

        {/*
          Il pulsante che apre il foglio. Va con `pl-1.5 pr-1 -mr-1` e non con
          un `gap`: lo spazio fra la parola e il chevron deve essere area
          toccabile del pulsante, non terra di nessuno, e il margine negativo
          restituisce il padding di destra perché l'etichetta continui a
          misurare quello che si vede.
        */}
        <button
          ref={disclosureRef}
          type="button"
          aria-expanded={open}
          aria-controls="shop-submenu"
          aria-label="Categorie"
          onClick={() => {
            cancel();
            setOpen((v) => !v);
          }}
          className="-mr-1 flex items-center py-1 pl-1.5 pr-1"
        >
          {/*
            Gira di 180° con lo stesso battito di 420ms con cui si srotola il
            foglio: è un solo movimento contato due volte.
          */}
          <ChevronDown className="shrink-0 transition-transform duration-[420ms] ease-[var(--ease-out-soft)] group-data-[open=true]/shop:rotate-180" />
        </button>
      </div>

      {/*
        Un foglio di 19rem centrato sotto l'etichetta, non una fascia da bordo
        a bordo. Piccolo ha bisogno di fianchi, e in questo sistema non ci sono
        ombre che li disegnino: li disegnano tre filetti di `line` —sinistra,
        destra e piede— mentre il coperchio è il filetto dell'header, da cui
        pende.

        La carta è piena, non al 95% con sfocatura come la barra: una barra è
        qualcosa attraverso cui si vede, un foglio no. Per questo anche
        l'header passa a carta piena mentre il foglio è aperto.

        E si sovrappone invece di spingere: un menu che sposta la pagina in
        basso al passaggio del mouse è una trappola, non una transizione.
      */}
      <div
        id="shop-submenu"
        inert={!open}
        data-open={open}
        style={{ top: `calc(100% + ${gap}px)` }}
        className="group/panel pointer-events-none absolute left-1/2 z-10 w-[19rem] -translate-x-1/2 border-x border-b border-line/0 bg-paper/0 transition-[background-color,border-color] duration-[420ms] ease-[var(--ease-out-soft)] data-[open=true]:pointer-events-auto data-[open=true]:border-line data-[open=true]:bg-paper"
      >
        {/*
          Lo srotolamento: la riga passa da 0fr a 1fr, così l'altezza la mette
          il contenuto e non un numero magico che invecchia quando cambiano le
          categorie.
        */}
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-[420ms] ease-[var(--ease-out-soft)] group-data-[open=true]/panel:grid-rows-[1fr]">
          <div className="min-h-0 overflow-hidden">
            <div className="px-5 pb-5 pt-2">
              <ul aria-label="Categorie">
                {shopCategories.map((c, i) => (
                  <li key={c.slug}>
                    <Link
                      href={shopHref(c)}
                      onClick={closeNow}
                      data-shop-item
                      /*
                        Entrano scaglionate con il passo di 70ms del resto del
                        sito, a partire da 90ms perché l'ultima arrivi prima
                        che finisca lo srotolamento. In chiusura se ne vanno
                        insieme e senza ritardo: uscire non è un momento.
                      */
                      style={{ transitionDelay: open ? `${90 + i * 70}ms` : "0ms" }}
                      className="group relative block -translate-y-1.5 border-b border-line py-3 opacity-0 transition-[translate,opacity] duration-500 ease-[var(--ease-out-soft)] group-data-[open=true]/panel:translate-y-0 group-data-[open=true]/panel:opacity-100"
                    >
                      {/*
                        Il segno del punto, nel margine perché i nomi restino a
                        piombo: terracotta come segno, mai come campo.
                      */}
                      <span
                        aria-hidden="true"
                        className="absolute -left-2.5 top-[1.0625rem] block h-1 w-1 rounded-full bg-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      />
                      <span className="block text-[0.9375rem] leading-snug text-ink-soft transition-colors group-hover:text-ink">
                        {c.label}
                      </span>
                      {c.note && (
                        <span className="mt-0.5 block text-xs leading-relaxed text-ink-faint">
                          {c.note}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
