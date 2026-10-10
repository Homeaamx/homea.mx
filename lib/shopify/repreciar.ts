// repreciar.ts — los precios en pesos de las piezas en dólares, al tipo de cambio
// del día.
//
// Regla (Carla, 2026-10-10): si un cliente tiene una cotización en su carrito,
// se actualiza con el tipo de cambio del día. El carrito vive en Shopify y
// Shopify cobra y suma en PESOS con el precio que tenga guardado cada variante,
// así que la única forma de que el carrito, la página Mi proyecto, la
// pre-cotización y el checkout digan lo mismo es reescribir ese precio en
// Shopify cada día. Shopify recalcula los carritos abiertos con el precio
// vigente al consultarlos, así que basta con actualizar el catálogo.
//
// Modelo de precios (normalizar.ts): para cada pieza en dólares
//   compareAtPrice = USD de lista × TC                 (precio de lista, tachado)
//   price          = USD de lista × factor × TC        (factor = descuento de la marca)
// El factor NO se inventa aquí: se lee del propio Shopify (price / compareAtPrice,
// hoy 0.9 en Gaggenau), así que un descuento distinto por marca se respeta solo.
//
// Escala: se hace con una operación masiva de Shopify (bulkOperationRunMutation)
// en lugar de una llamada por producto, para que siga funcionando con las ~16k
// piezas del catálogo completo dentro del tiempo de una función de Vercel.

import "server-only";

import type { TipoCambio } from "@/lib/tipoCambio";

import { adminFetch, HAY_ADMIN } from "./admin";

/** Las consultas de la Admin API aquí pueden tardar más que un alta de contacto. */
const TIMEOUT_MS = 20_000;

/** Debajo de este cambio de TC (medio centavo) no vale la pena reescribir precios. */
const TOLERANCIA_TC = 0.005;

const centavos = (n: number) => Math.round(n * 100) / 100;

interface VarianteAdmin {
  id: string;
  price: string;
  compareAtPrice: string | null;
}

interface ProductoAdmin {
  id: string;
  usd: { value: string } | null;
  variants: { nodes: VarianteAdmin[] };
}

const PRODUCTOS_USD = /* GraphQL */ `
  query productosUsd($c: String) {
    products(first: 100, after: $c, query: "tag:'Moneda USD' AND -status:archived") {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        usd: metafield(namespace: "homea", key: "precio_usd") { value }
        variants(first: 20) { nodes { id price compareAtPrice } }
      }
    }
  }
`;

const SUBIR = /* GraphQL */ `
  mutation subir($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets { url resourceUrl parameters { name value } }
      userErrors { field message }
    }
  }
`;

const CORRER = /* GraphQL */ `
  mutation correr($mutation: String!, $ruta: String!) {
    bulkOperationRunMutation(mutation: $mutation, stagedUploadPath: $ruta) {
      bulkOperation { id status }
      userErrors { field message code }
    }
  }
`;

/** La mutación que Shopify aplica a cada renglón del archivo JSONL. */
const PRECIO_VARIANTES = `mutation precio($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) { userErrors { field message } }
}`;

const ESTADO = /* GraphQL */ `
  query estado($id: ID!) {
    node(id: $id) { ... on BulkOperation { id status errorCode objectCount } }
  }
`;

export interface ResultadoRepreciar {
  ok: boolean;
  /** Por qué no se reescribió nada, si fue el caso. */
  motivo?: string;
  tipoCambio: number;
  /** Productos en dólares revisados (no archivados). */
  revisados: number;
  /** Productos cuyo precio cambia con el TC nuevo. */
  porCambiar: number;
  /** TC con el que estaban calculados los pesos antes de esta corrida. */
  tcAnterior: number | null;
  operacion?: { id: string; status: string; objectCount?: string | null; errorCode?: string | null };
}

interface Renglon {
  productId: string;
  variants: { id: string; price: string; compareAtPrice?: string | null }[];
}

