import StudioFilm from "@/components/StudioFilm";
import { site } from "@/data/site";

/**
 * Il frontespizio di About: il video dello studio come fondo, e sopra il
 * saluto.
 *
 * È stato una tavola sul foglio, con gli stessi margini di un'opera
 * dell'archivio, poi la stessa tavola velata. Velata e da sola non
 * funzionava: un fondo senza niente davanti si legge come una foto sbiadita,
 * non come un fondo. Adesso il video occupa tutta la larghezza, sfuma nella
 * carta sopra e sotto, e porta il titolo della pagina: è l'atmosfera dello
 * studio dietro al suo nome, e l'opera vera resta nell'archivio.
 *
 * Il titolo sta dentro `.shell`, quindi si allinea al bordo della bio che
 * segue: il frontespizio è largo quanto lo schermo, ma la pagina comincia
 * sulla stessa linea di tutto il resto.
 *
 * Sotto il nome, la riga che dice cosa fa, presa dalla sua bio
 * (`site.tagline`). Il movimento —il video che affiora dalla carta, il
 * saluto che arriva dopo— vive in `.frontespizio`, in globals.css.
 */
export default function StudioOpening() {
  return (
    <section className="frontespizio" aria-labelledby="studio-titolo">
      <StudioFilm priority className="frontespizio__film" />
      <div aria-hidden="true" className="frontespizio__velo" />

      <div className="frontespizio__testo shell">
        <h1
          id="studio-titolo"
          className="display-h1 max-w-[14ch] text-[clamp(2.75rem,6.4vw,5.25rem)] leading-[1.02] text-balance text-ink"
        >
          Ciao, sono {site.author}.
        </h1>
        <p className="mt-4 text-base text-ink-soft md:mt-5 md:text-lg">{site.tagline}</p>
      </div>
    </section>
  );
}
