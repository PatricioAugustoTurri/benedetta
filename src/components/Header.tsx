"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown } from "@/components/Icon";
import ShopMenu from "@/components/ShopMenu";
import CarrelloIcona, { nomeCarrello } from "@/components/carrello/CarrelloIcona";
import { contaStampe, useCarrello } from "@/components/carrello/store";
import { shopCategories, shopHref } from "@/data/shop";
import { nav, site } from "@/data/site";

/*
  La classe della riga del pannello laterale.

  Le etichette entrano scalate dal bordo destro, nella stessa direzione in cui
  arriva il pannello. Alla chiusura se ne vanno insieme e in fretta: uscire non
  è un momento, tornare all'opera sì.

  Non dichiara `display`: un percorso è `block` e Shop è `flex`, e se la
  classe condivisa ne portasse uno dei due, quale vince lo deciderebbe
  l'ordine del CSS e non chi scrive il componente.
*/
const ITEM_DRAWER =
  "relative translate-x-5 border-b border-line py-4 font-display text-[clamp(0.875rem,4vw,1.125rem)] font-medium leading-tight text-ink-soft opacity-0 transition-[translate,opacity,color] duration-500 ease-[var(--ease-out-soft)] hover:text-ink data-[active=true]:text-ink group-data-[open=true]/drawer:translate-x-0 group-data-[open=true]/drawer:opacity-100";

/*
  Le righe dentro Shop: rientrate e un gradino sotto, di corpo e d'inchiostro.
  Sono il contenuto di una voce, non altre voci, e senza peso 500 né
  carattere da titolo si leggono come un elenco appeso a Shop e non come
  percorsi alla pari di Works.
*/
const SUBITEM_DRAWER =
  "border-b border-line py-3 pl-3 text-[clamp(0.8125rem,3.6vw,0.9375rem)] leading-tight transition-colors hover:text-ink";

