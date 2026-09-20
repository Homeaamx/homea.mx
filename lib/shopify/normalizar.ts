// normalizar.ts — de la respuesta cruda de Shopify al contrato de la UI.
//
// Aquí vive también el **guardia de moneda**, que es la pieza que impide cobrar
// de menos. Contexto del riesgo (verificado en los CSV de import):
//
//   BOP250612 → `Variant Price = 11107.47` en Shopify, con el tag `Moneda USD`.
//   La ficha del preview muestra "$193,603.20 MXN · FIX 17.43" (= 11107.47 × 17.43).
//
// Es decir: Shopify guarda **la cifra en dólares como precio crudo de la
// variante**. Si la tienda liquida en MXN, un checkout real cobraría $11,107 MXN
// en vez de $193,603 MXN — 17 veces menos, con dinero de verdad. Mientras la
// moneda del carrito no coincida con la que declara el producto, el carrito se
// marca `bloqueo: "moneda-incoherente"`: se ve, pero no se puede pagar.
//
// La solución de fondo es de catálogo, no de código: configurar un mercado MX en
// MXN y dejar que Shopify convierta, retirando el FIX fijo (ver PLAN-DE-FASES §4.5).

import { productoPorSku } from "@/lib/catalogo";

import type { CarritoRaw, DineroRaw, VarianteRaw } from "./respuestas";
import type { Carrito, Dinero, LineaCarrito, MotivoBloqueo } from "./tipos";

/** Los `data-cart-vid` del HTML son IDs numéricos legacy. */
export function gidVariante(id: string): string {
  return id.startsWith("gid://") ? id : `gid://shopify/ProductVariant/${id}`;
}

function aDinero(raw: DineroRaw): Dinero {
  return { monto: Number.parseFloat(raw.amount), moneda: raw.currencyCode };
}

/**
 * Moneda que el catálogo declara para esta variante. Viene del tag de Shopify
 * (`Moneda USD`, que el import escribe así) y, como respaldo, del índice local.
 */
export function monedaDeclarada(variante: VarianteRaw): string {
  const tags = variante.product?.tags ?? [];
  if (tags.some((t) => /^moneda[:\s-]*usd$/i.test(t.trim()))) return "USD";
  if (tags.some((t) => /^moneda[:\s-]*mxn$/i.test(t.trim()))) return "MXN";
  const enIndice = variante.sku ? productoPorSku(variante.sku) : null;
  return enIndice?.moneda ?? "MXN";
}

/**
 * ¿La moneda con la que Shopify cobraría coincide con la que declara el producto?
 * Si no, hay riesgo de cobrar la cifra correcta en la divisa equivocada.
 */
export function monedaIncoherente(variante: VarianteRaw): boolean {
  return variante.price.currencyCode !== monedaDeclarada(variante);
}

function aLinea(raw: CarritoRaw["lines"]["nodes"][number]): LineaCarrito {
  const v = raw.merchandise;
  const sku = v.sku ?? "";
  // La ruta de la PDP se resuelve por SKU contra el índice, NUNCA con el
  // `data-cart-href` del botón: ese atributo es HTML estático y puede mentir.
  const enIndice = sku ? productoPorSku(sku) : null;

  return {
    id: raw.id,
    sku,
    nombre: enIndice?.nombre ?? v.product.title,
    marca: v.product.vendor || enIndice?.marca || "",
    imagen: v.image?.url ?? enIndice?.imagen ?? null,
    ficha: enIndice?.ficha ?? null,
    cantidad: raw.quantity,
    precioUnitario: aDinero(raw.cost.amountPerQuantity),
    total: aDinero(raw.cost.totalAmount),
    disponible: v.availableForSale,
    maximo: v.quantityAvailable,
  };
}

export function aCarrito(raw: CarritoRaw, { simulado = false } = {}): Carrito {
  const lineas = raw.lines.nodes.map(aLinea);

  let bloqueo: MotivoBloqueo | null = null;
  if (raw.lines.nodes.some((l) => monedaIncoherente(l.merchandise))) {
    bloqueo = "moneda-incoherente";
  }

  return {
    id: raw.id,
    cantidadTotal: raw.totalQuantity,
    subtotal: aDinero(raw.cost.subtotalAmount),
    impuesto: raw.cost.totalTaxAmount ? aDinero(raw.cost.totalTaxAmount) : null,
    total: raw.cost.totalAmount ? aDinero(raw.cost.totalAmount) : null,
    checkoutUrl: raw.checkoutUrl,
    lineas,
    bloqueo,
    simulado,
  };
}
