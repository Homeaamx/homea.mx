import type { Metadata } from "next";
import MarketingPage from "@/components/MarketingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Herramientas",
  description: "Herramientas y recursos HOMEA para planear y elegir tu equipamiento premium.",
  alternates: { canonical: "/herramientas" },
};

export default function HerramientasPage() {
  return <MarketingPage file="herramientas.html" />;
}
