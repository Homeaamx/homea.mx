import type { Metadata } from "next";

import MiProyectoPagina from "@/components/MiProyectoPagina";

// /mi-proyecto — la página de "Mi proyecto" (mismo diseño que /wishlist). El
// contenido es el carrito de Shopify, que llega por contexto en el navegador;
// la página en sí es estática y personal: no se indexa ni va al sitemap.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Mi proyecto",
  description:
    "Las piezas de tu proyecto HOMEA: paga en línea las que cumplen la regla de compra o envía el listado a un ejecutivo con tu cotización preliminar.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/mi-proyecto" },
};

export default function MiProyectoPage() {
  return <MiProyectoPagina />;
}
