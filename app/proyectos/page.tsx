import type { Metadata } from "next";
import MarketingPage from "@/components/MarketingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Proyectos · B2B",
  description:
    "Soluciones para arquitectos, desarrolladores y hoteles: equipamiento premium, precios de proyecto y acompañamiento especializado.",
  alternates: { canonical: "/proyectos" },
};

export default function ProyectosPage() {
  return <MarketingPage file="b2b.html" />;
}
