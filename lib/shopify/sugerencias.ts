// Sugerencias de compra para la ficha de producto (regla de Carla, 2026-10-08).
//
// "Productos relacionados" muestra primero lo que conviene comprar CON el equipo:
// paneles y manijas para refrigeración, campanas para cocción, filtros de carbón
// para campanas, kits de conversión de gas, kits de limpieza… Si no hay ninguna
// sugerencia publicada, la ficha cae a productos similares del mismo tipo.
//
// Dos fuentes, en este orden:
//   1. El catálogo del fabricante: data/sugerencias-compra.json, que genera
//      scripts/sugerencias-compra.mjs (accesorios, limpieza y combinables que
//      Gaggenau lista para cada modelo). Solo cuentan los que tenemos publicados.
//   2. Reglas por familia de modelo, medida, línea y tipo, leídas del título y
//      del filtro "compatible" de cada accesorio ("Paneles … para RVY 497",
//      "Panel … 24\"", "Kit … para Cava 18\"", "Cavas RVW"…).
//
// Para una marca o familia nueva: sumar su fuente al script del punto 1 o una
// regla en REGLAS_CRUZADAS / candidatosDe().

import sugerenciasFabricante from "@/data/sugerencias-compra.json";

import type { ProductoVivo } from "./catalogoVivo";
import { esAccesorio } from "./coleccionesWeb";

type ListasFabricante = { accesorios: string[]; limpieza: string[]; combinables: string[] };
const FABRICANTE = sugerenciasFabricante as Record<string, ListasFabricante>;

/** Máximo de tarjetas en "Sugerencias de compra" (dos filas de la rejilla de 3). */
export const MAX_SUGERENCIAS = 6;

/** Colecciones de accesorios por subcategoría 1 (las que existen hoy en Shopify). */
const ACCESORIOS_POR_SUB1: Record<string, string[]> = {
  "/productos/cocina-y-bar/refrigeracion": ["accesorios-de-refrigeracion"],
  "/productos/cocina-y-bar/coccion": ["accesorios-de-coccion"],
};

/** Equipos que se sugieren entre tipos distintos (cocción → campana, etc.). */
const REGLAS_CRUZADAS: { de: RegExp; sugerir: string[] }[] = [
  { de: /^(Parrillas|Estufas|Rangetops|Hornos|Cocinetas)$/i, sugerir: ["campanas"] },
];

/** Colecciones donde buscar sugerencias para un producto. */
export function coleccionesCandidatas(rutaSub1: string | null, tipo: string): string[] {
  const set = new Set<string>(rutaSub1 ? (ACCESORIOS_POR_SUB1[rutaSub1] ?? []) : []);
  for (const r of REGLAS_CRUZADAS) if (r.de.test(tipo)) r.sugerir.forEach((c) => set.add(c));
  return [...set];
}

const quitarAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const norm = (s: string) => quitarAcentos(s).toLowerCase().replace(/[”″]/g, '"');

