import type { Metadata } from "next";
import ShopAside from "./components/ShopAside";
import ShopCategoryList from "./components/ShopCategoryList";
import ShopIntro from "./components/ShopIntro";

export const metadata: Metadata = {
  title: "Shop",
  description: "Láminas, originales y papelería. Por ahora cada categoría se consulta por mail.",
};

/**
 * La página de todas las categorías.
 *
 * Existe porque el rótulo Shop de la barra hace dos cosas distintas y las dos
 * hacen falta: apoyar el mouse asoma las categorías sin sacarte de donde
 * estás, y hacer click te trae acá, donde están todas con lugar para respirar
 * y una dirección que se puede guardar, mandar y indexar. El desplegable es
 * un atajo; esta página es el lugar.
 */
export default function ShopPage() {
  return (
    <section className="shell pt-12 pb-8 md:pt-20">
      <div className="grid gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7">
          <ShopIntro />
          <ShopCategoryList />
        </div>

        <ShopAside />
      </div>
    </section>
  );
}
