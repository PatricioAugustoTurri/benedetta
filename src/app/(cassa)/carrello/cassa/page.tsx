import type { Metadata } from "next";
import CassaVista from "@/components/carrello/CassaVista";
import { sumupInProva } from "@/lib/sumup";

export const metadata: Metadata = {
  title: "Cassa",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function CassaPage() {
  return <CassaVista inProva={sumupInProva()} />;
}
