// simulado.ts — carrito de DESARROLLO, cuando Shopify no está disponible.
//
// Por qué existe: hoy la tienda está protegida con contraseña y el acceso
// tokenless de la Storefront API queda bloqueado con ella ("Online Store channel
// is locked"), así que sin el token del canal Headless no hay carrito de verdad
// contra el que programar. Este módulo permite construir y revisar toda la
// interfaz mientras tanto.
//
// Dos reglas innegociables:
//   1. Solo corre con NODE_ENV !== "production". En producción, un Shopify caído
//      muestra el aviso y la salida a WhatsApp — jamás un carrito de mentira.
//   2. Nunca ofrece checkout (`checkoutUrl: null`): no hay forma de pagar algo
//      que no existe en Shopify.
//
// Los precios salen del índice local del catálogo, que es la misma fuente que ya
// alimenta al buscador, así que las cifras coinciden con las de la ficha.

import "server-only";
import { cookies } from "next/headers";

import { IVA, productoPorSku } from "@/lib/catalogo";
import { decidirCompra, montoAlto } from "@/lib/reglas/reglaMarca";
import { obtenerTipoCambio, type TipoCambio } from "@/lib/tipoCambio";

import type { Carrito, LineaCarrito } from "./tipos";

const centavos = (n: number) => Math.round(n * 100) / 100;

const NOMBRE = "homea_carrito_sim";

export const SIMULACION_PERMITIDA = process.env.NODE_ENV !== "production";

interface LineaSim {
  sku: string;
  cantidad: number;
}

async function leerLineas(): Promise<LineaSim[]> {
  const crudo = (await cookies()).get(NOMBRE)?.value;
  if (!crudo) return [];
  try {
    const datos = JSON.parse(crudo) as LineaSim[];
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

async function guardarLineas(lineas: LineaSim[]): Promise<void> {
  (await cookies()).set(NOMBRE, JSON.stringify(lineas), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

/** El id de línea simulado es el propio SKU: estable y suficiente para la UI. */
function aLinea({ sku, cantidad }: LineaSim, tc: TipoCambio): LineaCarrito | null {
  const p = productoPorSku(sku);
  if (!p) return null;
  // Pesos sin IVA, como los guardaría Shopify tras el cron del tipo de cambio.
  const mxn = centavos(p.precio * (p.moneda === "USD" ? tc.valor : 1));
  return {
    id: sku,
    sku,
    nombre: p.nombre,
    marca: p.marca,
    imagen: p.imagen,
    ficha: p.ficha,
    cantidad,
    precioUnitario: { monto: mxn, moneda: "MXN" },
    total: { monto: centavos(mxn * cantidad), moneda: "MXN" },
    disponible: true,
    maximo: null,
    enStock: false,
    serie: p.serie,
    precioPublico: { venta: { monto: centavos(p.precio * (1 + IVA)), moneda: p.moneda }, tachado: null },
    // El índice no trae pesos para las piezas USD: se convierten con el tipo de
    // cambio del sitio solo para la regla de monto; en producción decide Shopify.
    decision: decidirCompra({
      vendor: p.marca,
      precioMxnConIva: centavos(mxn * (1 + IVA)),
      enStock: false,
    }),
    cotizacion: { moneda: p.moneda, lista: p.precio, unitario: p.precio, descuento: 0 },
    montoAlto: montoAlto(centavos(mxn * (1 + IVA))),
    tipoCambio: p.moneda === "USD" ? tc.valor : null,
  };
}

async function armar(lineas: LineaSim[]): Promise<Carrito> {
  const tc = await obtenerTipoCambio();
  const resueltas = lineas.map((l) => aLinea(l, tc)).filter((l): l is LineaCarrito => l !== null);
  // Totales siempre en pesos, como en el carrito real de Shopify.
  const moneda = "MXN";
  const subtotal = centavos(resueltas.reduce((s, l) => s + l.total.monto, 0));
  return {
    id: "simulado",
    cantidadTotal: resueltas.reduce((n, l) => n + l.cantidad, 0),
    subtotal: { monto: subtotal, moneda },
    impuesto: null,
    total: null,
    // Sin checkout: no existe tal carrito en Shopify.
    checkoutUrl: null,
    lineas: resueltas,
    bloqueo: null,
    simulado: true,
    modo: resueltas.some((l) => l.decision.accion === "cotizar") ? "cotizacion" : "checkout",
    ivaEstimado: { monto: centavos(subtotal * IVA), moneda },
    totalEstimado: { monto: centavos(subtotal * (1 + IVA)), moneda },
    // El índice no trae precio de lista: en simulación no hay ahorro que mostrar.
    ahorro: { monto: 0, moneda },
    subtotalLista: { monto: subtotal, moneda },
    subtotalConIva: { monto: centavos(subtotal * (1 + IVA)), moneda },
    ahorroConIva: { monto: 0, moneda },
    tipoCambio: resueltas.some((l) => l.tipoCambio !== null) ? tc.valor : null,
  };
}

export async function leerSimulado(): Promise<Carrito> {
  return armar(await leerLineas());
}

export async function agregarSimulado(sku: string, cantidad = 1): Promise<Carrito> {
  const lineas = await leerLineas();
  const existente = lineas.find((l) => l.sku === sku);
  if (existente) existente.cantidad += cantidad;
  else lineas.push({ sku, cantidad });
  await guardarLineas(lineas);
  return armar(lineas);
}

export async function cambiarCantidadSimulada(sku: string, cantidad: number): Promise<Carrito> {
  const lineas = (await leerLineas())
    .map((l) => (l.sku === sku ? { ...l, cantidad } : l))
    .filter((l) => l.cantidad > 0);
  await guardarLineas(lineas);
  return armar(lineas);
}

export async function quitarSimulado(sku: string): Promise<Carrito> {
  const lineas = (await leerLineas()).filter((l) => l.sku !== sku);
  await guardarLineas(lineas);
  return armar(lineas);
}
