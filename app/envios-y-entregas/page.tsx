import type { Metadata } from "next";
import MarketingPage from "@/components/MarketingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Envíos y entregas",
  description:
    "Cómo cotizar y programar el envío de tus equipos HOMEA: pasos, tiempos de preparación y entrega, rastreo y qué revisar al recibir.",
  alternates: { canonical: "/envios-y-entregas" },
};

export default function EnviosYEntregasPage() {
  return <MarketingPage file="envios-y-entregas.html" />;
}
