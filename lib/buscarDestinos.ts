// buscarDestinos.ts — lo que el buscador de la lupa encuentra además de los
// productos publicados (Carla, 2026-10-21): categorías y tipos de la tienda,
// marcas (también las que solo tienen catálogo en PDF) y tipos de las fichas
// de Guías. Así una búsqueda siempre lleva a algún lado aunque la pieza aún no
// esté en Shopify ("alberca", "bosch", "jacuzzi").
//
// La tienda manda (Carla, 2026-10-21): cada categoría lleva a su página de la
// tienda —la suya, la de su macro o la de sus tipos— y Guías solo aparece cuando
// nada de la tienda responde ("alberca" → /productos/exterior, no a Guías).
//
// También define `coincide`: la regla para decidir si un texto responde de
// verdad a lo tecleado. Shopify a veces devuelve parecidos sin relación
// ("maytag" → 29 Gaggenau); con esta regla esos se descartan y, si no queda
// nada, el buscador dice "No se encontraron resultados de búsqueda".

import "server-only";

import taxonomiaData from "@/GUIAS/taxonomia-guias.json";
import { todasLasMarcas, rutaMarca } from "@/lib/marcas";
import { categoriaSlugs, subcategoriaParams } from "@/lib/preview";
import { TIPOS_WEB } from "@/lib/shopify/coleccionesWeb";
import type { TaxonomiaGuias } from "@/types/guias";

const taxonomia = taxonomiaData as unknown as TaxonomiaGuias;

export interface Destino {
  /** Qué es: "Categoría", "Marca", "Tipo"… (se pinta como etiqueta). */
  clase: string;
  titulo: string;
  /** Contexto: dónde vive ("Cocina y Bar · Refrigeración") o "Catálogo en PDF". */
  detalle: string;
  href: string;
  /** Foto o logo de la tarjeta del buscador (lib/imagenDestino.ts); null si no hay. */
  imagen?: string | null;
}

/* ---------- Coincidencia -------------------------------------------------- */

const STOPWORDS = new Set(["de", "del", "con", "y", "o", "a", "en", "para", "la", "el", "los", "las", "por", "sin", "un", "una"]);

/** Minúsculas, sin acentos y "&" → "y". */
export function plano(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ");
}

/** Palabras con sentido de la consulta (sin preposiciones ni letras sueltas). */
export function palabrasDe(consulta: string): string[] {
  return plano(consulta)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 2 && !STOPWORDS.has(p));
}

/** Cómo le dice la gente vs. cómo se llama en el sitio ("grifo" → Grifería). */
const SINONIMOS: Record<string, string> = {
  grifo: "griferia",
  grifos: "griferia",
  llave: "griferia",
  llaves: "griferia",
  fregadero: "tarja",
  fregaderos: "tarja",
  lavaplatos: "lavavajillas",
  lavaloza: "lavavajillas",
  nevera: "refrigerador",
  refri: "refrigerador",
  extractor: "campana",
  extractora: "campana",
  boiler: "calentador",
  clima: "minisplit",
  aire: "minisplit",
  hornilla: "parrilla",
  cooktop: "parrilla",
  asadero: "asador",
};

/** Las mismas palabras con su nombre del sitio, o null si ninguna cambia. */
export function conSinonimos(tokens: string[]): string[] | null {
  const otras = tokens.map((t) => SINONIMOS[t] ?? t);
  return otras.some((t, i) => t !== tokens[i]) ? otras : null;
}

/** Distancia de edición (para errores de dedo: "refrijerador"). */
function distancia(a: string, b: string): number {
  const fila = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let previo = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const guardado = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, previo + (a[i - 1] === b[j - 1] ? 0 : 1));
      previo = guardado;
    }
  }
  return fila[b.length];
}

/**
 * ¿La palabra tecleada responde a alguna palabra del texto? Por inicio
 * ("refri" → refrigerador), por raíz ("refrigeradores" → refrigeración), por
 * modelo dentro de un SKU ("250612" → BOP250612) o con un error de dedo en
 * palabras largas ("lavavajilas").
 */
function empata(token: string, palabras: string[]): boolean {
  // Sin plural ("refrigeradores" → "refrigerador") antes de recortar la raíz.
  const singular = token.length >= 6 ? token.replace(/(es|s)$/, "") : token;
  const raiz = singular.length >= 5 ? singular.slice(0, Math.max(5, Math.ceil(singular.length * 0.65))) : token;
  return palabras.some(
    (w) =>
      w.startsWith(raiz) ||
      (token.length >= 4 && /\d/.test(token) && w.includes(token)) ||
      (token.length >= 6 && w.length >= token.length - 1 && distancia(token, w.slice(0, token.length)) <= 1),
  );
}

/** ¿El texto responde a TODAS las palabras de la consulta (o a alguna, si `alguna`)? */
export function coincide(tokens: string[], texto: string, alguna = false): boolean {
  if (!tokens.length) return false;
  const palabras = plano(texto).split(/[^a-z0-9]+/).filter(Boolean);
  return alguna ? tokens.some((t) => empata(t, palabras)) : tokens.every((t) => empata(t, palabras));
}

/* ---------- Destinos ------------------------------------------------------ */

let cache: { destino: Destino; texto: string; peso: number }[] | null = null;

