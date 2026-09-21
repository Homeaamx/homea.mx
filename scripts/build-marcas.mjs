// Genera data/marcas.json — el registro de marcas que alimenta /marcas/<slug>.
//
// Fuentes (no se duplica nada a mano):
//   preview/marcas.html       → slug (data-brand), gama (data-gama), categorías (data-sub)
//   public/assets/logos/      → logo de la marca (la extensión varía: .webp o .png)
//   public/assets/photos/brands/ → foto del hero (varía: .webp o .avif)
//   data/listas-precios.json  → qué listas de precios enseña cada marca
//
// Se corre a mano (`npm run marcas`) cuando cambian las marcas o sus archivos.
// A propósito NO está en `prebuild`: ese hook lo comparten otras sesiones.
//
// Idempotente: conserva los campos escritos a mano (`descripcion`) de la versión
// anterior. Sale con 1 si una marca se queda sin logo o sin foto.

import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SALIDA = join(ROOT, "data", "marcas.json");

// Nombre visible de cada marca. El tile solo trae la versión en mayúsculas
// (<span class="bn">SUBZERO</span>), que no sirve para un <h1> ni para un <title>.
// Se escribe aquí con la grafía oficial de cada marca.
const NOMBRES = {
  "la-cornue": "La Cornue", gaggenau: "Gaggenau", thermador: "Thermador",
  monogram: "Monogram", miele: "Miele", viking: "Viking", wolf: "Wolf",
  "sub-zero": "Sub-Zero", cove: "Cove", "pitt-cooking": "Pitt Cooking",
  invisacook: "Invisacook", benessi: "Benessi", "u-line": "U-Line", bosch: "Bosch",
  thor: "Thor", asko: "ASKO", scotsman: "Scotsman", elica: "Elica",
  tradewind: "Trade-Wind", falmec: "Falmec", "fulgor-milano": "Fulgor Milano",
  summit: "Summit", kalt: "Kalt", sapphire: "Sapphire", cafe: "Café",
  kitchenaid: "KitchenAid", hoshizaki: "Hoshizaki", electrolux: "Electrolux",
  frigidaire: "Frigidaire", smeg: "Smeg", bertazzoni: "Bertazzoni", maytag: "Maytag",
  haier: "Haier", "ge-profile": "GE Profile", whirlpool: "Whirlpool",
  "io-mabe": "IO Mabe", teka: "Teka", dexa: "Dexa", tecnolam: "Tecnolam",
  mabe: "Mabe", axcent: "Axcent", supra: "Supra", "the-galley": "The Galley",
  brizo: "Brizo", nobili: "Nobili", blanco: "Blanco", franke: "Franke",
  peerless: "Peerless", dawn: "Dawn", schock: "Schock", gessi: "Gessi",
  moen: "Moen", delta: "Delta", "poletti-sinks": "Poletti Sinks",
  "american-standard": "American Standard", eclipse: "Eclipse",
  "kele-master-sinks": "Kele Master Sinks", insinkerator: "InSinkErator",
  lynx: "Lynx", "sedona-by-lynx": "Sedona by Lynx", alfresco: "Alfresco",
  coyote: "Coyote", artisan: "Artisan", "alfa-forni": "Alfa Forni", blaze: "Blaze",
  "kamado-joe": "Kamado Joe", masterbuilt: "Masterbuilt", wppo: "WPPO",
  "mont-alpi": "Mont Alpi", "broil-king": "Broil King", axor: "AXOR",
  hansgrohe: "Hansgrohe", "i-drain": "I-Drain", "mr-steam": "Mr. Steam",
  acros: "Acros", elkay: "Elkay", keuco: "Keuco",
};

// data-sub del tile → a dónde manda esa categoría en el sitio.
const CATEGORIAS = {
  cocina: { nombre: "Cocina y Bar", ruta: "/productos/cocina-y-bar" },
  tarjas: { nombre: "Tarjas y Monomandos", ruta: "/productos/cocina-y-bar/tarjas-y-griferia" },
  trituradores: { nombre: "Trituradores", ruta: "/productos/cocina-y-bar/trituradores" },
  asadores: { nombre: "Asadores y Hornos", ruta: "/productos/exterior/asadores-y-hornos" },
  banos: { nombre: "Baños", ruta: "/productos/banos" },
  menores: { nombre: "Electrodomésticos menores", ruta: "/productos/electrodomesticos-menores" },
  vapor: { nombre: "Vapor y Sauna", ruta: "/productos/vapor-y-sauna" },
};

// data-gama del tile → cómo se escribe la gama en pantalla.
const GAMAS = {
  premium: "Premium",
  residencial: "Residencial",
  media: "Media",
  economica: "Económica",
};

// La marca de la lista de precios no siempre se llama igual que el tile.
// Izquierda: `marca` en data/listas-precios.json. Derecha: slug(s) de tile.
// Las marcas con lista pero SIN tile (Josper, Jacuzzi, Clearlight, Onix, Fortum,
// Steamist, Catalano) no aparecen aquí: no tienen logo ni foto, así que no tienen
// página. Su lista se sigue viendo en /marcas#listas-de-precios.
const LISTAS_A_TILE = {
  Kele: ["kele-master-sinks"],
  "Frigidaire · Electrolux": ["frigidaire", "electrolux"],
};

