// Sugerencias de compra por modelo, tomadas del catálogo del fabricante.
//
// Regla de Carla (2026-10-08): en la ficha, "Productos relacionados" muestra
// primero lo que el CATÁLOGO del fabricante sugiere comprar con ese equipo
// (paneles y manijas para refrigeración, filtros de carbón para campanas, kits
// de conversión de gas para cocción, kits de limpieza…). Si no hay ninguna
// sugerencia que tengamos publicada, la ficha cae a productos similares.
//
// Fuente: la ficha pública de Gaggenau US (gaggenau.com/us/en/mkt-product/<SKU>)
// trae en su JSON tres listas oficiales por modelo:
//   additionalAccessoryProductIDs   → accesorios
//   additionalCleaningProductIDs    → limpieza y cuidado
//   additionalCombinableProductIDs  → equipos combinables (p. ej. columnas lado a lado)
// Los IDs numéricos (refacciones BSH, p. ej. 00616742) se conservan, pero solo se
// muestran los que existen como producto en nuestra tienda.
//
// Uso (re-ejecutar cada vez que cambie el catálogo de Gaggenau en Shopify):
//   node --env-file=.env.local scripts/sugerencias-compra.mjs
// Escribe data/sugerencias-compra.json  { "<SKU>": { accesorios, limpieza, combinables } }.
// Para otras marcas: agregar su fuente aquí (misma forma de salida).

import { readFileSync, writeFileSync } from "node:fs";

const DOMINIO = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_API_TOKEN;
const VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-07";
if (!DOMINIO || !TOKEN) {
  console.error("Faltan NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN / SHOPIFY_STOREFRONT_API_TOKEN (usa --env-file=.env.local).");
  process.exit(1);
}
const SALIDA = new URL("../data/sugerencias-compra.json", import.meta.url);

// 1. Piezas Gaggenau publicadas (todas las colecciones del sitio).
const colecciones = [
  ...readFileSync(new URL("../lib/shopify/coleccionesWeb.ts", import.meta.url), "utf8").matchAll(/coleccion: "([^"]+)"/g),
].map((m) => m[1]);
const CONSULTA = `query($h: String!, $a: String) {
  collection(handle: $h) { products(first: 100, after: $a) {
    pageInfo { hasNextPage endCursor }
    nodes { vendor variants(first: 1) { nodes { sku } } }
  } }
}`;
const skus = new Set();
for (const h of colecciones) {
  let despues = null;
  do {
    const r = await fetch(`https://${DOMINIO}/api/${VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": TOKEN },
      body: JSON.stringify({ query: CONSULTA, variables: { h, a: despues } }),
    }).then((x) => x.json());
    const pag = r.data?.collection?.products;
    if (!pag) break;
    for (const n of pag.nodes) {
      const sku = n.variants.nodes[0]?.sku;
      if (sku && /gaggenau/i.test(n.vendor)) skus.add(sku);
    }
    despues = pag.pageInfo.hasNextPage ? pag.pageInfo.endCursor : null;
  } while (despues);
}
// Pilotos con ficha propia (preview/producto-<sku>.html).
for (const f of ["VG295250CA", "BOP250612", "AW442720", "DF480701", "RB282705"]) skus.add(f);

// 2. Listas oficiales de cada modelo.
const lista = (html, clave) => {
  const m = html.match(new RegExp(`\\\\"${clave}\\\\":\\[([^\\]]*)\\]`));
  return m ? [...m[1].matchAll(/\\"([A-Z0-9-]+)\\"/g)].map((x) => x[1]) : [];
};
const salida = {};
let conDatos = 0;
for (const sku of [...skus].sort()) {
  const r = await fetch(`https://www.gaggenau.com/us/en/mkt-product/${sku}`, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) continue;
  const html = await r.text();
  const fila = {
    accesorios: lista(html, "additionalAccessoryProductIDs"),
    limpieza: lista(html, "additionalCleaningProductIDs"),
    combinables: lista(html, "additionalCombinableProductIDs"),
  };
  if (fila.accesorios.length || fila.limpieza.length || fila.combinables.length) {
    salida[sku] = fila;
    conDatos++;
  }
  await new Promise((ok) => setTimeout(ok, 250)); // sin prisa: es un sitio ajeno
}

writeFileSync(SALIDA, JSON.stringify(salida, null, 1) + "\n");
const enTienda = Object.values(salida).filter((f) =>
  [...f.accesorios, ...f.limpieza, ...f.combinables].some((s) => skus.has(s)),
).length;
console.log(`${skus.size} modelos revisados · ${conDatos} con listas del fabricante · ${enTienda} con al menos una sugerencia publicada en la tienda.`);
