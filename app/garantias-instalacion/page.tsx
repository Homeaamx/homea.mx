import type { Metadata } from "next";
import MarketingPage from "@/components/MarketingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Garantías e instalación",
  description:
    "Garantía oficial de fábrica, instalación y servicio post-venta para tu equipamiento premium HOMEA.",
  alternates: { canonical: "/garantias-instalacion" },
};

export default function GarantiasPage() {
  return <MarketingPage file="garantias-instalacion.html" />;
}
