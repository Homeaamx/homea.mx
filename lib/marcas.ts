// Marcas del sitio (/marcas/<slug>).
//
// Dos canales: las marcas "shopify" enseñan catálogo con filtros; las "pdf" solo
// su PDF (catálogo o lista), sin listado de Shopify. Ver `Marca.canal`.
//
// Fuente: data/marcas.json, que GENERA scripts/build-marcas.mjs (`npm run marcas`)
// desde preview/marcas.html, public/assets/ y data/listas-precios.json. Aquí solo
// se lee: no repetir tablas que ya vivan en el JSON.

import datos from "@/data/marcas.json";
import type { FiltroPlp } from "@/lib/filtrosPlp";
import { listaPorSlug, type ListaPrecios } from "@/lib/listasPrecios";

export interface Marca {
  slug: string;
  /** Grafía oficial de la marca ("Sub-Zero"), no la del tile ("SUBZERO"). */
  nombre: string;
  /** Claves de `gamas` (una marca puede abarcar dos rangos). */
  gama: string[];
  /** Claves de `categorias`. */
  categorias: string[];
  /**
   * Canal web (decisión de Carla, 2026-09-21 · docs/MARCAS-CANAL-Y-DESCUENTOS.md):
   * "shopify" → catálogo, filtros y carrito; "pdf" → solo su PDF, sin listado.
   */
  canal: "shopify" | "pdf";
  /** null mientras no llega el arte: la página cae a hero oscuro + nombre. */
  logo: string | null;
  foto: string | null;
  /** Slugs de documento de data/listas-precios.json. */
  listas: string[];
  /** Texto de posicionamiento, escrito a mano. Opcional. */
  descripcion?: string;
}

export interface CategoriaMarca {
  nombre: string;
  ruta: string;
}

const MARCAS = datos.marcas as Marca[];
const CATEGORIAS = datos.categorias as Record<string, CategoriaMarca>;
const GAMAS = datos.gamas as Record<string, string>;

/** Todas las marcas con página, ordenadas por nombre. */
export function todasLasMarcas(): Marca[] {
  return MARCAS;
}

export function marcaPorSlug(slug: string): Marca | undefined {
  return MARCAS.find((m) => m.slug === slug);
}

/** URL permanente de la marca en el sitio. */
export const rutaMarca = (m: Pick<Marca, "slug">) => `/marcas/${m.slug}`;

/** Las categorías de la marca, resueltas a nombre + ruta. */
export function categoriasDeMarca(m: Marca): CategoriaMarca[] {
  return m.categorias.map((c) => CATEGORIAS[c]).filter(Boolean);
}

/** "Premium · Residencial" — el rango de la marca, para el eyebrow del hero. */
export function gamaDeMarca(m: Marca): string {
  return m.gama.map((g) => GAMAS[g] ?? g).join(" · ");
}

/** Las listas de precios que enseña la marca (sin las que ya no existen). */
export function listasDeMarca(m: Marca): ListaPrecios[] {
  return m.listas.map((slug) => listaPorSlug(slug)).filter((d): d is ListaPrecios => Boolean(d));
}

/**
 * Filtros de la marca, con la misma forma que los del PLP (lib/filtrosPlp.ts).
 *
 * Igual que allá, hoy son maqueta: el catálogo todavía no está cargado, así que
 * ninguna casilla filtra nada. Se dejan puestos para que la página quede armada
 * y solo haya que conectarlos cuando exista el catálogo.
 */
export function filtrosDeMarca(m: Marca): FiltroPlp[] {
  const categorias = categoriasDeMarca(m).map((c) => c.nombre);
  return [
    ...(categorias.length > 1
      ? [{ nombre: "Categoría", control: "multi" as const, valores: categorias }]
      : []),
    { nombre: "Precio", control: "slider" as const },
    {
      nombre: "Gama",
      control: "multi" as const,
      valores: Object.values(GAMAS),
    },
    {
      nombre: "Instalación",
      control: "multi" as const,
      nota: "Depende del producto — sale de los metafields de Shopify",
    },
    {
      nombre: "Disponibilidad",
      control: "multi" as const,
      valores: ["En existencia", "Bajo pedido", "Bajo cotización"],
    },
  ];
}

/**
 * Productos de la marca.
 *
 * ⚠️ ES EL ÚNICO PUNTO QUE HAY QUE CAMBIAR cuando exista el catálogo: en cuanto
 * esta función devuelva productos, las páginas de marca "shopify" se llenan solas
 * (las "pdf" no enseñan catálogo).
 *
 * Hoy devuelve [] a propósito. El catálogo todavía no está migrado: la tienda de
 * Shopify sigue con contraseña (lib/flags.ts → PLP_READY) y data/catalogo-index.json
 * solo trae el piloto. Mientras tanto la página enseña la misma maqueta que el
 * PLP de /productos, con salida a WhatsApp.
 */
export function productosDeMarca(_slug: string): never[] {
  return [];
}
