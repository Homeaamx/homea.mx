// catalogoVivo.ts — productos publicados en Shopify (canal Headless), listos para
// pintar tarjetas, filtros y fichas.
//
// Es la otra mitad de `lib/catalogo.ts`: aquel índice local alimenta el buscador
// y las 5 fichas del piloto; esto lee el catálogo REAL con su precio, sus filtros
// (`filtros.*`) y sus imágenes del CDN de Shopify.
//
// Precios (decisión Carla, 2026-10-06):
//   · Shopify guarda pesos SIN IVA: precio = lista − descuento de la marca, y
//     precio de comparación (tachado) = lista. Shopify suma el 16% en el checkout.
//   · La web muestra el precio CON IVA y el tachado. Si el producto es de lista
//     en dólares (`homea.precio_usd`), la cifra principal va en USD, como Artexa,
//     y abajo la equivalencia en pesos al tipo de cambio del día.
//
// Todo se lee con caché de una hora y la etiqueta `catalogo`, para poder
// revalidar al instante cuando entre el webhook de productos (PLAN §3.4 ter).

import "server-only";

import { IVA } from "@/lib/catalogo";
import { decidirCompra, type Decision } from "@/lib/reglas/reglaMarca";
import type { TipoCambio } from "@/lib/tipoCambio";

import { shopifyFetch } from "./cliente";

export const TAG_CATALOGO = "catalogo";

/** Claves de `filtros.*` que existen en Shopify (las 38 definiciones de 2026-10-06). */
export const CLAVES_FILTRO = [
  "disponibilidad", "garantia", "promocion", "acabado", "ancho", "instalacion", "diseno",
  "funcionamiento", "voltaje", "tipo", "tipo_gas", "uso", "capacidad", "compatible",
  "potencia", "horneado", "material", "extraccion", "fabrica_hielos", "motor",
  "accesorios_incluidos", "altura", "carga", "cubierta", "despachador_agua", "drenaje",
  "hornos", "llenado_agua", "produccion", "profundidad", "puerta", "racks", "ruido",
  "tecnologia", "tina", "tipo_hielo", "variedades_cafe", "zonas",
] as const;

const IDENTIFICADORES = [
  ...CLAVES_FILTRO.map((k) => `{namespace: "filtros", key: "${k}"}`),
  `{namespace: "homea", key: "precio_usd"}`,
  `{namespace: "homea", key: "lead"}`,
].join(", ");

const CAMPOS_PRODUCTO = /* GraphQL */ `
  fragment ProductoVivo on Product {
    id
    handle
    title
    vendor
    productType
    availableForSale
    images(first: 8) { nodes { url altText width height } }
    variants(first: 5) {
      nodes {
        id
        sku
        availableForSale
        quantityAvailable
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
      }
    }
    metafields(identifiers: [${IDENTIFICADORES}]) { namespace key value }
  }
`;

const CONSULTA_COLECCION = /* GraphQL */ `
  ${CAMPOS_PRODUCTO}
  query Coleccion($handle: String!, $despues: String) @inContext(country: MX, language: ES) {
    collection(handle: $handle) {
      title
      products(first: 100, after: $despues, sortKey: BEST_SELLING) {
        pageInfo { hasNextPage endCursor }
        nodes { ...ProductoVivo }
      }
    }
  }
`;

const CONSULTA_POR_SKU = /* GraphQL */ `
  ${CAMPOS_PRODUCTO}
  query PorSku($consulta: String!) @inContext(country: MX, language: ES) {
    products(first: 10, query: $consulta) { nodes { ...ProductoVivo } }
  }
`;

interface MetafieldRaw {
  namespace: string;
  key: string;
  value: string;
}

interface ProductoRaw {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  availableForSale: boolean;
  images: { nodes: { url: string; altText: string | null; width: number; height: number }[] };
  variants: {
    nodes: {
      id: string;
      sku: string | null;
      availableForSale: boolean;
      quantityAvailable: number | null;
      price: { amount: string; currencyCode: string };
      compareAtPrice: { amount: string; currencyCode: string } | null;
    }[];
  };
  metafields: (MetafieldRaw | null)[];
}

export interface ImagenVivo {
  url: string;
  alt: string;
  ancho: number;
  alto: number;
}

export interface ProductoVivo {
  sku: string;
  /** Ruta de la ficha: el SKU en minúsculas, igual que las 5 fichas del piloto. */
  slug: string;
  handle: string;
  titulo: string;
  marca: string;
  /** Subcategoría 2 (= Tipo de producto en Shopify). */
  tipo: string;
  imagenes: ImagenVivo[];
  variantId: string;
  /** Pesos SIN IVA, tal como cobra Shopify (antes del 16%). */
  mxn: number;
  /** Pesos SIN IVA del precio de comparación (tachado); null si no hay descuento. */
  mxnLista: number | null;
  /** Precio de lista en dólares SIN IVA, si la marca cotiza en USD. */
  usdLista: number | null;
  /** Valores de cada filtro (`filtros.<clave>`), ya como lista. */
  filtros: Record<string, string[]>;
  lead: string | null;
  /** Bajo pedido (sigue vendiendo sin inventario) o En stock. */
  enStock: boolean;
}

function lista(valor: string): string[] {
  try {
    const v = JSON.parse(valor);
    return Array.isArray(v) ? v.map(String) : [String(v)];
  } catch {
    return [valor];
  }
}