/** Ancho en pulgadas del título ('… 24"' → 24; 35.5 cuenta como 36). */
function ancho(texto: string): number | null {
  const m = norm(texto).match(/(\d{2}(?:\.\d)?)\s*"/);
  if (!m) return null;
  const n = Number(m[1]);
  return Math.abs(n - 35.5) < 0.01 ? 36 : n;
}

/** Tipo de equipo que menciona un texto. */
function clase(texto: string): "cava" | "congelador" | "refrigerador" | "columna" | null {
  const t = norm(texto);
  if (/\bcavas?\b|\bvino/.test(t)) return "cava";
  if (/congelador/.test(t)) return "congelador";
  if (/refrigerador\b/.test(t)) return "refrigerador";
  if (/columna/.test(t)) return "columna";
  return null;
}

/** Familia del modelo: RVY497790 → { letras: "RVY", num: "497" }. */
function familia(sku: string): { letras: string; num: string } | null {
  const m = sku.toUpperCase().match(/^([A-Z]{2,3})(\d{3})/);
  return m ? { letras: m[1], num: m[2] } : null;
}

const esExpressive = (p: ProductoVivo) => /expressive/i.test(p.titulo) || /^RV[A-Z]/.test(p.sku);

/** Tipo de accesorio de cocción (filtros.tipo) → tipos de equipo que lo usan. */
const DESTINO_COCCION: Record<string, string[]> = {
  "Accesorio de horno": ["Hornos", "Microondas"],
  "Accesorio de parrilla": ["Parrillas"],
  "Ducto o conexión de campana": ["Campanas"],
  "Motor de campana": ["Campanas"],
  "Montaje de campana": ["Campanas"],
};

/** Familias de equipo de cocción que puede mencionar un accesorio ("para AL 400 y VL 414", "AI/AW 442", "Hornos GO"). */
const FAMILIAS_COCCION = "AL|VL|AI|AW|AF|GO|GS|GM|BO|BX|BS|BM|EB|VI|VG|VR|VP|CX|CI|CG|CM|GC|WS|GW|DV|GV";

/**
 * Puntaje de un accesorio de cocción (Carla, 2026-10-09): solo para el tipo de
 * equipo que lo usa; si menciona familias de modelo, solo para esas; la medida
 * debe coincidir. Los ductos genéricos (sin familia) no se sugieren: dependen de
 * la instalación.
 */
function puntajeCoccion(equipo: ProductoVivo, acc: ProductoVivo): number {
  const tipoAcc = acc.filtros.tipo?.[0] ?? "";
  const texto = norm(acc.titulo);
  let destinos = DESTINO_COCCION[tipoAcc];
  if (!destinos) {
    // Filtros, cartuchos y kits: el destino lo dice el título.
    if (/campana|recirculacion|extractor/.test(texto)) destinos = ["Campanas"];
    else if (/cafetera/.test(texto)) destinos = ["Cafeteras"];
    else if (/horno|combi-vapor/.test(texto)) destinos = ["Hornos", "Microondas"];
    else if (/vario|parrilla|conexion/.test(texto)) destinos = ["Parrillas"];
    else return 0;
  }
  if (!destinos.includes(equipo.tipo)) return 0;
  if (/retractil/.test(texto) && !(equipo.filtros.diseno ?? []).includes("Retráctiles")) return 0;

  const fam = familia(equipo.sku);
  const menciones = [...acc.titulo.toUpperCase().replace(/\//g, " ").matchAll(new RegExp(`\\b(${FAMILIAS_COCCION})(?:\\s?(\\d{2,3}))?\\b`, "g"))];
  let pts = 10;
  if (menciones.length) {
    const propia = fam && menciones.some(([, l, n]) => l === fam.letras && (!n || fam.num.startsWith(n)));
    if (!propia) return 0;
    pts = menciones.some(([, , n]) => n) ? 100 : 60;
  } else if (tipoAcc === "Ducto o conexión de campana") {
    return 0;
  }
  const aAcc = ancho(acc.titulo);
  const aEq = ancho(equipo.titulo);
  if (aAcc && aEq) {
    if (aAcc !== aEq) return 0;
    pts += 30;
  }
  return pts;
}

/**
 * Accesorio que vive en la colección del propio equipo (Lavavajillas, Carla
 * 2026-10-09): si menciona modelos ("DF 211", "DF 481 / DF 481 F"), solo para
 * esos; si no, sirve a todos los de su tipo.
 */
function puntajeMismaColeccion(equipo: ProductoVivo, acc: ProductoVivo): number {
  const fam = familia(equipo.sku);
  const menciones = [...acc.titulo.toUpperCase().matchAll(/\b([A-Z]{2})\s?(\d{3})\b/g)];
  if (!menciones.length) return 20;
  return fam && menciones.some(([, l, n]) => l === fam.letras && n === fam.num) ? 100 : 0;
}

/** Puntaje de un accesorio para un equipo (0 = no aplica). */
function puntaje(equipo: ProductoVivo, acc: ProductoVivo): number {
  if (acc.tipo === "Accesorios de cocción") return puntajeCoccion(equipo, acc);
  if (acc.tipo === equipo.tipo) return puntajeMismaColeccion(equipo, acc);
  const texto = `${acc.titulo} ${(acc.filtros.compatible ?? []).join(" ")}`;
  const t = norm(texto).toUpperCase();
  const fam = familia(equipo.sku);
  let pts = 0;

  // Familias que menciona el accesorio: "para RVY 497", "Cava RW 404", "RW 46"
  // (familia corta) o solo la línea: "Cavas RVW", "para RF", "RB/RY".
  const LINEAS = "RVW|RVF|RVC|RVB|RVY|RW|RF|RC|RB|RY";
  const conNumero = [...t.matchAll(new RegExp(`\\b(${LINEAS})\\s?(\\d{2,3})\\b`, "g"))];
  const soloLinea = [...t.replace(/\//g, " ").matchAll(new RegExp(`\\b(${LINEAS})\\b(?!\\s?\\d)`, "g"))].map((m) => m[1]);
  if (conNumero.length) {
    const propia = fam && conNumero.some(([, l, n]) => l === fam.letras && fam.num.startsWith(n));
    if (!propia) return 0; // es de otro modelo
    pts += 100;
  } else if (soloLinea.length) {
    if (!fam || !soloLinea.includes(fam.letras)) return 0; // es de otra línea
    pts += 40;
  }

  // Línea: los accesorios oscuros (RVA…, "Oscuro", "Serie Expressive") son de la
  // serie Expressive; los RA… de acero claro, de las líneas anteriores.
  const accExpressive = /^RVA/.test(acc.sku) || /oscuro|expressive/i.test(texto);
  if (accExpressive !== esExpressive(equipo) && pts < 100) return 0;

  // Tipo de equipo: un accesorio para cavas no va con un congelador.
  const cEq = clase(`${equipo.tipo} ${equipo.titulo}`);
  const cAcc = clase(texto);
  if (cAcc && cEq && pts < 100) {
    const columnaOk = cAcc === "columna" && /columna/i.test(equipo.titulo);
    if (cAcc !== cEq && !columnaOk) return 0;
    pts += 20;
  }

  // Paneles, zoclos y rejillas sin modelo ni tipo: son para columnas de
  // refrigeración/congelación de esa medida (las cavas y los bottom mount
  // llevan los suyos, que dicen "para Cava…" o "para RVB 497").
  if (pts < 40 && !cAcc && /panel|zoclo|rejilla|marco|cambio de sentido/i.test(norm(texto))) {
    if (cEq === "cava" || !/columna/i.test(equipo.titulo)) return 0;
  }

  // "… para Panel de Cava": solo para equipos listos para panel.
  if (/para panel/i.test(norm(texto)) && !/panelable/i.test(equipo.titulo)) return 0;
  // Lo mismo con paneles y marcos de puerta en cavas: la cava con puerta de
  // cristal propia (no panelable) no los lleva.
  if (cEq === "cava" && /panel(es)? de puerta|^paneles|marco/i.test(norm(acc.titulo)) && !/panelable/i.test(equipo.titulo) && pts < 100) return 0;

  // Medida: si el accesorio dice medida, debe coincidir.
  const aAcc = ancho(texto);
  const aEq = ancho(equipo.titulo);
  if (aAcc && aEq && pts < 100) {
    if (aAcc !== aEq && !/\by\b/i.test(norm(texto))) return 0; // "Cavas 18\" y 24\"" vale para ambas
    pts += 30;
  }

  // Columnas: kits de conexión lado a lado y embellecedores.
  if (/columna/i.test(equipo.titulo) && /columnas/i.test(texto)) pts += 25;
  // Genéricos de refrigeración ("Contenedor … para Refrigeración"): poco peso.
  if (pts === 0 && /refrigeracion/i.test(norm(texto)) && /refrig|congel|columna/i.test(equipo.tipo + equipo.titulo)) pts = 5;

  return pts;
}

/**
 * Sugerencias de compra para `equipo` entre `candidatos` (accesorios y equipos
 * de colecciones relacionadas). Devuelve [] si no hay ninguna.
 */
export function sugerenciasDeCompra(equipo: ProductoVivo, candidatos: ProductoVivo[]): ProductoVivo[] {
  if (esAccesorio(equipo)) return []; // a un accesorio se le muestran similares
  const porSku = new Map(candidatos.map((c) => [c.sku, c]));
  const elegidos = new Map<string, number>();

  // 1. Catálogo del fabricante.
  const lista = FABRICANTE[equipo.sku];
  if (lista) {
    for (const sku of [...lista.accesorios, ...lista.limpieza, ...lista.combinables]) {
      if (porSku.has(sku) && sku !== equipo.sku) elegidos.set(sku, 1000);
    }
  }

  // 2. Reglas por familia, medida, línea y tipo.
  for (const c of candidatos) {
    if (c.sku === equipo.sku || c.marca !== equipo.marca) continue;
    let pts: number;
    if (esAccesorio(c)) {
      pts = puntaje(equipo, c);
    } else {
      // Equipo cruzado (campana para una parrilla): que cubra el ancho del equipo.
      const aEq = ancho(equipo.titulo);
      const aC = ancho(c.titulo);
      pts = !aEq || !aC || aC >= aEq ? 60 : 0;
    }
    if (pts > 0) elegidos.set(c.sku, Math.max(elegidos.get(c.sku) ?? 0, pts));
  }

  return [...elegidos.entries()]
    .map(([sku, pts]) => ({ p: porSku.get(sku)!, pts }))
    // Más relevantes primero; con foto antes que sin foto.
    .sort((a, b) => b.pts - a.pts || Number(b.p.imagenes.length > 0) - Number(a.p.imagenes.length > 0))
    .slice(0, MAX_SUGERENCIAS)
    .map((x) => x.p);
}
