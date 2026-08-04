// build-search-index.mjs — genera el índice que alimenta el buscador de la lupa.
//
// Fuente: los CSV de import de Shopify en `catalogo-shopify/import/`. Son el
// mismo archivo que se subió a la tienda, así que el índice y el catálogo de
// Shopify no pueden divergir sin que alguien re-importe.
//
// Salida: data/catalogo-index.json — lo lee lib/catalogo.ts en el servidor.
// El índice NUNCA se manda completo al navegador: /api/buscar filtra y devuelve
// como mucho 8 filas. Con 25k productos eso sigue siendo un JSON de ~4 MB en
// memoria del servidor, aceptable; si crece más, el paso natural es mover la
// búsqueda a la Storefront API de Shopify (ver README del buscador).
//
// Uso:  node scripts/build-search-index.mjs

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR_IMPORT = join(ROOT, "catalogo-shopify", "import");
const DIR_PACKSHOTS = join(ROOT, "public", "assets", "photos");
const SALIDA = join(ROOT, "data", "catalogo-index.json");

/* ---------- CSV ---------------------------------------------------------- */

/** Parser de CSV con comillas y saltos de línea dentro de celda (formato Shopify). */
function parseCsv(texto) {
  const filas = [];
  let fila = [];
  let celda = "";
  let enComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (enComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { celda += '"'; i++; } else { enComillas = false; }
      } else celda += c;
      continue;
    }
    if (c === '"') { enComillas = true; continue; }
    if (c === ",") { fila.push(celda); celda = ""; continue; }
    if (c === "\r") continue;
    if (c === "\n") { fila.push(celda); filas.push(fila); fila = []; celda = ""; continue; }
    celda += c;
  }
  if (celda !== "" || fila.length) { fila.push(celda); filas.push(fila); }

  const [encabezado, ...resto] = filas;
  return resto
    .filter((f) => f.some((v) => v.trim() !== ""))
    .map((f) => Object.fromEntries(encabezado.map((h, i) => [h.trim(), (f[i] ?? "").trim()])));
}

/* ---------- Normalización ------------------------------------------------ */

/** Categoría deducida del título: el campo Type del CSV es "Electrodoméstico"
 *  en 172 de 310 filas, así que no sirve para elegir la imagen representativa. */
const CATEGORIAS = [
  [/lavavajillas/i, "lavavajillas"],
  [/campana|extractor/i, "campanas"],
  // "Columna de Refrigeración" también es refrigeración, no solo "Refrigerador".
  [/refrigerad|refrigeraci|frigor/i, "refrigeradores"],
  [/congelador/i, "congeladores"],
  [/cava|vino/i, "cavas"],
  [/microonda/i, "microondas"],
  [/parrilla|cooktop|placa de inducci/i, "parrillas"],
  [/horno de pizza/i, "hornos-pizza"],
  [/horno|vapor|combi/i, "hornos"],
  [/estufa|range\b/i, "estufas"],
  [/caj[oó]n/i, "cajones"],
  [/cafeter|caf[eé]/i, "cafeteras"],
  [/asador|grill/i, "asadores"],
  [/m[aá]quina de hielo|hielo/i, "hielo"],
  [/calentador|boiler/i, "calentadores"],
  [/grifer|monomando|mezcladora/i, "griferia"],
  [/fregadero|tarja/i, "fregaderos"],
];

