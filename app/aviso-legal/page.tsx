import type { Metadata } from "next";
import PaginaPolitica from "@/components/PaginaPolitica";

// El texto vive en Shopify (Configuración → Políticas → Aviso legal) y se lee con
// la Admin API (lib/shopify/politicas.ts): se relee una vez al día.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Aviso legal",
  description:
    "Aviso legal de HOMEA (New Products Connection, S.A. de C.V.): identificación del proveedor, condiciones de uso del sitio y derechos del consumidor.",
  alternates: { canonical: "/aviso-legal" },
};

export default function AvisoLegalPage() {
  return <PaginaPolitica tipo="legalNotice" titulo="Aviso legal" />;
}
