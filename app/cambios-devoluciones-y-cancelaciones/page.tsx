import type { Metadata } from "next";
import MarketingPage from "@/components/MarketingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Cambios, devoluciones y cancelaciones",
  description:
    "Cuándo aplican cambios, devoluciones y cancelaciones en HOMEA: productos no entregados, productos entregados con daño o modelo incorrecto, cómo iniciar una devolución, plazos y penalizaciones.",
  alternates: { canonical: "/cambios-devoluciones-y-cancelaciones" },
};

export default function CambiosDevolucionesPage() {
  return <MarketingPage file="cambios-devoluciones-y-cancelaciones.html" />;
}