/** Imagen representativa por categoría — packshots ya curados en /public. */
const IMG_CATEGORIA = {
  refrigeradores: "/assets/photos/tipos/refrigerador-columna-congelador-acero.png",
  congeladores: "/assets/photos/tipos/refrigerador-columna-congelador-acero.png",
  cavas: "/assets/photos/tipos/refrigerador-bajo-cubierta-cava-acero.jpg",
  parrillas: "/assets/photos/tipos/parrilla-gas-quemadores-laton.png",
  asadores: "/assets/photos/tipos/parrilla-profesional-rangetop-perillas-acero.jpg",
  estufas: "/assets/photos/tipos/parrilla-profesional-rangetop-perillas-acero.jpg",
  hornos: "/assets/photos/gaggenau/gaggenau-bop250612.png",
  "hornos-pizza": "/assets/photos/gaggenau/gaggenau-bop250612.png",
  microondas: "/assets/photos/gaggenau/gaggenau-bop250612.png",
  cajones: "/assets/photos/gaggenau/gaggenau-bop250612.png",
  campanas: "/assets/photos/gaggenau/gaggenau-aw442720.png",
  lavavajillas: "/assets/photos/gaggenau/gaggenau-df480701.png",
};

function categoriaDe(titulo, tipo) {
  for (const [re, cat] of CATEGORIAS) if (re.test(titulo)) return cat;
  return tipo && tipo !== "Electrodoméstico" ? tipo.toLowerCase() : "otros";
}

/** Refacciones y complementos: "Manija de Puerta para Refrigerador", "Ducto
 *  Plano DN 150", "Set de 4 Cartuchos de Limpieza".
 *
 *  Se decide por el SUSTANTIVO CON EL QUE ABRE EL TÍTULO, no por palabras
 *  sueltas: "Lavavajillas … Bisagra Flexible" es un aparato aunque diga bisagra,
 *  y "Manija de Puerta para Refrigerador" es una refacción aunque diga
 *  refrigerador. La regla de titulación del catálogo (GUIA-TITULOS.md) garantiza
 *  que el aparato siempre abre con su categoría.
 *
 *  Importa por dos motivos: un accesorio NO debe heredar la foto del aparato al
 *  que acompaña (sería engañoso) ni ganarle en el ranking a quien busca el aparato. */
// Incluye las formas propias de la gama empotrable: "Columna de Refrigeración"
// es un refrigerador y los módulos Vario ("Quemador Wok", "Teppan Yaki",
// "Grill Eléctrico") son aparatos, no refacciones.
const RE_APARATO =
  /^(refrigerador|congelador|frigobar|columna|cava|vinoteca|horno|microondas|lavavajillas|campana|extractor|parrilla|cooktop|placa|estufa|range|asador|cafetera|caj[oó]n|m[aá]quina de hielo|calentador|fregadero|tarja|monomando|mezcladora|llave|regadera|lavadora|secadora|minisplit|m[oó]dulo|quemador|teppan|grill|freidora|vaporera|wok|plancha|domin[oó])/i;

/** "Asador de Aluminio Fundido GN 2/3 para Hornos GO/GS" abre con sustantivo de
 *  aparato pero es un complemento: lo delata el "para <aparato>". */
const RE_PARA_APARATO =
  /\bpara\s+(hornos?|lavavajillas|campanas?|refrigeradores?|congeladores?|cavas?|parrillas?|estufas?|cafeteras?|extractores?|motores?)\b/i;

// Se ignora el campo Type a propósito: en el catálogo importado es
// "Electrodoméstico" en 172 de 310 filas y trae errores de captura (p. ej.
// RVY497790, un refrigerador French Door, viene como "Accesorios de cocción").
// El título es el dato confiable.
function esAccesorio(titulo) {
  if (RE_PARA_APARATO.test(titulo)) return true;
  return !RE_APARATO.test(titulo.trim());
}

/** Ancho/alto de un PNG desde su cabecera IHDR (bytes 16–24). null si no es PNG. */
function medidasPng(ruta) {
  const buf = readFileSync(ruta);
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { ancho: buf.readUInt32BE(16), alto: buf.readUInt32BE(20) };
}

// Umbral de proporción para la miniatura de 62 px: una foto muy apaisada (la de
// la parrilla es 1600×902) se reduce a una tira de 35 px de alto y se lee como
// un cuadro vacío. Por encima de esto gana el packshot cuadrado de la categoría.
const RATIO_MAX_THUMB = 1.4;

