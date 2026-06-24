import type { Metadata } from "next";
import MarketingPage from "@/components/MarketingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Producto",
  description: "Ficha de producto premium con especificaciones, disponibilidad y asesoría HOMEA.",
  alternates: { canonical: "/producto" },
};

export default function ProductoPage() {
  return <MarketingPage file="producto.html" />;
}
