import type { Metadata } from "next";
import MarketingPage from "@/components/MarketingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Productos",
  description:
    "Catálogo de electrodomésticos y equipamiento premium para cocina, baño, exterior y más. Asesoría experta y entregas en todo México.",
  alternates: { canonical: "/productos" },
};

export default function ProductosPage() {
  return <MarketingPage file="coleccion.html" />;
}