/** Packshot propio del SKU si existe (hoy: los 5 Gaggenau de la fase piloto). */
function packshotDeSku(sku) {
  const slug = sku.toLowerCase();
  for (const marca of ["gaggenau"]) {
    for (const ext of ["png", "jpg", "webp"]) {
      const abs = join(DIR_PACKSHOTS, marca, `${marca}-${slug}.${ext}`);
      if (!existsSync(abs)) continue;
      if (ext === "png") {
        const m = medidasPng(abs);
        if (m && m.ancho / m.alto > RATIO_MAX_THUMB) return null;
      }
      return `/assets/photos/${marca}/${marca}-${slug}.${ext}`;
    }
  }
  return null;
}

/** Ruta de la ficha si el producto ya tiene PDP publicada (preview/producto-<sku>.html).
 *  Hoy son los 5 Gaggenau del piloto; el resto todavía no tiene página propia y
 *  el buscador los resuelve por WhatsApp (modelo de lead del sitio). */
function fichaDeSku(sku) {
  const slug = sku.toLowerCase();
  return existsSync(join(ROOT, "preview", `producto-${slug}.html`)) ? `/producto/${slug}` : null;
}

/** "Horno Empotrable 24\" — Serie 200" → nombre corto + serie por separado. */
function partirTitulo(titulo) {
  const [nombre, ...cola] = titulo.split(/\s+—\s+/);
  return { nombre: nombre.trim(), serie: cola.join(" — ").trim() || null };
}

/** Los precios del catálogo importado vienen SIN IVA y en la moneda del tag. */
function monedaDe(tags) {
  return /moneda\s+usd/i.test(tags) ? "USD" : "MXN";
}

/* ---------- Build -------------------------------------------------------- */

const archivos = existsSync(DIR_IMPORT)
  ? readdirSync(DIR_IMPORT).filter((f) => f.toLowerCase().endsWith(".csv"))
  : [];

if (archivos.length === 0) {
  console.error(`No hay CSV en ${DIR_IMPORT}`);
  process.exit(1);
}

const porSku = new Map();

for (const archivo of archivos) {
  const filas = parseCsv(readFileSync(join(DIR_IMPORT, archivo), "utf8"));
  for (const f of filas) {
    const sku = (f["Variant SKU"] || "").trim();
    const titulo = (f["Title"] || "").trim();
    // Filas de variante (sin título) y filas sin SKU no son productos buscables.
    if (!sku || !titulo) continue;

    const tags = f["Tags"] || "";
    const { nombre, serie } = partirTitulo(titulo);
    const categoria = categoriaDe(titulo, f["Type"] || "");
    const precio = Number.parseFloat(f["Variant Price"] || "0") || 0;
    const accesorio = esAccesorio(titulo);

    porSku.set(sku, {
      sku,
      handle: f["Handle"] || "",
      titulo,
      nombre,
      serie,
      marca: f["Vendor"] || "",
      tipo: f["Type"] || "",
      categoria,
      // Precio base SIN IVA, tal como vive en Shopify (taxesIncluded: false).
      precio,
      moneda: monedaDe(tags),
      estado: (f["Status"] || "draft").toLowerCase(),
      accesorio,
      // Un accesorio nunca hereda la foto de la categoría: o tiene la suya o va sin foto.
      imagen: packshotDeSku(sku) ?? (accesorio ? null : IMG_CATEGORIA[categoria] ?? null),
      ficha: fichaDeSku(sku),
      // Campo plano de búsqueda: se compara ya normalizado en lib/catalogo.ts.
      // Se incluye `categoria` para salvar las variantes de nombre: "Columna de
      // Refrigeración" es un refrigerador, pero la palabra "refrigerador" no
      // aparece en su título — sí en su categoría ("refrigeradores").
      busca: [titulo, sku, f["Vendor"], f["Type"], tags, categoria].filter(Boolean).join(" "),
    });
  }
}

const productos = [...porSku.values()].sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));

