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

type ListasFabricante = { accesorios: string[]; limpieza: string[]; combinables: string[] };
const FABRICANTE = sugerenciasFabricante as Record<string, ListasFabricante>;

/** Máximo de tarjetas en "Sugerencias de compra" (dos filas de la rejilla de 3). */
export const MAX_SUGERENCIAS = 6;

/** Colecciones de accesorios por subcategoría 1 (las que existen hoy en Shopify). */
const ACCESORIOS_POR_SUB1: Record<string, string[]> = {
  "/productos/cocina-y-bar/refrigeracion": ["accesorios-de-refrigeracion"],
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

/** Puntaje de un accesorio para un equipo (0 = no aplica). */
function puntaje(equipo: ProductoVivo, acc: ProductoVivo): number {
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
  if (/^Accesorios/i.test(equipo.tipo)) return []; // a un accesorio se le muestran similares
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
    if (/^Accesorios/i.test(c.tipo)) {
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