/*
  Lo scaglionamento del pannello, con il passo di 70ms del resto del sito. In
  chiusura, tutti a zero: uscire non è un momento.
*/
const stagger = (open: boolean, n: number) => (open ? `${140 + n * 70}ms` : "0ms");

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Shop nel pannello, aperto o chiuso. Vive qui e non dentro la riga perché
  // si ripristina ogni volta che il pannello si apre.
  const [shopOpen, setShopOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const stampe = contaStampe(useCarrello());
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  // Chiudere con Escape, con la croce o toccando il velo restituisce il fuoco
  // al controllo che ha aperto. Chiudere navigando no: lì il fuoco è della
  // pagina nuova.
  const restoreFocus = useRef(true);

  const close = (restore = true) => {
    restoreFocus.current = restore;
    setOpen(false);
  };

  // Senza scorrimento non c'è opera che passa sotto, quindi lo sfondo e il
  // filetto sono di troppo: la barra parte pulita sulla carta e prende corpo
  // solo quando comincia a esserci qualcosa da coprire.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Se lo schermo cresce fino al desktop, il menu torna in vista sotto il
  // logotipo e il pannello smette di avere senso.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return;

    // Il pannello è modale: l'archivio dietro non si scorre finché è aperto.
    const previousOverflow = document.body.style.overflow;
    const toggle = toggleRef.current;
    document.body.style.overflow = "hidden";

    // Il fuoco entra nel pannello e ci resta: il logotipo e il resto della
    // pagina sono ancora nel DOM e senza questo il tab finirebbe dietro il velo.
    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [],
      );

    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (restoreFocus.current) toggle?.focus();
      restoreFocus.current = true;
    };
  }, [open]);

  // "Works" vive nella radice, quindi comanda anche dentro /opera/<slug>.
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/opera") : pathname.startsWith(href);

  // Il glifo da 20px resta allineato al margine di pagina: il pulsante misura
  // 40 e l'icona è centrata, quindi il riquadro sporge di metà differenza.
  const controlInset = "right-[calc(var(--gutter)-0.625rem)] top-3";

  return (
    <>
      {/*
        L'header prende materia solo quando c'è opera che passa sotto
        (`data-scrolled`): carta all'85% e sfocatura. È una barra, e una barra
        lascia vedere quello che succede dietro. In cima a tutto non c'è niente
        da coprire, quindi parte pulita sulla carta.

        Con il foglio di Shop aperto prende carta piena e filetto anche in
        cima: il foglio pende da quel filetto, e senza penderebbe dal nulla.
      */}
      <header
        data-scrolled={scrolled}
        className="sticky top-0 z-40 border-b border-transparent transition-[background-color,border-color,backdrop-filter] duration-300 has-[[data-shop-open=true]]:border-line/70 has-[[data-shop-open=true]]:bg-paper! data-[scrolled=true]:border-line/70 data-[scrolled=true]:bg-paper/85 data-[scrolled=true]:backdrop-blur-md"
      >
        {/*
          Insegna centrata: comanda il logotipo e il menu si appoggia appena
          sotto. Sul telefono le etichette si trasferiscono nel pannello e qui
          resta solo la firma.
        */}
        <div className="shell relative flex flex-col items-center py-4 md:py-5">
          {/*
            Il logotipo è la sua scrittura, scansionata e ritagliata: non c'è
            un carattere che lo componga. Va con alt vuoto di proposito —il
            nome accessibile lo dà già l'aria-label del link, e ripeterlo
            sull'immagine lo farebbe annunciare due volte.
            width/height sono quelli del file, perché lo spazio sia riservato
            prima del caricamento e l'header non salti.
          */}
          <Link href="/" className="block" aria-label={`${site.signature} — archivio`}>
            <Image
              src="/benedetta-zibetti-wordmark.png"
              alt=""
              width={602}
              height={375}
              priority
              sizes="(min-width: 768px) 136px, 100px"
              className="h-auto w-[100px] md:w-[136px]"
            />
          </Link>

          {/*
            Lo stacco è piccolo ed è misurato dal bordo del logotipo: il
            ritaglio è aderente all'inchiostro, senza margine incorporato,
            quindi questo gap è esattamente quello che si vede. Con più aria il
            menu smetterebbe di leggersi come parte della stessa insegna.
          */}
          <nav
            className="mt-2 hidden items-center gap-8 md:mt-2.5 md:flex md:gap-10"
            aria-label="Navigazione principale"
          >
            {nav.map((item) =>
              /*
                Shop è l'unica voce che non è solo un link: la parola porta a
                /shop e il chevron accanto apre le categorie. Vedi ShopMenu.
                Nel pannello del telefono è una riga sola che si apre sul
                posto: vedi più sotto.
              */
              item.href === "/shop" ? (
                <ShopMenu key={item.href} />
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={isActive(item.href)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="link-underline text-[0.9375rem] text-ink-soft transition-colors hover:text-ink data-[active=true]:text-ink"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => {
              // Il pannello si apre sempre con Shop chiuso, tranne quando si è
              // già in /shop: lì le categorie sono il posto in cui ci si trova.
              setShopOpen(pathname.startsWith("/shop"));
              setOpen(true);
            }}
            aria-expanded={open}
            aria-controls="menu-cajon"
            className={`absolute ${controlInset} flex h-10 w-10 items-center justify-center md:hidden`}
          >
            <span className="sr-only">
              Apri menu{stampe > 0 ? ` — ${nomeCarrello(stampe).toLowerCase()}` : ""}
            </span>
            {/* Due filetti dello stesso spessore del tratto delle icone. */}
            <span aria-hidden="true" className="relative block h-2.5 w-5">
              <span className="absolute left-0 top-0 block h-px w-full bg-ink" />
              <span className="absolute bottom-0 left-0 block h-px w-full bg-ink" />
              {/*
                Sul telefono il carrello vive dentro il pannello, quindi da
                chiuso non si vedrebbe che c'è qualcosa dentro. Il punto lo
                dice: terracotta come segno, lo stesso del «sei qui» del
                pannello, appoggiato all'angolo dei filetti.
              */}
              {stampe > 0 && (
                <span className="absolute -right-1.5 -top-1.5 block h-1.5 w-1.5 rounded-full bg-accent" />
              )}
            </span>
          </button>

          {/*
            Il carrello, sul bordo destro e a metà dell'insegna: è un controllo
            di tutta la testata, non una voce del menu, quindi non sta in fila
            con Works e About me. Il margine negativo allinea il disegno —non
            l'area di tocco da 40px— al margine della pagina, come fa il
            pulsante del menu sul telefono.
          */}
          <CarrelloIcona className="absolute right-[calc(var(--gutter)-0.5rem)] top-1/2 hidden -translate-y-1/2 md:flex" />
        </div>
      </header>

      {/*
        Velo: la metà che resta in vista è ancora l'archivio, ma attenuato e
        fuori fuoco, così il pannello si legge come uno strato sopra e non come
        un'altra colonna della pagina.
      */}
      <div
        data-drawer-scrim
        data-open={open}
        onClick={() => close()}
        aria-hidden="true"
        className="fixed inset-0 z-50 bg-ink/20 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 ease-[var(--ease-out-soft)] data-[open=false]:pointer-events-none data-[open=true]:opacity-100 md:hidden"
      />

      {/*
        Pannello a mezzo schermo. Carta su carta: quello che lo separa
        dall'archivio è un filetto e un gradino di tono, non un'ombra.
      */}
      <div
        ref={panelRef}
        id="menu-cajon"
        data-drawer
        data-open={open}
        inert={!open}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="group/drawer fixed inset-y-0 right-0 z-50 flex w-1/2 translate-x-full flex-col justify-between overflow-y-auto overscroll-contain border-l border-line bg-paper px-[var(--gutter)] pb-10 pt-24 transition-transform duration-[440ms] ease-[var(--ease-out-soft)] data-[open=false]:duration-[280ms] data-[open=true]:translate-x-0 md:hidden"
      >
        <button
          type="button"
          onClick={() => close()}
          className={`absolute ${controlInset} flex h-10 w-10 items-center justify-center`}
        >
          <span className="sr-only">Chiudi menu</span>
          {/*
            Gli stessi due filetti del pulsante di apertura, ormai incrociati:
            il controllo non cambia forma quando il pannello si apre, cambia
            stato.
          */}
          <span aria-hidden="true" className="relative block h-2.5 w-5">
            <span className="absolute left-0 top-1/2 block h-px w-full -translate-y-1/2 rotate-45 bg-ink" />
            <span className="absolute left-0 top-1/2 block h-px w-full -translate-y-1/2 -rotate-45 bg-ink" />
          </span>
        </button>

        <nav className="border-t border-line" aria-label="Navigazione principale">
          {nav.map((item, i) => (
            <Fragment key={item.href}>
              {item.href === "/shop" ? (
                /*
                  Nel pannello Shop non si divide come nella barra: tutta la
                  riga apre. Qui non c'è il passaggio del mouse a separare i
                  due gesti, quindi una riga divisa metterebbe due bersagli
                  di tocco uno accanto all'altro —chi vuole vedere le
                  categorie e chi vuole la pagina— e sbagliare sarebbe
                  normale. Un solo controllo largo apre, e l'uscita a /shop è
                  l'ultima riga di quello che si apre.

                  E non spunta un foglio: si apre sul posto e spinge giù il
                  resto. Stesso contenuto, il gesto che il dito ha.
                */
                <>
                  <button
                    type="button"
                    data-drawer-item
                    aria-expanded={shopOpen}
                    aria-controls="shop-cajon"
                    data-open={shopOpen}
                    data-active={isActive("/shop")}
                    onClick={() => setShopOpen((v) => !v)}
                    style={{ transitionDelay: stagger(open, i) }}
                    className={`group/shop flex w-full items-center justify-between gap-2 text-left ${ITEM_DRAWER}`}
                  >
                    {isActive("/shop") && (
                      <span
                        aria-hidden="true"
                        className="absolute -left-3 top-1/2 block h-1 w-1 -translate-y-1/2 rounded-full bg-accent"
                      />
                    )}
                    <span>{item.label}</span>
                    {/*
                      Lo stesso chevron dell'etichetta Shop della barra,
                      girato di 180° all'apertura: è lo stesso controllo che
                      dice la stessa cosa in due larghezze, e due segni
                      diversi sarebbero due lingue nella stessa insegna.
                    */}
                    <ChevronDown className="shrink-0 transition-transform duration-[380ms] ease-[var(--ease-out-soft)] group-data-[open=true]/shop:rotate-180" />
                  </button>

                  {/*
                    Lo srotolamento: la riga passa da 0fr a 1fr, così
                    l'altezza la mette il contenuto. Chiuso resta `inert`,
                    perché il tab —e la trappola del fuoco del pannello— non
                    finisca su categorie che non si vedono.
                  */}
                  <div
                    id="shop-cajon"
                    data-open={shopOpen}
                    inert={!shopOpen}
                    className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-[380ms] ease-[var(--ease-out-soft)] data-[open=true]:grid-rows-[1fr]"
                  >
                    <ul aria-label="Categorie" className="min-h-0 overflow-hidden">
                      {shopCategories.map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={shopHref(c)}
                            onClick={() => close(false)}
                            className={`block text-ink-faint ${SUBITEM_DRAWER}`}
                          >
                            {c.label}
                          </Link>
                        </li>
                      ))}

                      {/*
                        L'ultima riga chiude l'elenco e ne esce: nel pannello
                        è l'unica porta a /shop, perché qui l'etichetta Shop
                        apre invece di navigare. Si distingue per due cose e
                        nessuna è colore: l'inchiostro sale di un gradino, da
                        `ink-faint` a `ink-soft`, e porta la freccia a
                        margine, che eredita `currentColor` e viaggia con la
                        riga al passaggio.
                      */}
                      <li>
                        <Link
                          href="/shop"
                          onClick={() => close(false)}
                          data-active={isActive("/shop")}
                          aria-current={isActive("/shop") ? "page" : undefined}
                          className={`flex items-center justify-between gap-2 text-ink-soft data-[active=true]:text-ink ${SUBITEM_DRAWER}`}
                        >
                          <span>Tutto lo Shop</span>
                          <ArrowRight size={16} className="shrink-0" />
                        </Link>
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => close(false)}
                  data-drawer-item
                  data-active={isActive(item.href)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  /*
                    Il corpo lo decide la cliente, e si è spostato due volte: è
                    arrivato a essere un titolo, si è chiesta la metà esatta (10px
                    sul telefono più stretto, 14px al bordo del pannello) e adesso
                    un gradino più su, da 14px a 18px. È il punto in cui si legge
                    senza sforzo e non torna ancora a essere un titolo che compete
                    con il logotipo che ha sopra.
  
                    Resta senza `display-section`: il tracking negativo di quel
                    gradino è una correzione per corpi grandi e a questa misura
                    danneggerebbe la lettura. Rimane il peso 500.
  
                    Il `py-4` non si tocca. L'area di tocco la fissa il padding e
                    non la parola, quindi misurava già bene a 10px e misura uguale
                    qui: ingrandire l'etichetta migliora la lettura senza spostare
                    il bianco.
                  */
                  style={{ transitionDelay: stagger(open, i) }}
                  className={`block ${ITEM_DRAWER}`}
                >
                  {/*
                    Il segno del punto in cui ci si trova, nel margine per non
                    rubare larghezza all'etichetta: terracotta come segno, mai come
                    campo.
                  */}
                  {isActive(item.href) && (
                    <span
                      aria-hidden="true"
                      className="absolute -left-3 top-1/2 block h-1 w-1 -translate-y-1/2 rounded-full bg-accent"
                    />
                  )}
                  {item.label}
                </Link>
              )}
            </Fragment>
          ))}

          {/*
            Il carrello nel pannello: una riga come le altre, perché sul
            telefono è qui che lo si cerca. Il numero va a destra in cifre
            tabulari e inchiostro pallido, dove nelle righe sopra c'è il
            chevron: un dato della riga, non un'etichetta che compete con la
            parola.
          */}
          <Link
            href="/carrello"
            onClick={() => close(false)}
            data-drawer-item
            data-active={pathname.startsWith("/carrello")}
            aria-current={pathname.startsWith("/carrello") ? "page" : undefined}
            aria-label={nomeCarrello(stampe)}
            style={{ transitionDelay: stagger(open, nav.length) }}
            className={`flex items-baseline justify-between gap-2 ${ITEM_DRAWER}`}
          >
            {pathname.startsWith("/carrello") && (
              <span
                aria-hidden="true"
                className="absolute -left-3 top-1/2 block h-1 w-1 -translate-y-1/2 rounded-full bg-accent"
              />
            )}
            <span>Carrello</span>
            {stampe > 0 && (
              <span className="figures text-[0.9375rem] font-normal text-ink-faint">{stampe}</span>
            )}
          </Link>
        </nav>

        <div
          data-drawer-item
          className="translate-x-5 opacity-0 transition-[translate,opacity] duration-500 ease-[var(--ease-out-soft)] group-data-[open=true]/drawer:translate-x-0 group-data-[open=true]/drawer:opacity-100"
          style={{ transitionDelay: stagger(open, nav.length + 1) }}
        >
          <p className="label">Scrivimi</p>
          <a
            href={`mailto:${site.email}`}
            onClick={() => close(false)}
            className="link-underline mt-2 block break-all text-xs text-ink-soft transition-colors hover:text-ink"
          >
            {site.email}
          </a>
        </div>
      </div>
    </>
  );
}
