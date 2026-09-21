// carrito.ts — operaciones de carrito contra la Storefront API.
//
// El carrito vive en Shopify. Aquí no se calcula ni un peso: cantidades,
// subtotales, impuestos y existencias son siempre los que devuelve la API. Es la
// diferencia de fondo con el carrito anterior (`public/cart.js`), que sumaba
// precios escritos a mano en el HTML y se los llevaba a un cart permalink.

import "server-only";

import { ErrorShopify, shopifyFetch } from "./cliente";
import {
  ACTUALIZAR_LINEAS,
  AGREGAR_LINEAS,
  CONSULTA_CARRITO,
  CONSULTA_VARIANTE,
  CONSULTA_VARIANTE_POR_SKU,
  CREAR_CARRITO,
  QUITAR_LINEAS,
} from "./consultas";
import { aCarrito, gidVariante } from "./normalizar";
import type { CarritoRaw, RespuestaMutacion, VarianteRaw } from "./respuestas";
import type { Carrito } from "./tipos";

/** El carrito guardado ya no existe en Shopify (caducó o se borró). */
export class CarritoCaducado extends Error {}

/** Las mutaciones nunca se cachean: el carrito es estado por visitante. */
const SIN_CACHE = { revalidate: 0 };

function revisarErrores({ userErrors, cart }: RespuestaMutacion): CarritoRaw {
  if (userErrors?.length) {
    throw new ErrorShopify("consulta", userErrors.map((e) => e.message).join(" · "));
  }
  if (!cart) throw new CarritoCaducado("Shopify no devolvió el carrito.");
  return cart;
}

/**
 * Busca la variante antes de tocar el carrito: así se conocen moneda, tags y
 * existencias, que son los datos con los que la regla de compra decide.
 *
 * Dos intentos a propósito: los `data-cart-vid` del HTML son IDs fijos y una
 * reimportación del catálogo los rota. Sin el respaldo por SKU, ese día los
 * botones dejarían de funcionar sin que nadie se entere.
 */
export async function buscarVariante(
  idVariante: string,
  sku?: string,
): Promise<VarianteRaw | null> {
  const porId = await shopifyFetch<{ node: VarianteRaw | null }>(CONSULTA_VARIANTE, {
    variables: { id: gidVariante(idVariante) },
    revalidate: 60,
  });
  if (porId.node) return porId.node;

  if (!sku) return null;
  const porSku = await shopifyFetch<{
    products: { nodes: { variants: { nodes: VarianteRaw[] } }[] };
  }>(CONSULTA_VARIANTE_POR_SKU, {
    variables: { consulta: `sku:${sku}` },
    revalidate: 60,
  });

  const todas = porSku.products.nodes.flatMap((p) => p.variants.nodes);
  return todas.find((v) => v.sku?.toUpperCase() === sku.toUpperCase()) ?? null;
}

export async function leerCarrito(id: string): Promise<Carrito> {
  const datos = await shopifyFetch<{ cart: CarritoRaw | null }>(CONSULTA_CARRITO, {
    variables: { id },
    ...SIN_CACHE,
  });
  if (!datos.cart) throw new CarritoCaducado("El carrito ya no existe en Shopify.");
  return aCarrito(datos.cart);
}

export async function crearCarrito(idVariante: string, cantidad: number): Promise<Carrito> {
  const datos = await shopifyFetch<{ cartCreate: RespuestaMutacion }>(CREAR_CARRITO, {
    variables: { lineas: [{ merchandiseId: gidVariante(idVariante), quantity: cantidad }] },
    ...SIN_CACHE,
  });
  return aCarrito(revisarErrores(datos.cartCreate));
}

export async function agregarLinea(
  idCarrito: string,
  idVariante: string,
  cantidad: number,
): Promise<Carrito> {
  const datos = await shopifyFetch<{ cartLinesAdd: RespuestaMutacion }>(AGREGAR_LINEAS, {
    variables: {
      id: idCarrito,
      lineas: [{ merchandiseId: gidVariante(idVariante), quantity: cantidad }],
    },
    ...SIN_CACHE,
  });
  return aCarrito(revisarErrores(datos.cartLinesAdd));
}

export async function cambiarCantidadLinea(
  idCarrito: string,
  idLinea: string,
  cantidad: number,
): Promise<Carrito> {
  const datos = await shopifyFetch<{ cartLinesUpdate: RespuestaMutacion }>(ACTUALIZAR_LINEAS, {
    variables: { id: idCarrito, lineas: [{ id: idLinea, quantity: cantidad }] },
    ...SIN_CACHE,
  });
  return aCarrito(revisarErrores(datos.cartLinesUpdate));
}

export async function quitarLinea(idCarrito: string, idLinea: string): Promise<Carrito> {
  const datos = await shopifyFetch<{ cartLinesRemove: RespuestaMutacion }>(QUITAR_LINEAS, {
    variables: { id: idCarrito, ids: [idLinea] },
    ...SIN_CACHE,
  });
  return aCarrito(revisarErrores(datos.cartLinesRemove));
}