const slugificar = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Busca <dir>/<slug>.<ext> sin saber la extensión (varía marca por marca). */
function archivo(dir, slug) {
  const encontrado = readdirSync(join(ROOT, "public", dir)).find((f) =>
    /\.(webp|avif|png|svg|jpg|jpeg)$/i.test(f) && f.replace(/\.[^.]+$/, "") === slug
  );
  return encontrado ? `/${dir}/${encontrado}` : null;
}

// ── 1. Marcas desde los tiles de preview/marcas.html ────────────────────────
const html = readFileSync(join(ROOT, "preview", "marcas.html"), "utf8");
// La etiqueta completa del tile; los atributos se leen aparte para no depender
// del orden en que estén escritos.
const RE_TILE = /<a\s[^>]*class="brandtile"[^>]*>/g;
const atributo = (tag, nombre) => tag.match(new RegExp(`${nombre}="([^"]*)"`))?.[1] ?? "";

const errores = [];
const marcas = [];
const vistos = new Set();

for (const [tag] of html.matchAll(RE_TILE)) {
  const slug = atributo(tag, "data-brand");
  const gama = atributo(tag, "data-gama");
  const sub = atributo(tag, "data-sub");
  if (!slug) {
    errores.push(`tile sin data-brand: ${tag.slice(0, 80)}`);
    continue;
  }
  if (vistos.has(slug)) {
    errores.push(`tile repetido: ${slug}`);
    continue;
  }
  vistos.add(slug);

  const nombre = NOMBRES[slug];
  if (!nombre) errores.push(`${slug}: falta su nombre en NOMBRES (scripts/build-marcas.mjs)`);

  const logo = archivo("assets/logos", slug);
  const foto = archivo("assets/photos/brands", slug);
  if (!logo) errores.push(`${slug}: no hay logo en public/assets/logos/`);
  if (!foto) errores.push(`${slug}: no hay foto en public/assets/photos/brands/`);

  const categorias = sub.split(/\s+/).filter(Boolean);
  for (const c of categorias) {
    if (!CATEGORIAS[c]) errores.push(`${slug}: data-sub "${c}" no está en CATEGORIAS`);
  }

  const gamas = gama.split(/\s+/).filter(Boolean);
  for (const g of gamas) {
    if (!GAMAS[g]) errores.push(`${slug}: data-gama "${g}" no está en GAMAS`);
  }

  marcas.push({
    slug,
    nombre: nombre ?? slug,
    gama: gamas,
    categorias,
    logo,
    foto,
    listas: [],
  });
}

// ── 2. Listas de precios de cada marca ──────────────────────────────────────
const listas = JSON.parse(readFileSync(join(ROOT, "data", "listas-precios.json"), "utf8"));
const porSlug = new Map(marcas.map((m) => [m.slug, m]));

for (const entrada of listas.marcas) {
  const destinos = LISTAS_A_TILE[entrada.marca] ?? [slugificar(entrada.marca)];
  const docs = entrada.documentos.map((d) => d.slug);
  let colocada = false;
  for (const destino of destinos) {
    const marca = porSlug.get(destino);
    if (!marca) continue;
    marca.listas.push(...docs);
    colocada = true;
  }
  // Sin tile = sin página. Es lo esperado para las 7 marcas sin logo ni foto,
  // pero se avisa por si alguna marca nueva se quedó sin conectar por un typo.
  if (!colocada) {
    console.warn(`  · "${entrada.marca}" tiene lista pero no tiene página (sin tile en marcas.html)`);
  }
}

if (errores.length) {
  console.error("data/marcas.json NO se escribió:");
  for (const e of errores) console.error(`  ✗ ${e}`);
  process.exit(1);
}

// ── 3. Conservar lo escrito a mano y guardar ────────────────────────────────
if (existsSync(SALIDA)) {
  const previo = JSON.parse(readFileSync(SALIDA, "utf8"));
  const descripciones = new Map(
    (previo.marcas ?? []).filter((m) => m.descripcion).map((m) => [m.slug, m.descripcion])
  );
  for (const m of marcas) {
    const d = descripciones.get(m.slug);
    if (d) m.descripcion = d;
  }
}

marcas.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

const salida = {
  _nota:
    "Registro de marcas de /marcas/<slug>. GENERADO por scripts/build-marcas.mjs " +
    "(`npm run marcas`) desde preview/marcas.html, public/assets/ y data/listas-precios.json. " +
    "No editar a mano, salvo 'descripcion', que el generador conserva. " +
    "Marca nueva: agrega su tile en preview/marcas.html, su logo en public/assets/logos/, " +
    "su foto en public/assets/photos/brands/ y su nombre en NOMBRES del script; luego corre `npm run marcas`.",
  // A dónde manda cada categoría (el `categorias` de cada marca son claves de aquí).
  // Va en el JSON para que lib/marcas.ts no tenga que repetir la tabla.
  categorias: CATEGORIAS,
  gamas: GAMAS,
  marcas,
};

writeFileSync(SALIDA, `${JSON.stringify(salida, null, 2)}\n`);

const conLista = marcas.filter((m) => m.listas.length).length;
console.log(`data/marcas.json · ${marcas.length} marcas · ${conLista} con lista de precios`);