/** Todos los productos en dólares que no están archivados. */
async function leerProductosUsd(): Promise<ProductoAdmin[] | null> {
  const todos: ProductoAdmin[] = [];
  let cursor: string | null = null;
  // Tope de seguridad: 300 páginas = 30k productos.
  for (let pagina = 0; pagina < 300; pagina++) {
    type R = { products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: ProductoAdmin[] } };
    const data: R | null = await adminFetch<R>(PRODUCTOS_USD, { c: cursor }, TIMEOUT_MS);
    if (!data) return null;
    todos.push(...data.products.nodes);
    if (!data.products.pageInfo.hasNextPage) return todos;
    cursor = data.products.pageInfo.endCursor;
  }
  return todos;
}

/**
 * Precios nuevos de un producto. La primera variante fija el TC anterior
 * (pesos ÷ (USD × factor)); las demás variantes conservan su proporción con ella.
 */
function precioNuevo(p: ProductoAdmin, tc: number): { renglon: Renglon; tcAnterior: number } | null {
  const usd = p.usd ? Number.parseFloat(p.usd.value) : NaN;
  const base = p.variants.nodes[0];
  if (!Number.isFinite(usd) || usd <= 0 || !base) return null;

  const precioBase = Number.parseFloat(base.price);
  const listaBase = base.compareAtPrice ? Number.parseFloat(base.compareAtPrice) : null;
  if (!Number.isFinite(precioBase) || precioBase <= 0) return null;
  const factor = listaBase && listaBase > precioBase ? Math.round((precioBase / listaBase) * 10_000) / 10_000 : 1;
  const tcAnterior = precioBase / (usd * factor);

  const variants = p.variants.nodes.map((v) => {
    const precio = Number.parseFloat(v.price);
    const lista = v.compareAtPrice ? Number.parseFloat(v.compareAtPrice) : null;
    // Variante con la cifra en DÓLARES escrita en el campo de pesos (p. ej.
    // DA020111 a "$167.09 MXN"): ningún tipo de cambio da eso — mismo criterio
    // que monedaIncoherente() en normalizar.ts. Esa cifra es su USD de lista, y
    // se convierte como cualquier otra pieza en lugar de arrastrar el error.
    if (v !== base && precio < usd * factor * 5) {
      return {
        id: v.id,
        price: centavos(precio * factor * tc).toFixed(2),
        compareAtPrice: factor < 1 ? centavos(precio * tc).toFixed(2) : null,
      };
    }
    // Variante base: del USD de lista, exacto. Las demás: misma proporción.
    const escala = v === base ? null : precio / precioBase;
    const nuevoPrecio = escala === null ? usd * factor * tc : usd * factor * tc * escala;
    const nuevaLista = lista && lista > precio ? nuevoPrecio * (lista / precio) : null;
    return {
      id: v.id,
      price: centavos(nuevoPrecio).toFixed(2),
      ...(nuevaLista ? { compareAtPrice: centavos(escala === null ? usd * tc : nuevaLista).toFixed(2) } : {}),
    };
  });
  return { renglon: { productId: p.id, variants }, tcAnterior };
}