/* ---------- Diccionario de sugerencias (autocompletado en línea) ---------- */
//
// Alimenta el "ghost text" del buscador: el cliente teclea "refri" y el campo
// completa "gerador" en gris. Son frases REALES del catálogo, no un diccionario
// del idioma — así la sugerencia siempre lleva a resultados.
//
// Corpus: marcas + SKUs + n-gramas de 1 a 4 palabras tomados DESDE EL INICIO del
// título. Se toman desde el inicio porque los títulos del catálogo abren con la
// categoría ("Refrigerador Empotrable con…", "Parrilla de Gas Natural 30\""),
// que es justo por donde teclea la gente. N-gramas interiores producirían
// basura del tipo "de agua apertura".

const STOPWORDS = new Set(["de", "del", "con", "y", "o", "a", "en", "para", "la", "el", "los", "las", "por", "sin"]);
const MAX_PALABRAS = 4;

/** Minúsculas y sin acentos, PRESERVANDO la longitud (no colapsa signos):
 *  imprescindible para poder cortar la sugerencia por índice de carácter. */
function plano(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const pesos = new Map(); // plano → { display, peso }

function sumar(frase, peso) {
  const limpia = frase.trim().replace(/\s+/g, " ");
  if (limpia.length < 3) return;
  const clave = plano(limpia);
  const previo = pesos.get(clave);
  if (previo) previo.peso += peso;
  else pesos.set(clave, { display: limpia, peso });
}

for (const p of productos) {
  if (p.marca) sumar(p.marca, 3);
  sumar(p.sku, 1);

  const palabras = p.nombre.split(/\s+/).filter(Boolean);
  for (let n = 1; n <= Math.min(MAX_PALABRAS, palabras.length); n++) {
    const frase = palabras.slice(0, n).join(" ");
    // Una sugerencia no debe terminar en preposición: "horno de" no ayuda.
    if (STOPWORDS.has(plano(palabras[n - 1]))) continue;
    // Los accesorios cuentan menos: quien teclea "parr" quiere la parrilla.
    sumar(frase, p.accesorio ? 1 : 4);
  }
}

const sugerencias = [...pesos.entries()]
  .map(([clave, v]) => ({ c: clave, t: v.display, p: v.peso }))
  // Más frecuente primero; a igual peso, la frase más corta (completa antes).
  .sort((a, b) => b.p - a.p || a.c.length - b.c.length);

// Vocabulario de palabras sueltas: respaldo cuando la frase completa no existe
// en el catálogo. El cliente escribe "horno de va" y espera "vapor", pero el
// título real es "Horno Combi-Vapor" — como frase no empata, así que se completa
// solo la última palabra. Por eso aquí se parte también por guiones.
const vocab = new Map();
for (const p of productos) {
  const peso = p.accesorio ? 1 : 4;
  for (const palabra of p.nombre.split(/[^\p{L}\p{N}]+/u)) {
    if (palabra.length < 4 || STOPWORDS.has(plano(palabra))) continue;
    const clave = plano(palabra);
    const previo = vocab.get(clave);
    if (previo) previo.p += peso;
    else vocab.set(clave, { c: clave, t: palabra, p: peso });
  }
}

const palabras = [...vocab.values()].sort((a, b) => b.p - a.p || a.c.length - b.c.length);

mkdirSync(dirname(SALIDA), { recursive: true });
writeFileSync(
  SALIDA,
  JSON.stringify(
    { generado: new Date().toISOString(), fuente: archivos, productos, sugerencias, palabras },
    null,
    0,
  ),
);

const conImagen = productos.filter((p) => p.imagen).length;
const activos = productos.filter((p) => p.estado === "active").length;
console.log(`✓ ${productos.length} productos → data/catalogo-index.json`);
console.log(`  ${conImagen} con imagen · ${activos} active · ${productos.length - activos} draft`);
console.log(`  ${sugerencias.length} frases + ${palabras.length} palabras de autocompletado`);
