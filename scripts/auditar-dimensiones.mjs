// auditar-dimensiones.mjs — qué productos quedan SIN medidas del producto en la
// pestaña Dimensiones con la regla de lib/shopify/dimensiones.ts.
// Uso: node --experimental-strip-types scripts/auditar-dimensiones.mjs
import { clasificarDimensiones } from "../lib/shopify/dimensiones.ts";
const dom = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN, tok = process.env.SHOPIFY_STOREFRONT_API_TOKEN, v = process.env.SHOPIFY_STOREFRONT_API_VERSION || "2026-07";
async function q(query, variables) { const r = await fetch(`https://${dom}/api/${v}/graphql.json`, { method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": tok }, body: JSON.stringify({ query, variables }) }); return (await r.json()).data; }
let after = null, all = [];
for (;;) { const d = await q(`query($a:String){products(first:100,after:$a){pageInfo{hasNextPage endCursor}nodes{title productType variants(first:1){nodes{sku}} dim:metafield(namespace:"homea",key:"dimensiones"){value}}}}`, { a: after }); all.push(...d.products.nodes); if (!d.products.pageInfo.hasNextPage) break; after = d.products.pageInfo.endCursor; }
const sin = [], con = [], canon = new Map();
for (const p of all) {
  let lista = [];
  if (p.dim) { try { const j = JSON.parse(p.dim.value); lista = Array.isArray(j) ? j.map((x) => ({ nombre: String(x.nombre ?? x.name ?? ""), valor: String(x.valor ?? x.value ?? "") })) : Object.entries(j).map(([nombre, valor]) => ({ nombre, valor: String(valor) })); } catch { lista = [{ nombre: "Dimensiones", valor: p.dim.value }]; } }
  const { producto } = clasificarDimensiones(lista);
  for (const d of producto) canon.set(d.nombre, (canon.get(d.nombre) || 0) + 1);
  (producto.length ? con : sin).push({ sku: p.variants.nodes[0].sku, tipo: p.productType, titulo: p.title, tiene: lista.map((d) => d.nombre).join(" · ") });
}
console.log(`${all.length} productos · ${con.length} con medidas del producto · ${sin.length} sin`);
console.log("\nEtiquetas resultantes:"); for (const [k, n] of [...canon].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${k}`);
const porTipo = {}; for (const p of sin) porTipo[p.tipo] = (porTipo[p.tipo] || 0) + 1;
console.log("\nSin medidas del producto, por tipo:", porTipo);
console.log("\nSin medidas (SKU · tipo · lo que trae hoy):"); for (const p of sin) console.log(`  ${p.sku} · ${p.tipo} · ${p.tiene || "(sin metafield)"}`);
