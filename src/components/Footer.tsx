import Image from "next/image";
import Link from "next/link";
import { ArrowUp, ArrowUpRight, Mail } from "@/components/Icon";
import NewsletterForm from "@/components/NewsletterForm";
import Reveal from "@/components/Reveal";
import { legale, legaliPronte } from "@/data/legale";
import { footerNav, site } from "@/data/site";
import { shopCategories, shopHref } from "@/data/shop";
import { posts } from "@/data/instagram";

/**
 * Il footer.
 *
 * Tre fasce separate da filetti:
 *
 *   1. Il canale       — la striscia di Instagram, per chi ancora non scrive.
 *   2. L'indice        — marchio, indirizzo, percorsi, negozio, iscrizione alla newsletter.
 *   3. Il testo piccolo — copyright e ritorno in cima.
 *
 * **Il footer non chiude il sito con una richiesta.** C'è stata una fascia di
 * apertura con una frase grande e la mail, ed è stata tolta su richiesta della
 * cliente: l'archivio finisce con l'opera e il footer è un indice, non
 * un'ultima insistenza. La conseguenza è che l'indirizzo di posta deve essere
 * in vista qui sotto —è l'unico che resta fuori da /contatti—, e per questo va
 * nella colonna della firma con la busta disegnata, che è lo stesso gesto del
 * "Chiedi info" di ogni opera.
 *
 * L'aria che lo separa dal contenuto si è accorciata su richiesta della
 * cliente: erano 7rem e 9rem, sono rimasti 5rem e 7rem. Il footer aggiunge i
 * suoi —la prima fascia apre con `py-10 md:py-12`— quindi dall'ultima riga
 * della pagina alla prima del footer c'è ancora aria in abbondanza; quello che
 * si è tolto è il vuoto che faceva dubitare che la pagina fosse finita.
 *
 * Il filetto di apertura vive in ogni fascia e non nel `<footer>`: se la
 * striscia resta senza post non si disegna, e un bordo sull'elemento genitore
 * sarebbe rimasto attaccato a quello della fascia successiva, con due hairline
 * dove il sistema ne ha una.
 *
 * Questo è un componente server. L'unica parte client è l'iscrizione alla
 * newsletter, che è un modulo; il resto del footer di ogni pagina si serve
 * come HTML.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 md:mt-28">
      {/*
        La striscia di Instagram: i tre pezzi che ha scelto lei, in fila. Non è
        una seconda galleria, e quello che la separa dalla griglia dell'opera
        non è più la proporzione —sono quadrate entrambe da quando la griglia
        ha smesso di ritagliare in verticale— ma tutto il resto: qui i pezzi
        vanno muti, senza titolo né anno né scheda, più piccoli, e su un'unica
        riga contro la colonna dell'etichetta. La striscia dice "ce n'è altra e
        continua altrove", non "guarda queste tre".

        Se un giorno le due si confondessero, quello da separare è la misura e
        il silenzio, non tornare a storcere una delle due.

        Il numero di colonne esce dalla lista e non è scritto a mano: con tre
        pezzi la riga è di tre, e se domani ne entra un quarto si distribuisce
        da sola invece di lasciare un buco al margine.
      */}
      {posts.length > 0 && (
        <section className="shell border-t border-line py-10 md:py-12" aria-labelledby="footer-social">
          <Reveal>
            {/*
              A tutta larghezza, la striscia si mangiava metà schermo e smetteva
              di essere una striscia: quattro quadrati da 300px fanno
              concorrenza alla griglia dell'opera invece di chiuderla. Da 768px
              passa alla geometria che usano già le pagine interne —etichetta
              nella colonna stretta di sinistra, tavola nelle otto di destra— e
              i pezzi scendono a circa 200px. Sul telefono non ci sono due
              colonne da distribuire, quindi l'etichetta va sopra, la striscia
              sotto, e a quella misura è già una striscia senza aiuto.
            */}
            <div className="md:grid md:grid-cols-12 md:items-start md:gap-8">
              <div className="flex items-baseline justify-between gap-6 md:col-span-3 md:block">
                <h2 id="footer-social" className="label">
                  Segui il lavoro
                </h2>

              {/*
                Percorre `site.socials` invece di scrivere Instagram a mano:
                oggi c'è un solo account, ma Behance esiste e gli manca l'URL,
                e il giorno in cui arriva deve comparire qui senza toccare il
                footer.
              */}
                <ul className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm md:mt-4 md:block md:space-y-2">
                  {site.socials.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="area-tocco inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
                      >
                        <span className="link-underline">{s.label}</span>
                        <ArrowUpRight className="shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <ul
                style={{ gridTemplateColumns: `repeat(${posts.length}, minmax(0, 1fr))` }}
                className="mt-5 grid gap-2 md:col-span-8 md:col-start-5 md:mt-0 md:gap-3"
              >
                {posts.map((post) => (
                  <li key={post.id}>
                    <a
                      href={post.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group block overflow-hidden bg-paper-deep"
                    >
                      <Image
                        src={post.src}
                        alt={post.alt}
                        width={post.width}
                        height={post.height}
                        sizes="(min-width: 768px) 21vw, 33vw"
                        loading="lazy"
                        className="aspect-square w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </section>
      )}

      {/*
        L'indice. Quattro blocchi sulla griglia da 12 del sito, con gli stessi
        tagli di colonna che usano le pagine interne. Sul telefono è una pila;
        a 640px sono due colonne; solo a 768px si apre la griglia completa.

        Tutto quello che pende da un maiuscoletto va a 14px, che è la regola
        che seguono già la scheda di un'opera e la colonna laterale dei
        contatti.
      */}
      <div className="shell border-t border-line py-12 md:py-16">
        {/*
          La griglia da 12 del sito, che sul telefono si divide in due mezze
          colonne: la firma e il modulo prendono la larghezza intera, e le due
          liste corte —Sito e Shop— vanno affiancate, una per metà.
        */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-12">
          <div className="col-span-2 md:col-span-3">
            {/*
              Il logotipo senza link: è la firma in fondo al foglio, non un
              pulsante di ritorno all'inizio —quello lo fanno già il logotipo
              dell'header e "Works" qui accanto, due colonne a destra. Qui
              l'`alt` porta il nome, perché non c'è un link con aria-label che
              lo dica.
            */}
            <Image
              src="/benedetta-zibetti-wordmark.png"
              alt={site.signature}
              width={602}
              height={375}
              sizes="112px"
              className="h-auto w-[112px]"
            />

            <p className="mt-4 text-sm text-ink-soft">
              {site.author}, {site.role.toLowerCase()}
            </p>
            <p className="text-sm text-ink-soft">{site.location}</p>

            {/*
              L'unica affermazione che il footer fa sul lavoro, ed è la
              posizione del marchio: la carta per prima. Va in inchiostro
              pallido e limitata alla misura di lettura perché sia una nota in
              calce alla firma e non un paragrafo di presentazione.
            */}
            <p className="prose-measure mt-5 max-w-[34ch] text-sm leading-relaxed text-ink-faint">
              {site.craft}
            </p>

            {/*
              L'indirizzo, che senza la fascia di chiusura è l'unica via verso
              una mail fuori da /contatti. Va con il disegno dell'azione
              principale del sistema —busta in inchiostro pallido che passa a
              terracotta quando ci si appoggia, parola sottolineata in modo
              permanente— ma a 14px, come tutto quello che vive in una colonna
              del footer: è un indirizzo disponibile, non la chiusura della
              pagina.
            */}
            <a href={`mailto:${site.email}`} className="area-tocco group mt-6 flex items-center gap-2 text-ink">
              <Mail
                size={18}
                className="shrink-0 text-ink-faint transition-colors group-hover:text-accent"
              />
              <span className="link-underline break-all text-sm" data-active="true">
                {site.email}
              </span>
            </a>
          </div>

          <nav className="md:col-span-2 md:col-start-5" aria-labelledby="footer-sito">
            <h2 id="footer-sito" className="label">
              Sito
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="area-tocco link-underline text-ink-soft transition-colors hover:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/*
            Le categorie del negozio, intere. Nell'header sono un menu a
            tendina che bisogna provocare; qui restano scritte, che è a cosa
            serve un footer. Ognuna esce da `shopHref`, la stessa funzione che
            usano la barra e la pagina: il giorno in cui il negozio esisterà,
            queste righe cambiano destinazione senza toccare questo file.
          */}
          <div className="md:col-span-2 md:col-start-7">
            <h2 className="label">Shop</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {shopCategories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={shopHref(c)}
                    className="area-tocco link-underline text-ink-soft transition-colors hover:text-ink"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-3 md:col-start-10">
            <h2 className="label">Newsletter</h2>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/*
        Il testo piccolo. Un'unica riga: a sinistra quello che va dichiarato, a
        destra il ritorno in cima. Sul telefono si impilano e il ritorno resta
        ultimo, che è dove il pollice si trova già.
      */}
      <div className="shell border-t border-line py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <p className="figures text-xs leading-relaxed text-ink-faint">
              © {year} {site.name}
              {/* Obbligatoria per chi vende con partita IVA: entra appena c'è. */}
              {legale.partitaIva && (
                <>
                  <span aria-hidden="true"> · </span>P. IVA {legale.partitaIva}
                </>
              )}
              <span aria-hidden="true"> · </span>
              Tutte le illustrazioni sono opera dell&apos;autrice.
            </p>
            {/*
              Le tre pagine da leggere prima di comprare. In fila e piccole:
              sono un riferimento, non una strada che il footer propone.
              Escono solo quando i dati legali sono completi (`legaliPronte`).
            */}
            {legaliPronte() && (
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {[
                  { href: "/spedizioni-e-resi", label: "Spedizioni e resi" },
                  { href: "/condizioni-di-vendita", label: "Condizioni di vendita" },
                  { href: "/privacy", label: "Privacy e cookie" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="area-tocco link-underline text-ink-faint transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/*
            `#top` non ha bisogno di un elemento con quell'id: l'HTML lo
            definisce come l'inizio del documento. Così il ritorno in cima è un
            link vero —si raggiunge con il tab, si apre in una scheda nuova,
            funziona senza JavaScript— invece di un pulsante con un listener, ed
            eredita lo scorrimento morbido che è già su `html`, con lo stop che
            gli mette il movimento ridotto.
          */}
          <a
            href="#top"
            /*
              `py-2 -my-2` non cambia niente di quello che si vede e porta
              l'area di tocco da 16 a 32px: due parole da 12px sono il
              bersaglio più piccolo del footer e sul telefono restano sole
              contro il bordo.
            */
            className="group -my-2 inline-flex shrink-0 items-center gap-1.5 self-start py-2 text-xs text-ink-faint transition-colors hover:text-ink sm:self-auto"
          >
            <span className="link-underline">Torna su</span>
            <ArrowUp className="shrink-0 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
