import type { Metadata } from "next";
import MarketingPage from "@/components/MarketingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Ofertas y Promociones",
  description:
    "Ofertas de temporada, outlet permanente con hasta 60% de descuento en producto nuevo y promociones vigentes de marca. Mejoramos cualquier oferta.",
  alternates: { canonical: "/ofertas" },
};

export default function OfertasPage() {
  return <MarketingPage file="ofertas.html" />;
}
