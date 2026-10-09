// normalizar.ts — de la respuesta cruda de Shopify al contrato de la UI.
//
// Aquí vive también el **guardia de moneda**, que es la pieza que impide cobrar
// de menos. Modelo de precios vigente (Carla, 2026-10-06):
//
//   · Shopify guarda SIEMPRE pesos sin IVA. Para las marcas en dólares, el cron
//     (`/api/cron/tipo-cambio`) recalcula precio = USD × FIX del día, y el dólar
//     de lista vive en el metafield `homea.precio_usd`.
//   · El riesgo real: un producto USD cuyo campo de pesos todavía trae la cifra
//     en dólares (p. ej. USD 11,107.47 → "$11,107.47 MXN"). Un checkout cobraría
//     17 veces menos. Se detecta porque el precio en pesos es menor que el dólar
//     de lista × 5: ningún tipo de cambio plausible da eso. Ese carrito se marca
//     `bloqueo: "moneda-incoherente"`: se ve, pero no se puede pagar.
//
// Y la **regla de compra** (lib/reglas/reglaMarca.ts) se evalúa por línea con los
// datos de Shopify: cada pieza sabe si se compra en línea o se cotiza, y el
// proyecto completo es `checkout` solo si todas se compran.

import { IVA, productoPorSku } from "@/lib/catalogo";
import { decidirCompra, montoAlto } from "@/lib/reglas/reglaMarca";

import type { CarritoRaw, DineroRaw, VarianteRaw } from "./respuestas";
import type { Carrito, Dinero, LineaCarrito, MotivoBloqueo } from "./tipos";

/** Los `data-cart-vid` del HTML son IDs numéricos legacy. */
export function gidVariante(id: string): string {
  return id.startsWith("gid://") ? id : `gid://shopify/ProductVariant/${id}`;
}

function aDinero(raw: DineroRaw): Dinero {
  return { monto: Number.parseFloat(raw.amount), moneda: raw.currencyCode };
}

const centavos = (n: number) => Math.round(n * 100) / 100;

