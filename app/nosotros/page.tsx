import type { Metadata } from "next";
import MarketingPage from "@/components/MarketingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Quiénes somos · Showroom",
  description:
    "Más de 22 años distribuyendo equipamiento premium para el hogar. Conoce HOMEA y visita nuestro showroom en Querétaro.",
  alternates: { canonical: "/nosotros" },
};

export default function NosotrosPage() {
  return <MarketingPage file="nosotros.html" />;
}
