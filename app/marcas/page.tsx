import type { Metadata } from "next";
import MarketingPage from "@/components/MarketingPage";
import { listasPreciosHtml } from "@/lib/listasPrecios";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Marcas oficiales",
  description:
    "Distribuidores oficiales de las mejores marcas de electrodomésticos premium: Sub-Zero, Wolf, Miele, Thermador, Viking, Gaggenau y más.",
  alternates: { canonical: "/marcas" },
};

export default function MarcasPage() {
  return <MarketingPage file="marcas.html" slots={{ "listas-precios": listasPreciosHtml() }} />;
}