/** Dólar de lista (sin IVA) del metafield `homea.precio_usd`, si la marca cotiza en USD. */
function usdLista(variante: VarianteRaw): number | null {
  const m = variante.product?.metafields?.find((x) => x?.key === "precio_usd");
  const n = m ? Number.parseFloat(m.value) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** `filtros.disponibilidad` = ["En stock"] → inventario físico (y por tanto comprable). */
function enStock(variante: VarianteRaw): boolean {
  const m = variante.product?.metafields?.find((x) => x?.key === "disponibilidad");
  if (!m) return false;
  try {
    const v = JSON.parse(m.value);
    return (Array.isArray(v) ? v : [v]).some((x) => String(x) === "En stock");
  } catch {
    return m.value === "En stock";
  }
}

/**
 * Moneda que el catálogo declara para esta variante: USD si tiene dólar de lista
 * (metafield) o el tag `Moneda USD`; como respaldo, el índice local.
 */
export function monedaDeclarada(variante: VarianteRaw): string {
  if (usdLista(variante)) return "USD";
  const tags = variante.product?.tags ?? [];
  if (tags.some((t) => /^moneda[:\s-]*usd$/i.test(t.trim()))) return "USD";
  if (tags.some((t) => /^moneda[:\s-]*mxn$/i.test(t.trim()))) return "MXN";
  const enIndice = variante.sku ? productoPorSku(variante.sku) : null;
  return enIndice?.moneda ?? "MXN";
}

/**
 * ¿Shopify cobraría una cifra que no puede ser correcta? Dos casos: la tienda no
 * está cobrando en pesos, o el campo de pesos de una pieza en dólares todavía
 * trae la cifra en dólares (no pasó por el cron del tipo de cambio).
 */
export function monedaIncoherente(variante: VarianteRaw): boolean {
  if (variante.price.currencyCode !== "MXN") return true;
  const usd = usdLista(variante);
  if (usd === null) return false;
  return Number.parseFloat(variante.price.amount) < usd * 5;
}

/** "Horno … 24\" — Serie 200" → "Serie 200". */
function serieDe(titulo: string): string | null {
  const [, ...resto] = titulo.split(" — ");
  const serie = resto.join(" — ").trim();
  return serie || null;
}

function aLinea(raw: CarritoRaw["lines"]["nodes"][number]): LineaCarrito {
  const v = raw.merchandise;
  const sku = v.sku ?? "";
  // La ruta de la PDP se resuelve por SKU contra el índice, NUNCA con el
  // `data-cart-href` del botón: ese atributo es HTML estático y puede mentir.
  const enIndice = sku ? productoPorSku(sku) : null;
  // Toda pieza publicada en Shopify tiene ficha generada en /producto/<sku>.
  const ficha = enIndice?.ficha ?? (sku ? `/producto/${sku.toLowerCase()}` : null);

  const mxn = Number.parseFloat(v.price.amount);
  const comparar = v.compareAtPrice ? Number.parseFloat(v.compareAtPrice.amount) : null;
  const mxnLista = comparar && comparar > mxn ? comparar : null;
  const usd = usdLista(v);
  const stock = enStock(v);

  // Mismo cálculo que precioPublico() en catalogoVivo.ts: la línea del proyecto
  // dice el mismo número que la tarjeta y la ficha.
  let precioPublico: LineaCarrito["precioPublico"];
  if (usd) {
    const factor = mxnLista ? mxn / mxnLista : 1;
    precioPublico = {
      venta: { monto: centavos(usd * factor * (1 + IVA)), moneda: "USD" },
      tachado: mxnLista ? { monto: centavos(usd * (1 + IVA)), moneda: "USD" } : null,
    };
  } else {
    precioPublico = {
      venta: { monto: centavos(mxn * (1 + IVA)), moneda: "MXN" },
      tachado: mxnLista ? { monto: centavos(mxnLista * (1 + IVA)), moneda: "MXN" } : null,
    };
  }

  // Pre-cotización: lista, venta y descuento por unidad SIN IVA, en la moneda de lista.
  const cotizacion: LineaCarrito["cotizacion"] = usd
    ? (() => {
        const factor = mxnLista ? mxn / mxnLista : 1;
        const unitario = centavos(usd * factor);
        return { moneda: "USD", lista: usd, unitario, descuento: centavos(usd - unitario) };
      })()
    : { moneda: "MXN", lista: mxnLista ?? mxn, unitario: mxn, descuento: centavos((mxnLista ?? mxn) - mxn) };

  const decision = decidirCompra({
    vendor: v.product.vendor || enIndice?.marca || "",
    precioMxnConIva: centavos(mxn * (1 + IVA)),
    enStock: stock,
  });

  return {
    id: raw.id,
    sku,
    nombre: v.product.title || enIndice?.nombre || "",
    marca: v.product.vendor || enIndice?.marca || "",
    imagen: v.image?.url ?? v.product.featuredImage?.url ?? enIndice?.imagen ?? null,
    ficha,
    cantidad: raw.quantity,
    precioUnitario: aDinero(raw.cost.amountPerQuantity),
    total: aDinero(raw.cost.totalAmount),
    disponible: v.availableForSale,
    maximo: v.quantityAvailable,
    enStock: stock,
    serie: serieDe(v.product.title || ""),
    precioPublico,
    decision,
    cotizacion,
    montoAlto: montoAlto(centavos(mxn * (1 + IVA))),
  };
}

/** Lista − venta, por cantidad, en la moneda del carrito (pesos sin IVA). */
function ahorroDe(raw: CarritoRaw): Dinero {
  const moneda = raw.cost.subtotalAmount.currencyCode;
  const monto = raw.lines.nodes.reduce((suma, l) => {
    const v = l.merchandise;
    const venta = Number.parseFloat(v.price.amount);
    const lista = v.compareAtPrice ? Number.parseFloat(v.compareAtPrice.amount) : null;
    return lista && lista > venta ? suma + (lista - venta) * l.quantity : suma;
  }, 0);
  return { monto: centavos(monto), moneda };
}

export function aCarrito(raw: CarritoRaw, { simulado = false } = {}): Carrito {
  const lineas = raw.lines.nodes.map(aLinea);

  let bloqueo: MotivoBloqueo | null = null;
  if (raw.lines.nodes.some((l) => monedaIncoherente(l.merchandise))) {
    bloqueo = "moneda-incoherente";
  }

  const subtotal = aDinero(raw.cost.subtotalAmount);
  // Shopify solo calcula el impuesto con dirección; mientras, se estima el 16 %.
  const iva = raw.cost.totalTaxAmount
    ? aDinero(raw.cost.totalTaxAmount)
    : { monto: centavos(subtotal.monto * IVA), moneda: subtotal.moneda };

  return {
    id: raw.id,
    cantidadTotal: raw.totalQuantity,
    subtotal,
    impuesto: raw.cost.totalTaxAmount ? aDinero(raw.cost.totalTaxAmount) : null,
    total: raw.cost.totalAmount ? aDinero(raw.cost.totalAmount) : null,
    checkoutUrl: raw.checkoutUrl,
    lineas,
    bloqueo,
    simulado,
    modo: lineas.some((l) => l.decision.accion === "cotizar") ? "cotizacion" : "checkout",
    ivaEstimado: iva,
    totalEstimado: { monto: centavos(subtotal.monto + iva.monto), moneda: subtotal.moneda },
    ahorro: ahorroDe(raw),
    subtotalLista: { monto: centavos(subtotal.monto + ahorroDe(raw).monto), moneda: subtotal.moneda },
  };
}
