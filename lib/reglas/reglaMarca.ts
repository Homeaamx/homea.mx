// reglaMarca.ts — ¿este producto se compra en línea o se cotiza? (regla 2026-10-06)
//
// Fuente: data/reglas-compra.json (Excel "REGLAS DE COMPRA POR MARCA" de Carla).
// Orden de la regla, el primero que aplica gana:
//   1. Lo que está en stock / oferta → siempre se compra.
//   2. Marca de la lista "solo cotizar" → se cotiza.
//   3. Precio de venta con IVA mayor al límite → se cotiza.
//   4. Lo demás → se compra.
//
// Es una función pura para poder usarla igual al pintar la ficha (servidor) que
// en la acción del carrito. La acción del carrito (lib/reglas/compra.ts) todavía
// usa la regla vieja de moneda; migrarla es un pendiente del plan (§4.5).

import reglas from "@/data/reglas-compra.json";

export type Accion = "comprar" | "cotizar";

export interface Decision {
  accion: Accion;
  motivo: "stock" | "marca" | "monto" | "general";
}

/** "Sub-Zero" / "sub-zero" / "SUB ZERO" → "subzero": vendor y slug se comparan así. */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

const SOLO_COTIZAR = new Set(reglas.soloCotizar.map(norm));

export const LIMITE_MXN_CON_IVA = reglas.limiteMxnConIva;

export function marcaSoloCotiza(vendor: string): boolean {
  return SOLO_COTIZAR.has(norm(vendor));
}

export function decidirCompra({
  vendor,
  precioMxnConIva,
  enStock,
}: {
  vendor: string;
  precioMxnConIva: number;
  enStock: boolean;
}): Decision {
  if (enStock) return { accion: "comprar", motivo: "stock" };
  if (marcaSoloCotiza(vendor)) return { accion: "cotizar", motivo: "marca" };
  if (precioMxnConIva > LIMITE_MXN_CON_IVA) return { accion: "cotizar", motivo: "monto" };
  return { accion: "comprar", motivo: "general" };
}
