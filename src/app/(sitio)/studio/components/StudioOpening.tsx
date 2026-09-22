import StudioFilm from "@/components/StudioFilm";

/**
 * La película que abre la página, como lámina sobre el pliego: los mismos
 * márgenes que una obra del archivo, así se lee como una pieza más de su
 * trabajo y no como la portada de otra cosa.
 *
 * Sin `Reveal`, a diferencia del resto de la página. La aparición al entrar
 * en pantalla es para lo que llega con el scroll; esto ya está ahí cuando se
 * abre la página, y hacerlo aparecer sería inventarle una llegada a algo que
 * no viaja.
 */
export default function StudioOpening() {
  return (
    <section className="shell pt-8 md:pt-10">
      <StudioFilm priority className="aspect-[16/9] w-full" />
    </section>
  );
}
