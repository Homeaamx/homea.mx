import type { Metadata } from "next";
import MarketingPage from "@/components/MarketingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Habla con un especialista HOMEA. Cotizaciones, asesoría y atención por WhatsApp, teléfono o en nuestro showroom de Querétaro.",
  alternates: { canonical: "/contacto" },
};

export default function ContactoPage() {
  return <MarketingPage file="contacto.html" />;
}
