// Auditoría de fotos de las tarjetas de producto (regla de Carla, 2026-10-08):
// toda pieza publicada necesita AL MENOS 2 FOTOS DEL APARATO (no planos ni fichas).
// La 1.ª es la tarjeta; la 2.ª y siguientes van en la galería de la ficha:
//   refri abierto → cerrado · parrilla → acercamiento · horno cerrado → abierto…
// Los planos de medidas van DESPUÉS de las fotos (solo los usa la ficha).
//
// Lee las colecciones del sitio (lib/shopify/coleccionesWeb.ts) por Storefront API
// y resume por tipo cuántas piezas cumplen. Con --csv <ruta> escribe el detalle
// por SKU (para el equipo que consigue las fotos).
//
//   node --env-file=.env.local scripts/auditar-fotos-tarjetas.mjs [--csv salida.csv]
//
// Misma regla de "imagen técnica" que esImagenTecnica() en lib/shopify/htmlCatalogo.ts.

import { readFileSync, writeFileSync } from "node:fs";

const DOMINIO = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_API_TOKEN;
const VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-07";
if (!DOMINIO || !TOKEN) {
  console.error("Faltan NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN / SHOPIFY_STOREFRONT_API_TOKEN (usa --env-file=.env.local).");
  process.exit(1);
}

const colecciones = [
  ...readFileSync(new URL("../lib/shopify/coleccionesWeb.ts", import.meta.url), "utf8").matchAll(/coleccion: "([^"]+)"/g),
].map((m) => m[1]);

const esTecnica = (url, alt) => {
  const archivo = url.split("?")[0].split("/").pop() ?? "";
  return /^plano|^ficha|^diagrama/i.test(alt ?? "") || /(^|-)(plano|ficha-tecnica|line-drawing|diagrama)(-|\.)/i.test(archivo);
};

const CONSULTA = `query($h: String!, $a: String) {
  collection(handle: $h) { products(first: 100, after: $a) {
    pageInfo { hasNextPage endCursor }
    nodes { vendor productType title variants(first: 1) { nodes { sku } } images(first: 20) { nodes { url altText } } }
  } }
}`;

const piezas = new Map();
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
      const sku = n.variants.nodes[0]?.sku ?? n.title;
      const imgs = n.images.nodes;
      const fotos = imgs.filter((i) => !esTecnica(i.url, i.altText)).length;
      // Primera imagen técnica antes de una foto = orden incorrecto en Shopify.
      const ordenMal = imgs.findIndex((i) => esTecnica(i.url, i.altText)) > -1 &&
        imgs.findIndex((i) => esTecnica(i.url, i.altText)) < imgs.findLastIndex((i) => !esTecnica(i.url, i.altText));
      piezas.set(sku, { sku, marca: n.vendor, tipo: n.productType, titulo: n.title, fotos, planos: imgs.length - fotos, ordenMal });
    }
    despues = pag.pageInfo.hasNextPage ? pag.pageInfo.endCursor : null;
  } while (despues);
}

const lista = [...piezas.values()];
const porTipo = new Map();
for (const p of lista) {
  const t = porTipo.get(p.tipo) ?? { total: 0, cero: 0, una: 0, ok: 0, ordenMal: 0 };
  t.total++;
  if (p.fotos === 0) t.cero++;
  else if (p.fotos === 1) t.una++;
  else t.ok++;
  if (p.ordenMal) t.ordenMal++;
  porTipo.set(p.tipo, t);
}

console.log(`Piezas publicadas: ${lista.length} · con ≥2 fotos: ${lista.filter((p) => p.fotos >= 2).length}`);
console.table(Object.fromEntries([...porTipo].sort((a, b) => b[1].total - a[1].total).map(([t, v]) => [t, {
  piezas: v.total, "sin foto": v.cero, "1 foto": v.una, "≥2 fotos": v.ok, "plano antes de foto": v.ordenMal,
}])));

const i = process.argv.indexOf("--csv");
if (i > -1 && process.argv[i + 1]) {
  const filas = [["sku", "marca", "tipo", "titulo", "fotos_producto", "planos", "plano_antes_de_foto"]];
  for (const p of lista.sort((a, b) => a.tipo.localeCompare(b.tipo) || a.sku.localeCompare(b.sku))) {
    filas.push([p.sku, p.marca, p.tipo, p.titulo, p.fotos, p.planos, p.ordenMal ? "sí" : ""]);
  }
  writeFileSync(process.argv[i + 1], filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n"));
  console.log(`Detalle por SKU: ${process.argv[i + 1]}`);
}