function normalizar(raw: ProductoRaw): ProductoVivo | null {
  const v = raw.variants.nodes[0];
  if (!v?.sku) return null;
  const filtros: Record<string, string[]> = {};
  let usdLista: number | null = null;
  let lead: string | null = null;
  for (const m of raw.metafields) {
    if (!m) continue;
    if (m.namespace === "filtros") filtros[m.key] = lista(m.value);
    else if (m.key === "precio_usd") usdLista = Number.parseFloat(m.value) || null;
    else if (m.key === "lead") lead = m.value;
  }
  const mxn = Number.parseFloat(v.price.amount);
  const comparar = v.compareAtPrice ? Number.parseFloat(v.compareAtPrice.amount) : null;
  return {
    sku: v.sku,
    slug: v.sku.toLowerCase(),
    handle: raw.handle,
    titulo: raw.title,
    marca: raw.vendor,
    tipo: raw.productType,
    imagenes: raw.images.nodes.map((i) => ({
      url: i.url,
      alt: i.altText || `${raw.vendor} ${raw.title} (${v.sku})`,
      ancho: i.width,
      alto: i.height,
    })),
    variantId: v.id,
    mxn,
    mxnLista: comparar && comparar > mxn ? comparar : null,
    usdLista,
    filtros,
    lead,
    enStock: (filtros.disponibilidad ?? []).includes("En stock"),
  };
}

/**
 * Productos de una colección (todas las páginas). Devuelve [] si Shopify no
 * contesta: la página cae a su contenido estático en vez de romperse.
 */
export async function productosDeColeccion(handle: string): Promise<ProductoVivo[]> {
  const productos: ProductoVivo[] = [];
  let despues: string | null = null;
  try {
    for (let pagina = 0; pagina < 20; pagina++) {
      const data: {
        collection: {
          products: { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: ProductoRaw[] };
        } | null;
      } = await shopifyFetch(CONSULTA_COLECCION, {
        variables: { handle, despues },
        tags: [TAG_CATALOGO],
        timeoutMs: 8000,
      });
      if (!data.collection) break;
      for (const raw of data.collection.products.nodes) {
        const p = normalizar(raw);
        if (p) productos.push(p);
      }
      if (!data.collection.products.pageInfo.hasNextPage) break;
      despues = data.collection.products.pageInfo.endCursor;
    }
  } catch (error) {
    console.warn(`[catalogo] Sin productos de la colección "${handle}":`, (error as Error).message);
    return [];
  }
  return productos;
}

/**
 * Un producto publicado, por su SKU. La Storefront API ignora el filtro `sku:`
 * (verificado 2026-10-06: devuelve cualquier producto), así que se busca el
 * modelo como texto y se exige coincidencia exacta del SKU. Si la búsqueda no
 * lo trae, se recorre el catálogo de las colecciones (misma caché).
 */
export async function productoVivoPorSku(sku: string): Promise<ProductoVivo | null> {
  const buscado = sku.toUpperCase();
  try {
    const data: { products: { nodes: ProductoRaw[] } } = await shopifyFetch(CONSULTA_POR_SKU, {
      variables: { consulta: `"${buscado}"` },
      tags: [TAG_CATALOGO],
      timeoutMs: 5000,
    });
    for (const raw of data.products.nodes) {
      const p = normalizar(raw);
      if (p && p.sku.toUpperCase() === buscado) return p;
    }
  } catch (error) {
    console.warn(`[catalogo] Búsqueda de ${sku} sin respuesta:`, (error as Error).message);
  }
  const { TIPOS_WEB } = await import("./coleccionesWeb");
  for (const t of TIPOS_WEB) {
    const p = (await productosDeColeccion(t.coleccion)).find((x) => x.sku.toUpperCase() === buscado);
    if (p) return p;
  }
  return null;
}

/* ---------- Precio público (con IVA) -------------------------------------- */

export interface PrecioPublico {
  moneda: "USD" | "MXN";
  /** Precio de venta CON IVA, en la moneda de lista. */
  venta: number;
  /** Precio de lista CON IVA (tachado); null si no hay descuento. */
  tachado: number | null;
  /** Equivalencia en pesos CON IVA (solo si la lista es en dólares). */
  mxnEquivalente: number | null;
}

const centavos = (n: number) => Math.round(n * 100) / 100;

export function precioPublico(p: ProductoVivo, tc: TipoCambio): PrecioPublico {
  // Descuento = lo que Shopify ya aplicó entre lista y venta (la regla PLATA de la
  // marca). Así la cifra en dólares y la de pesos SIEMPRE cuentan la misma historia.
  const factor = p.mxnLista ? p.mxn / p.mxnLista : 1;
  if (p.usdLista) {
    const venta = centavos(p.usdLista * factor * (1 + IVA));
    return {
      moneda: "USD",
      venta,
      tachado: p.mxnLista ? centavos(p.usdLista * (1 + IVA)) : null,
      mxnEquivalente: centavos(venta * tc.valor),
    };
  }
  return {
    moneda: "MXN",
    venta: centavos(p.mxn * (1 + IVA)),
    tachado: p.mxnLista ? centavos(p.mxnLista * (1 + IVA)) : null,
    mxnEquivalente: null,
  };
}

/** Compra en línea o cotización, con la regla por marca + monto + stock. */
export function decisionDeCompra(p: ProductoVivo, precio: PrecioPublico): Decision {
  return decidirCompra({
    vendor: p.marca,
    precioMxnConIva: precio.mxnEquivalente ?? precio.venta,
    enStock: p.enStock,
  });
}
