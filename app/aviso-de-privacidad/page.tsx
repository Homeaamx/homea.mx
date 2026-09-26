import type { Metadata } from "next";
import PaginaPolitica from "@/components/PaginaPolitica";

// El texto vive en Shopify (Configuración → Políticas): se relee una vez al día.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description:
    "Aviso de privacidad integral de HOMEA (New Products Connection, S.A. de C.V.): qué datos tratamos, para qué y cómo ejercer tus derechos ARCO.",
  alternates: { canonical: "/aviso-de-privacidad" },
};

export default function AvisoDePrivacidadPage() {
  return <PaginaPolitica tipo="privacyPolicy" titulo="Aviso de privacidad" />;
}
