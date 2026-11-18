// accesoriosIncluidos.ts — piezas que incluyen accesorios a elegir (Carla, 2026-11-18).
//
// Schock Prepstation D150 y Horizont N200 "incluyen 2 accesorios a elegir". Al
// agregarlas a Mi proyecto, CarritoProvider abre una ventana para escogerlos; lo
// elegido viaja como atributo de la línea ("Accesorios incluidos") hasta el
// carrito, el pedido de Shopify y la pre-cotización. No se cobran aparte: vienen
// en el precio de la tarja.
//
// Sin imports de servidor: lo usan la ficha, el carrito y la acción del servidor.

import datos from "@/data/accesorios-incluidos.json";

export interface OpcionIncluida {
  sku: string;
  nombre: string;
}
export interface AccesoriosAElegir {
  elegir: number;
  opciones: OpcionIncluida[];
}

/** Clave del atributo de línea (carrito y pedido). */
export const ATRIBUTO_INCLUIDOS = "Accesorios incluidos";
/** Separador entre accesorios dentro del atributo. */
const SEP = " · ";

const TABLA = Object.fromEntries(
  Object.entries(datos as Record<string, unknown>).filter(([k]) => !k.startsWith("_")),
) as Record<string, AccesoriosAElegir>;

/** Configuración de una pieza por su SKU (el base o el de cualquier color: "HORIZONT N200 STONE"). */
export function accesoriosAElegir(sku: string | null | undefined): AccesoriosAElegir | null {
  const s = (sku ?? "").trim().toUpperCase();
  if (!s) return null;
  for (const [base, cfg] of Object.entries(TABLA)) {
    if (s === base || s.startsWith(`${base} `)) return cfg;
  }
  return null;
}

/**
 * Valor del atributo a partir de lo elegido (SKU de los accesorios), o "" si no
 * cuadra con la pieza: deben ser exactamente `elegir` opciones distintas suyas.
 */
export function valorIncluidos(sku: string, elegidos: string[]): string {
  const cfg = accesoriosAElegir(sku);
  if (!cfg) return "";
  const unicos = [...new Set(elegidos.map((e) => e.trim().toUpperCase()))];
  const ops = unicos.map((e) => cfg.opciones.find((o) => o.sku.toUpperCase() === e));
  if (ops.length !== cfg.elegir || ops.some((o) => !o)) return "";
  return ops.map((o) => o!.nombre).join(SEP);
}
