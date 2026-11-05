// /api/tarjetas?lista=/productos/cocina-y-bar&skus=A,B,C — tarjetas completas de
// un listado (Carla, 2026-11-04: 50 por página, selector hasta 200).
//
// Sin `lista` (2026-11-05: "todas las tarjetas deben ser iguales"): tarjetas
// sueltas por modelo, para la wishlist y para los colores hermanos que no están
// en la página (relacionados de la ficha). Cada pieza se busca por su SKU junto
// con sus otros colores, para que la tarjeta traiga sus círculos.
//
// La página solo manda completas las primeras 50; las demás llegan vacías, con
// sus datos de filtro. Cuando una entra en la página que se ve, public/catalogo.js
// pide aquí su contenido. Se arman con el mismo listado y el mismo código que la
// página (lib/shopify/listados.ts → tarjetasDeListado), así que se ven idénticas.

import { NextResponse } from "next/server";

import { productoVivoPorSku, type ProductoVivo } from "@/lib/shopify/catalogoVivo";
import { POR_PAGINA, tarjetasDeListado } from "@/lib/shopify/htmlCatalogo";
import { productosDeListado } from "@/lib/shopify/listados";
import { otrosColores } from "@/lib/shopify/sugerencias";
import { obtenerTipoCambio } from "@/lib/tipoCambio";

export const runtime = "nodejs";

/** Tope por pedido: la página más grande del selector. */
const MAXIMO = POR_PAGINA * 4;
/** Tope de tarjetas sueltas por pedido (cada una busca también sus colores). */
const MAXIMO_SUELTAS = 60;

/** Las piezas pedidas y sus otros colores, cada una buscada por SKU (Data Cache de Shopify). */
async function productosSueltos(skus: string[]): Promise<ProductoVivo[]> {
  const todos = [...new Set([...skus, ...skus.flatMap(otrosColores)])];
  const productos = await Promise.all(todos.map((s) => productoVivoPorSku(s)));
  return productos.filter((p): p is ProductoVivo => p !== null);
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lista = params.get("lista") ?? "";
  const skus = (params.get("skus") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, lista ? MAXIMO : MAXIMO_SUELTAS);
  if (!skus.length) return NextResponse.json({ tarjetas: {} }, { status: 400 });

  const productos = lista ? await productosDeListado(lista) : await productosSueltos(skus);
  if (!productos) return NextResponse.json({ tarjetas: {} }, { status: 404 });

  const tarjetas = productos.length ? tarjetasDeListado(productos, await obtenerTipoCambio(), skus) : {};
  return NextResponse.json(
    { tarjetas },
    {
      // Igual que las páginas de listado (revalidate = 3600): el CDN la guarda una
      // hora por combinación de listado y piezas.
      headers: { "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" },
    },
  );
}