/** Sube el JSONL al almacenamiento temporal de Shopify y devuelve su ruta. */
async function subirJsonl(contenido: string): Promise<string | null> {
  type R = {
    stagedUploadsCreate: {
      stagedTargets: { url: string; parameters: { name: string; value: string }[] }[];
      userErrors: { message: string }[];
    };
  };
  const data = await adminFetch<R>(
    SUBIR,
    {
      input: [
        { resource: "BULK_MUTATION_VARIABLES", filename: "precios-usd.jsonl", mimeType: "text/jsonl", httpMethod: "POST" },
      ],
    },
    TIMEOUT_MS,
  );
  const destino = data?.stagedUploadsCreate.stagedTargets[0];
  if (!destino || data?.stagedUploadsCreate.userErrors.length) {
    console.error("[repreciar] stagedUploadsCreate:", data?.stagedUploadsCreate.userErrors);
    return null;
  }
  const form = new FormData();
  for (const { name, value } of destino.parameters) form.append(name, value);
  form.append("file", new Blob([contenido], { type: "text/jsonl" }), "precios-usd.jsonl");
  const r = await fetch(destino.url, { method: "POST", body: form, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!r.ok) {
    console.error(`[repreciar] La subida del JSONL respondió HTTP ${r.status}.`);
    return null;
  }
  return destino.parameters.find((x) => x.name === "key")?.value ?? null;
}

/** Espera (dentro de un presupuesto) a que Shopify termine la operación masiva. */
export async function esperarOperacion(id: string, presupuestoMs = 60_000) {
  type R = { node: { id: string; status: string; errorCode: string | null; objectCount: string | null } | null };
  const limite = Date.now() + presupuestoMs;
  let ultimo: R["node"] = null;
  while (Date.now() < limite) {
    const data = await adminFetch<R>(ESTADO, { id }, TIMEOUT_MS);
    ultimo = data?.node ?? ultimo;
    if (ultimo && !["CREATED", "RUNNING"].includes(ultimo.status)) return ultimo;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return ultimo;
}

/**
 * Recalcula en Shopify los pesos de toda pieza en dólares con el TC del día.
 * Con `aplicar: false` solo informa cuántos productos cambiarían.
 */
export async function repreciarUsd(tc: TipoCambio, { aplicar = true } = {}): Promise<ResultadoRepreciar> {
  const base = { tipoCambio: tc.valor, revisados: 0, porCambiar: 0, tcAnterior: null };
  if (!HAY_ADMIN) return { ...base, ok: false, motivo: "Faltan las credenciales de la Admin API." };
  // Nunca se reescriben precios con el valor de respaldo: si Banxico no
  // respondió, es preferible dejar el último TC bueno que bajar los precios a 17.43.
  if (tc.fuente === "respaldo") {
    return { ...base, ok: false, motivo: "Sin dato de Banxico: se conservan los precios del último tipo de cambio." };
  }

  const productos = await leerProductosUsd();
  if (!productos) return { ...base, ok: false, motivo: "No se pudo leer el catálogo en dólares de Shopify." };

  const renglones: Renglon[] = [];
  const anteriores: number[] = [];
  for (const p of productos) {
    const nuevo = precioNuevo(p, tc.valor);
    if (!nuevo) continue;
    anteriores.push(nuevo.tcAnterior);
    if (Math.abs(nuevo.tcAnterior - tc.valor) >= TOLERANCIA_TC) renglones.push(nuevo.renglon);
  }
  // El TC anterior más frecuente (todas las piezas deberían traer el mismo).
  const moda = anteriores.length
    ? Number(
        [...anteriores.reduce((m, t) => m.set(t.toFixed(3), (m.get(t.toFixed(3)) ?? 0) + 1), new Map<string, number>())]
          .sort((a, b) => b[1] - a[1])[0][0],
      )
    : null;
  const resumen = { ...base, revisados: productos.length, porCambiar: renglones.length, tcAnterior: moda };

  if (!renglones.length) return { ...resumen, ok: true, motivo: "Los precios ya están al tipo de cambio del día." };
  if (!aplicar) return { ...resumen, ok: true, motivo: "Simulación: no se escribió nada." };

  const ruta = await subirJsonl(renglones.map((r) => JSON.stringify(r)).join("\n"));
  if (!ruta) return { ...resumen, ok: false, motivo: "No se pudo subir el archivo de precios a Shopify." };

  type R = {
    bulkOperationRunMutation: {
      bulkOperation: { id: string; status: string } | null;
      userErrors: { message: string; code: string | null }[];
    };
  };
  const data = await adminFetch<R>(CORRER, { mutation: PRECIO_VARIANTES, ruta }, TIMEOUT_MS);
  const op = data?.bulkOperationRunMutation.bulkOperation;
  if (!op) {
    // El caso típico: otra operación masiva sigue corriendo (Shopify admite una a la vez).
    console.error("[repreciar] bulkOperationRunMutation:", data?.bulkOperationRunMutation.userErrors);
    return { ...resumen, ok: false, motivo: "Shopify no aceptó la operación masiva (¿hay otra en curso?)." };
  }

  const final = await esperarOperacion(op.id);
  return {
    ...resumen,
    ok: final?.status === "COMPLETED",
    operacion: final ?? op,
    ...(final?.status === "COMPLETED" ? {} : { motivo: "La operación masiva no terminó dentro del tiempo de espera." }),
  };
}
