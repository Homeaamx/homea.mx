import type { Metadata } from "next";
import PaginaPolitica from "@/components/PaginaPolitica";

// El texto vive en Shopify (Configuración → Políticas): se relee una vez al día.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Términos y condiciones de compra y uso del sitio de HOMEA (New Products Connection, S.A. de C.V.).",
  alternates: { canonical: "/terminos" },
};

export default function TerminosPage() {
  return <PaginaPolitica tipo="termsOfService" titulo="Términos y condiciones" />;
}
