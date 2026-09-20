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

import { productoPorSku } from "@/lib/catalogo";

import type { Carrito, LineaCarrito } from "./tipos";

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
function aLinea({ sku, cantidad }: LineaSim): LineaCarrito | null {
  const p = productoPorSku(sku);
  if (!p) return null;
  return {
    id: sku,
    sku,
    nombre: p.nombre,
    marca: p.marca,
    imagen: p.imagen,
    ficha: p.ficha,
    cantidad,
    precioUnitario: { monto: p.precio, moneda: p.moneda },
    total: { monto: p.precio * cantidad, moneda: p.moneda },
    disponible: true,
    maximo: null,
  };
}

function armar(lineas: LineaSim[]): Carrito {
  const resueltas = lineas.map(aLinea).filter((l): l is LineaCarrito => l !== null);
  const moneda = resueltas[0]?.total.moneda ?? "MXN";
  return {
    id: "simulado",
    cantidadTotal: resueltas.reduce((n, l) => n + l.cantidad, 0),
    subtotal: {
      monto: resueltas.reduce((s, l) => s + l.total.monto, 0),
      moneda,
    },
    impuesto: null,
    total: null,
    // Sin checkout: no existe tal carrito en Shopify.
    checkoutUrl: null,
    lineas: resueltas,
    bloqueo: null,
    simulado: true,
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
