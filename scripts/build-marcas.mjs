// Genera data/marcas.json — el registro de marcas que alimenta /marcas/<slug>.
//
// Fuentes (no se duplica nada a mano):
//   preview/marcas.html       → slug (data-brand), gama (data-gama), categorías (data-sub)
//   preview/marcas.html       → canal web (data-canal): "shopify" o "pdf"
//   public/assets/logos/      → logo de la marca (la extensión varía: .webp o .png)
//   public/assets/photos/brands/ → foto de los tiles (varía: .webp o .avif; tope 700 px)
//   public/assets/photos/brands/hero/ → foto grande del hero (tope 2000 px; si falta, usa la de tiles)
//   data/listas-precios.json  → qué listas de precios enseña cada marca
//
// Se corre a mano (`npm run marcas`) cuando cambian las marcas o sus archivos.
// A propósito NO está en `prebuild`: ese hook lo comparten otras sesiones.
//
// Idempotente: conserva los campos escritos a mano (`descripcion`) de la versión
// anterior. Sale con 1 si a una marca le falta nombre, canal o una categoría/gama
// conocida. Sin logo o sin foto solo avisa: la página cae a un hero oscuro con el
// nombre de la marca hasta que llegue el arte.

import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { nombreSeoMarca } from "./nombre-seo-marca.mjs";

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
  delta: "Delta", "poletti-sinks": "Poletti Sinks", eclipse: "Eclipse",
  "kele-master-sinks": "Kele Master Sinks", insinkerator: "InSinkErator",
  lynx: "Lynx", "sedona-by-lynx": "Sedona by Lynx", alfresco: "Alfresco",
  coyote: "Coyote", artisan: "Artisan", "alfa-forni": "Alfa Forni", blaze: "Blaze",
  "kamado-joe": "Kamado Joe", masterbuilt: "Masterbuilt", wppo: "WPPO",
  "mont-alpi": "Mont Alpi", "broil-king": "Broil King",
  "i-drain": "I-Drain", "mr-steam": "Mr. Steam", acros: "Acros", elkay: "Elkay",
  // Altas del 2026-09-21 (MARCAS_HOMEA_SEP26_DESCUENTOS.xlsx).
  kraus: "Kraus", faber: "Faber", easy: "Easy", iem: "IEM", commodore: "Commodore",
  nantucket: "Nantucket", fontana: "Fontana", foster: "Foster", josper: "Josper",
  vass: "Vass", hergom: "Hergom",
  valsir: "Valsir",
  // Saunas de Artexa (Carla, 2026-09-21): no venían en el Excel.
  jacuzzi: "Jacuzzi", clearlight: "Clearlight",
  // Solo PDF por decisión de Carla (2026-09-21): Onix se queda, Firplak se restaura.
  onix: "Onix", firplak: "Firplak",
  // Grupo 90, solo PDF (Carla, 2026-09-22).
  catalano: "Catalano", kaldewei: "Kaldewei", treesse: "Treesse", "sauna-estilo": "Sauna Estilo",
};

// Canal web de cada marca (data-canal del tile). Decisión de Carla, 2026-09-21:
//   shopify → catálogo, filtros y carrito en Shopify; la página lleva listado.
//   pdf     → sin catálogo en Shopify; la página enseña el PDF de la marca (SEO).
// Ver docs/MARCAS-CANAL-Y-DESCUENTOS.md.
const CANALES = ["shopify", "pdf"];

