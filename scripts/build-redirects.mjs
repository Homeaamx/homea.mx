// Resuelve el mapa de migración OXATIS → destinos reales del sitio (corre en
// `prebuild`, o sea en cada deploy). Escribe data/redirects/oxatis-map.json, que
// lee proxy.ts.
//
// Por qué en build y no una sola vez: el destino depende de qué páginas existen HOY.
//   · Ficha de producto: si ya existe /producto/<sku> (mismo andamiaje que las
//     fichas actuales, preview/producto-<sku>.html), la URL vieja va a la ficha.
//     Si la marca aún no está construida, va al listado de su familia; en cuanto
//     se agregue la ficha, el siguiente deploy cambia el 301 solo.
//   · Familia (macro/sub1/sub2): se recorta al nivel más profundo que ya tenga
//     página (tipo → subcategoría → macro), así nunca apunta a un 404.
//   · PDFs: van a la URL de Shopify Files cuando se captura en
//     data/listas-precios.json o data/redirects/pdfs-legacy.json; si no, pendiente.
//
// Entradas: data/redirects/{oxatis-auto,oxatis-manual,pdfs-legacy,palabras-clave}.json,
// data/listas-precios.json, preview/*.html, lib/filtrosPlp.ts.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DIR = join(ROOT, "data", "redirects");
const leer = (ruta) => JSON.parse(readFileSync(ruta, "utf8"));

const LISTAS = "/marcas#listas-de-precios";

// --- Páginas que existen hoy --------------------------------------------------
const preview = readdirSync(join(ROOT, "preview"));
const fichas = new Set(
  preview
    .filter((f) => f.startsWith("producto-") && f.endsWith(".html"))
    .map((f) => f.slice("producto-".length, -".html".length))
);
const macros = new Set(
  preview
    .filter((f) => f.startsWith("categoria-") && f.endsWith(".html"))
    .map((f) => f.slice("categoria-".length, -".html".length))
);
const subcats = new Set(
  preview
    .filter((f) => f.startsWith("subcategoria-") && f.endsWith(".html"))
    .map((f) => f.slice("subcategoria-".length, -".html".length).replace("--", "/"))
);
// Páginas de tipo (Subcategoría 2): claves de FILTROS_PLP, igual que su generateStaticParams.
const tipos = new Set(
  [...readFileSync(join(ROOT, "lib", "filtrosPlp.ts"), "utf8").matchAll(/^\s*"([a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+)":\s*\[/gm)].map(
    (m) => m[1]
  )
);

/** Familia de la taxonomía → la página existente más profunda (o null). */
function resolverFamilia(familia, filtro) {
  if (!familia) return null;
  if (familia.startsWith("/")) return familia;
  const [a, b, c] = familia.split("/");
  if (c && tipos.has(`${a}/${b}/${c}`))
    return `/productos/${a}/${b}/${c}${filtro ? `?f=${filtro}` : ""}`;
  if (b && subcats.has(`${a}/${b}`)) return `/productos/${a}/${b}`;
  if (macros.has(a)) return `/productos/${a}`;
  return null;
}

// --- Construcción del mapa ----------------------------------------------------
const mapa = {};
const stats = { ficha: 0, listado: 0, manual: 0, pdf: 0, pdfPendiente: 0, sinPagina: [] };

const auto = leer(join(DIR, "oxatis-auto.json"));
for (const [ruta, e] of Object.entries(auto)) {
  if (e.s && fichas.has(e.s)) {
    mapa[ruta] = `/producto/${e.s}`;
    stats.ficha++;
    continue;
  }
  const destino = resolverFamilia(e.t, e.f) ?? e.u ?? null;
  if (destino) {
    mapa[ruta] = destino;
    stats.listado++;
  } else stats.sinPagina.push(ruta);
}

const norm = (p) => p.toLowerCase().replace(/\/+$/, "");

for (const m of leer(join(ROOT, "data", "listas-precios.json")).marcas) {
  for (const d of m.documentos) {
    for (const p of d.legacy) {
      mapa[norm(p)] = d.url || LISTAS;
      d.url ? stats.pdf++ : stats.pdfPendiente++;
    }
  }
}
for (const [ruta, e] of Object.entries(leer(join(DIR, "pdfs-legacy.json")).pdfs)) {
  mapa[ruta] = e.url || resolverFamilia(e.t) || LISTAS;
  e.url ? stats.pdf++ : stats.pdfPendiente++;
}

// Lo manual gana a todo lo demás.
for (const [ruta, destino] of Object.entries(leer(join(DIR, "oxatis-manual.json")).rutas)) {
  mapa[ruta] = destino;
  stats.manual++;
}

// Palabras clave ya resueltas, para URLs viejas que no están en el inventario.
const claves = leer(join(DIR, "palabras-clave.json"))
  .claves.map(([clave, familia, filtro]) => [clave, resolverFamilia(familia, filtro)])
  .filter(([, destino]) => destino);

// Destinos deduplicados: el mapa guarda índices (≈4k rutas → pocos cientos de destinos).
const destinos = [...new Set([...Object.values(mapa), ...claves.map(([, d]) => d)])].sort();
const idx = new Map(destinos.map((d, i) => [d, i]));
const salida = {
  generado: new Date().toISOString(),
  destinos,
  rutas: Object.fromEntries(Object.entries(mapa).map(([r, d]) => [r, idx.get(d)])),
  claves: claves.map(([c, d]) => [c, idx.get(d)]),
};
writeFileSync(join(DIR, "oxatis-map.json"), JSON.stringify(salida));

console.log(
  `[redirects] ${Object.keys(mapa).length} rutas · ficha ${stats.ficha} · listado ${stats.listado} · ` +
    `manual ${stats.manual} · pdf ${stats.pdf} (pendientes ${stats.pdfPendiente}) · ` +
    `sin página ${stats.sinPagina.length} · fichas publicadas ${fichas.size}`
);
