import type { Metadata } from "next";
import MarketingPage from "@/components/MarketingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "HOMEA — Electrodomésticos premium",
  description:
    "Equipamiento premium para tu hogar: refrigeración, cocción, baños, exterior y más. Marcas oficiales, asesoría experta y showroom en Querétaro.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <MarketingPage file="home.html" />;
}
