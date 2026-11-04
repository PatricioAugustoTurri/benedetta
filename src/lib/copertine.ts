import { esServizio, type ShopCategoria, type ShopCategory } from "@/data/shop";
import { listCategorie } from "@/lib/categorie";
import { query } from "@/lib/db";
import { listProdotti, listPubblicati } from "@/lib/prodotti";
import { listServizi } from "@/lib/servizi";
import { esVideo } from "@/lib/video";
import { listWorks, type WorkImage } from "@/lib/works";

/**
 * L'immagine di ogni categoria nella pagina /shop, quella che lei sceglie da
 * /admin/shop/copertine fra le immagini già caricate nel sito: quelle dei
 * servizi, delle stampe (anche i mockup) e delle opere. La copertina è una
 * copia del riferimento, non un file suo: non si carica e non si cancella da
 * Cloudinary.
 *
 * Una categoria senza copertina semplicemente non c'è nella mappa.
 */
export type Copertine = Partial<Record<ShopCategoria, WorkImage>>;

/**
 * Tutte le copertine. Se la tabella non esiste ancora —la migrazione 005 va
 * dopo il deploy— risponde vuoto, e la pagina usa le immagini di riserva.
 */
export async function listCopertine(): Promise<Copertine> {
  const rows = await query<{ categoria: ShopCategoria; immagine: WorkImage }>(
    `SELECT categoria, immagine FROM copertine`,
  ).catch(() => []);
  return Object.fromEntries(rows.map((r) => [r.categoria, r.immagine]));
}

/** Mette, cambia o toglie la copertina di una categoria. */
export async function setCopertina(categoria: ShopCategoria, immagine: WorkImage | null): Promise<void> {
  if (immagine) {
    await query(
      `INSERT INTO copertine (categoria, immagine) VALUES ($1, $2::jsonb)
       ON CONFLICT (categoria) DO UPDATE SET immagine = EXCLUDED.immagine`,
      [categoria, JSON.stringify(immagine)],
    );
  } else {
    await query(`DELETE FROM copertine WHERE categoria = $1`, [categoria]);
  }
}

/** Un gruppo della biblioteca: da dove vengono le immagini. */
export type GruppoLibreria = { titolo: string; immagini: (WorkImage & { fonte: string })[] };

/**
 * Tutte le immagini già caricate che possono fare da copertina, a gruppi:
 * i due servizi, i prodotti di ogni categoria (con i loro mockup) e le opere. Solo immagini:
 * una copertina non può essere un video. Ogni immagine compare una volta sola.
 */
export async function listLibreria(): Promise<GruppoLibreria[]> {
  const [servizi, prodotti, opere, categorie] = await Promise.all([
    listServizi(),
    listProdotti(),
    listWorks(),
    listCategorie(),
  ]);
  const viste = new Set<string>();
  const prendi = (imgs: (WorkImage | null | undefined)[], fonte: string) =>
    imgs
      .filter((i): i is WorkImage => Boolean(i) && !esVideo(i!) && !viste.has(i!.url))
      .map((i) => {
        viste.add(i.url);
        return { ...i, fonte };
      });

  return [
    ...servizi.map((s) => ({ titolo: s.title, immagini: prendi(s.image, s.title) })),
    // Un gruppo per categoria di prodotti: Stampe, e quelle che lei crea.
    ...categorie
      .filter((c) => c.vendita)
      .map((c) => ({
        titolo: c.label,
        immagini: prodotti
          .filter((p) => p.categoria === c.slug)
          .flatMap((p) => prendi([...p.image, p.mockup], p.title)),
      })),
    { titolo: "Opere", immagini: opere.flatMap((w) => prendi(w.image, w.title)) },
  ].filter((g) => g.immagini.length > 0);
}

/** Una categoria come esce nella pagina /shop: la sua immagine e il nome. */
export type Porta = {
  categoria: ShopCategory;
  /** La copertina scelta, o quella di riserva. Null solo se non c'è nessuna immagine da nessuna parte. */
  immagine: WorkImage | null;
  /** Se l'immagine è stata scelta da lei o è quella di riserva. Per l'admin. */
  scelta: boolean;
  /** Quella che esce se lei non ne sceglie nessuna. Per l'admin. */
  riserva: WorkImage | null;
};

/**
 * Le porte della pagina /shop, nell'ordine delle categorie. Il sito chiede
 * solo le visibili; l'admin anche le nascoste, perché lei possa sceglierne la
 * copertina prima di accenderle.
 *
 * Senza copertina scelta si usa la prima immagine del servizio, o del primo
 * prodotto pubblicato della categoria: la porta non resta mai vuota per una
 * scelta non ancora fatta.
 */
export async function listPorte({ ancheNascoste = false } = {}): Promise<Porta[]> {
  const [copertine, servizi, pubblicati, libreria, categorie] = await Promise.all([
    listCopertine(),
    listServizi(),
    listPubblicati(),
    listLibreria(),
    listCategorie(),
  ]);
  // Una copertina vale finché la sua immagine esiste ancora nel sito: se si
  // cancella la stampa o l'opera da cui veniva, torna quella di riserva.
  const esistenti = new Set(libreria.flatMap((g) => g.immagini.map((i) => i.url)));

  return categorie.filter((c) => ancheNascoste || c.visibile).map((c) => {
    const salvata = copertine[c.slug];
    const scelta = salvata && esistenti.has(salvata.url) ? salvata : null;
    const riserva = esServizio(c.slug)
      ? (servizi.find((s) => s.slug === c.slug)?.image[0] ?? null)
      : (pubblicati.find((p) => p.categoria === c.slug)?.image[0] ?? null);
    return {
      categoria: c,
      immagine: scelta ?? riserva,
      scelta: scelta !== null,
      riserva,
    };
  });
}
