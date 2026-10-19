import type { Metadata } from "next";
import MarketingPage from "@/components/MarketingPage";
import { productosEnStock } from "@/lib/shopify/catalogoVivo";
import { panelFiltrosHtml, rejillaHtml } from "@/lib/shopify/htmlCatalogo";
import { opcionesPanelMacro } from "@/lib/shopify/panelMacro";
import { obtenerTipoCambio } from "@/lib/tipoCambio";

// Una hora, igual que las páginas de marca: el stock cambia con el catálogo.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Ofertas y Promociones",
  description:
    "Piezas en stock con precio final, paquetes de proveedor y promociones de temporada. Mejoramos cualquier oferta.",
  alternates: { canonical: "/ofertas" },
};

/** Primera vista: 50 piezas; el selector "Mostrar" deja ver 100, 200 o 500 (Carla, 2026-10-16). */
const LIMITE_INICIAL = 50;
const MAXIMO = 500;

/**
 * Stock con precio final: mismo catálogo que /productos/cocina-y-bar (panel de
 * filtros de esa macro, decisión Carla 2026-10-19), con las piezas de Shopify en
 * `filtros.disponibilidad = "En stock"`. Sin piezas, el panel y la rejilla quedan
 * listos (vacíos) para cuando se publique stock.
 */
async function slotsDeStock(): Promise<Record<string, string>> {
  const productos = await productosEnStock(MAXIMO);
  const tc = await obtenerTipoCambio();
  const n = productos.length;
  // Lo que pasa del límite lleva `of-fuera`; el JS de preview/ofertas.html lo
  // recalcula al filtrar, ordenar o cambiar el selector.
  const rejilla = n
    ? rejillaHtml(productos, tc).replace(
        /<a class="pcard" ([^>]*?)data-orden="(\d+)"/g,
        (m, antes: string, orden: string) =>
          Number(orden) >= LIMITE_INICIAL ? `<a class="pcard of-fuera" ${antes}data-orden="${orden}"` : m,
      )
    : "";
  return {
    "stock-filtros": panelFiltrosHtml(productos, { tc, ...opcionesPanelMacro("cocina-y-bar", productos) }),
    "stock-conteo": `${n} ${n === 1 ? "pieza" : "piezas"} en stock`,
    "stock-grid": rejilla,
  };
}

export default async function OfertasPage() {
  return <MarketingPage file="ofertas.html" slots={await slotsDeStock()} />;
}
