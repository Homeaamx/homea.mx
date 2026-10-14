import type { Metadata } from "next";
import PaginaPolitica from "@/components/PaginaPolitica";

// El texto vive en Shopify (Configuración → Políticas → Política de reembolso):
// se relee una vez al día.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Política de devoluciones",
  description:
    "Cambios, devoluciones, cancelaciones y reembolsos en HOMEA: cuándo proceden, cómo revisar tu equipo al recibirlo y qué hacer si llega dañado.",
  alternates: { canonical: "/politica-de-devoluciones" },
};

export default function PoliticaDeDevolucionesPage() {
  return <PaginaPolitica tipo="refundPolicy" titulo="Política de devoluciones" />;
}