// data-sub del tile → a dónde manda esa categoría en el sitio.
const CATEGORIAS = {
  cocina: { nombre: "Cocina y Bar", ruta: "/productos/cocina-y-bar" },
  tarjas: { nombre: "Tarjas y Monomandos", ruta: "/productos/cocina-y-bar/tarjas-y-griferia" },
  trituradores: { nombre: "Trituradores", ruta: "/productos/cocina-y-bar/trituradores" },
  asadores: { nombre: "Asadores y Hornos", ruta: "/productos/exterior/asadores-y-hornos" },
  banos: { nombre: "Baños", ruta: "/productos/banos" },
  menores: { nombre: "Electrodomésticos menores", ruta: "/productos/electrodomesticos-menores" },
  lavanderia: { nombre: "Lavandería", ruta: "/productos/lavanderia" },
  vapor: { nombre: "Vapor y Sauna", ruta: "/productos/vapor-y-sauna" },
  wellness: { nombre: "Wellness", ruta: "/productos/wellness" },
  chimeneas: { nombre: "Chimeneas & Calentadores", ruta: "/productos/chimeneas-y-calentadores" },
  recubrimientos: { nombre: "Recubrimientos y Superficies", ruta: "/productos/recubrimientos-y-superficies" },
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
// Una lista cuya marca no tiene tile no tiene página; se sigue viendo en
// /marcas#listas-de-precios (hoy no queda ninguna así: 2026-09-21).
const LISTAS_A_TILE = {
  Kele: ["kele-master-sinks"],
  "Trade-Wind": ["tradewind"],
  "Frigidaire · Electrolux": ["frigidaire", "electrolux"],
};

const slugificar = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Busca <dir>/<nombre>.<ext> sin saber la extensión (varía marca por marca). */
function archivo(dir, nombre) {
  const encontrado = readdirSync(join(ROOT, "public", dir)).find((f) =>
    /\.(webp|avif|png|svg|jpg|jpeg)$/i.test(f) && f.replace(/\.[^.]+$/, "") === nombre
  );
  return encontrado ? `/${dir}/${encontrado}` : null;
}

// Las fotos (tile y hero) llevan nombre SEO: <slug>-<tipo>.webp, con el tipo del
// H1 de data/marcas-hero.json (scripts/nombre-seo-marca.mjs). Si no existe con
// ese nombre, se acepta <slug>.<ext> (foto recién agregada, aún sin renombrar).
const HEROS = JSON.parse(readFileSync(join(ROOT, "data", "marcas-hero.json"), "utf8"));
const fotoMarca = (dir, slug, nombre) =>
  archivo(dir, nombreSeoMarca(slug, nombre, HEROS[slug]?.titulo)) ?? archivo(dir, slug);

// ── 1. Marcas desde los tiles de preview/marcas.html ────────────────────────
const html = readFileSync(join(ROOT, "preview", "marcas.html"), "utf8");
// La etiqueta completa del tile; los atributos se leen aparte para no depender
// del orden en que estén escritos.
// Admite clases extra: los tiles sin logo llevan "brandtile no-logo".
const RE_TILE = /<a\s[^>]*class="brandtile(?: [^"]*)?"[^>]*>/g;
const atributo = (tag, nombre) => tag.match(new RegExp(`${nombre}="([^"]*)"`))?.[1] ?? "";

const errores = [];
const sinArte = [];
const marcas = [];
const vistos = new Set();

for (const [tag] of html.matchAll(RE_TILE)) {
  const slug = atributo(tag, "data-brand");
  const gama = atributo(tag, "data-gama");
  const sub = atributo(tag, "data-sub");
  const canal = atributo(tag, "data-canal");
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

  if (!CANALES.includes(canal)) {
    errores.push(`${slug}: data-canal "${canal}" no es ${CANALES.join(" ni ")} (preview/marcas.html)`);
  }

  const logo = archivo("assets/logos", slug);
  const foto = fotoMarca("assets/photos/brands", slug, nombre ?? slug);
  // Versión grande para el hero (hasta 2000 px). La de arriba se capa a 700 px
  // porque solo pinta tiles; estirada a sangre completa se veía pixeleada.
  const fotoHero = fotoMarca("assets/photos/brands/hero", slug, nombre ?? slug) ?? foto;
  // Logo del hero recortado a su contenido: algunos logos traen mucho margen
  // transparente y en el hero se veían chicos. Los tiles siguen con el original.
  const logoHero = archivo("assets/logos/hero", slug) ?? logo;
  if (!logo || !foto) sinArte.push(`${slug} (${[!logo && "logo", !foto && "foto"].filter(Boolean).join(" y ")})`);

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
    canal,
    logo,
    foto,
    fotoHero,
    logoHero,
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
  // Sin tile = sin página. Es lo esperado para las marcas de LISTAS_A_TILE de
  // arriba, pero se avisa por si alguna marca nueva se quedó sin conectar por un typo.
  if (!colocada) {
    console.warn(`  · "${entrada.marca}" tiene lista pero no tiene página (sin tile en marcas.html)`);
  }
}

if (sinArte.length) {
  console.warn(`  · ${sinArte.length} marcas sin arte (hero oscuro con el nombre): ${sinArte.join(", ")}`);
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
    "Marca nueva: agrega su tile en preview/marcas.html (con data-canal), su logo en public/assets/logos/, " +
    "su foto en public/assets/photos/brands/ y su nombre en NOMBRES del script; luego corre `npm run marcas`.",
  // A dónde manda cada categoría (el `categorias` de cada marca son claves de aquí).
  // Va en el JSON para que lib/marcas.ts no tenga que repetir la tabla.
  categorias: CATEGORIAS,
  gamas: GAMAS,
  marcas,
};

writeFileSync(SALIDA, `${JSON.stringify(salida, null, 2)}\n`);

const conLista = marcas.filter((m) => m.listas.length).length;
const enPdf = marcas.filter((m) => m.canal === "pdf").length;
console.log(
  `data/marcas.json · ${marcas.length} marcas (${marcas.length - enPdf} shopify · ${enPdf} pdf) · ${conLista} con lista de precios`
);
