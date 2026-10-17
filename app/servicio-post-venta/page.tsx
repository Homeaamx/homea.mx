import type { Metadata } from "next";
import MarketingPage from "@/components/MarketingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Servicio Post-Venta",
  description:
    "Instalación, mantenimiento y garantías de tus equipos HOMEA: requisitos, condiciones y cómo solicitar tu servicio con Post Venta.",
  alternates: { canonical: "/servicio-post-venta" },
};

export default function ServicioPostVentaPage() {
  return <MarketingPage file="servicio-post-venta.html" />;
}