/** Todos los destinos buscables, con el texto contra el que se comparan. */
function destinos() {
  if (cache) return cache;
  const lista: { destino: Destino; texto: string; peso: number }[] = [];
  const vistos = new Set<string>();
  const sumar = (destino: Destino, texto: string, peso: number) => {
    const clave = `${plano(destino.titulo)}|${destino.href}`;
    if (vistos.has(clave)) return;
    vistos.add(clave);
    lista.push({ destino, texto, peso });
  };

  const cats = new Set(categoriaSlugs());
  const subs = new Set(subcategoriaParams().map((p) => `${p.categoria}/${p.subcategoria}`));

  for (const macro of taxonomia.macrocategorias) {
    const rutaMacro = cats.has(macro.slug) ? `/productos/${macro.slug}` : macro.ruta;
    sumar({ clase: "Categoría", titulo: macro.nombre, detalle: "Ver la categoría en la tienda", href: rutaMacro }, macro.nombre, 1);
    for (const s1 of macro.subcategorias1 ?? []) {
      const tw = TIPOS_WEB.find((t) => t.slugRiel === s1.slug);
      // Sin página propia en la tienda (Alberca): la de su macro, donde vive su
      // tarjeta; después la de sus tipos; Guías solo si no hay tienda.
      const href =
        tw?.ruta ??
        (subs.has(`${macro.slug}/${s1.slug}`) ? `/productos/${macro.slug}/${s1.slug}` : null) ??
        s1.tienda ??
        (cats.has(macro.slug) ? rutaMacro : null) ??
        s1.subcategorias2?.find((s2) => s2.tienda)?.tienda ??
        s1.rutaGuias ??
        rutaMacro;
      sumar({ clase: "Categoría", titulo: s1.nombre, detalle: macro.nombre, href }, s1.nombre, 1);
      for (const s2 of s1.subcategorias2 ?? []) {
        const href2 = s2.tienda ?? s2.rutaFiltros ?? href;
        sumar({ clase: "Tipo", titulo: s2.nombre, detalle: `${macro.nombre} · ${s1.nombre}`, href: href2 }, s2.nombre, 2);
        // Tipos de las fichas de Guías ("French Door", "Ósmosis inversa"):
        // llevan al catálogo ya filtrado.
        for (const f of s2.filtros ?? []) {
          if (!f.ficha?.catalogo) continue;
          sumar(
            { clase: "Tipo", titulo: `${s2.nombre} · ${f.nombre}`, detalle: `${macro.nombre} · ${s1.nombre}`, href: f.ficha.catalogo },
            `${s2.nombre} ${f.nombre}`,
            3,
          );
        }
      }
    }
  }
  // Tipos de producto de Shopify y sus tiles (Lavavajillas empotrable, Filtros y repuestos…).
  for (const t of TIPOS_WEB) {
    const detalle = `${t.macro.nombre} · ${t.sub1.nombre}`;
    sumar({ clase: "Tipo", titulo: t.nombreRiel ?? t.tipo, detalle, href: t.ruta }, `${t.tipo} ${t.nombreRiel ?? ""}`, 2);
    for (const v of Object.values(t.porInstalacion ?? {})) {
      sumar({ clase: "Tipo", titulo: v.nombre, detalle, href: `${t.sub1.ruta}?tipo=${v.slug}` }, v.nombre, 2);
    }
    if (t.accesorios) {
      // "Accesorios" a secas no dice de qué: "Accesorios de lavavajillas".
      const titulo = / de /i.test(t.accesorios.nombre) ? t.accesorios.nombre : `${t.accesorios.nombre} de ${t.tipo.toLowerCase()}`;
      sumar(
        { clase: "Tipo", titulo, detalle, href: `${t.sub1.ruta}?tipo=${t.accesorios.slug}` },
        `${t.accesorios.nombre} accesorios ${t.tipo}`,
        2,
      );
    }
  }
  // Marcas: las de PDF enseñan su catálogo en su página.
  for (const m of todasLasMarcas()) {
    sumar(
      { clase: "Marca", titulo: m.nombre, detalle: m.canal === "pdf" ? "Catálogo en PDF" : "Ver la marca", href: rutaMarca(m) },
      m.nombre,
      0,
    );
  }
  cache = lista;
  return lista;
}

const MAX_DESTINOS = 6;

/** ¿El destino es una página de Guías (no de la tienda)? */
export const esDeGuias = (d: Destino) => d.href.startsWith("/guias");

/**
 * Destinos que responden a la consulta: primero los que empatan TODAS las
 * palabras; si ninguno, los que empatan alguna (lo más parecido que hay).
 * Orden: marca exacta, luego por inicio del título y por clase. Si alguno es
 * de la tienda, los de Guías se quitan.
 */
export function buscarDestinos(consulta: string): Destino[] {
  const tokens = palabrasDe(consulta);
  if (!tokens.length) return [];
  const todos = destinos();
  let hallados = todos.filter((d) => coincide(tokens, d.texto));
  const sinonimos = conSinonimos(tokens);
  if (!hallados.length && sinonimos) hallados = todos.filter((d) => coincide(sinonimos, d.texto));
  if (!hallados.length) hallados = todos.filter((d) => coincide(sinonimos ?? tokens, d.texto, true));
  if (hallados.some((d) => !esDeGuias(d.destino))) hallados = hallados.filter((d) => !esDeGuias(d.destino));
  const q = plano(consulta.trim());
  return hallados
    .map((d, i) => {
      const t = plano(d.destino.titulo);
      const nivel = t === q ? 0 : t.startsWith(q) ? 1 : 2;
      return { d, i, nivel };
    })
    .sort((a, b) => a.nivel - b.nivel || a.d.peso - b.d.peso || a.i - b.i)
    .slice(0, MAX_DESTINOS)
    .map((x) => x.d.destino);
}
