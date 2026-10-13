// Marcas del sitio (/marcas/<slug>).
//
// Dos canales: las marcas "shopify" enseñan catálogo con filtros; las "pdf" solo
// su PDF (catálogo o lista), sin listado de Shopify. Ver `Marca.canal`.
//
// Fuente: data/marcas.json, que GENERA scripts/build-marcas.mjs (`npm run marcas`)
// desde preview/marcas.html, public/assets/ y data/listas-precios.json. Aquí solo
// se lee: no repetir tablas que ya vivan en el JSON.

import datos from "@/data/marcas.json";
import heros from "@/data/marcas-hero.json";
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
  /** Foto del hero: brands/hero/<slug>.webp (hasta 2000 px) o, si no hay, `foto`. */
  fotoHero: string | null;
  /** Logo del hero: logos/hero/<slug>.webp (recortado sin margen) o, si no hay, `logo`. */
  logoHero: string | null;
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
/** Contenido del hero de una marca (data/marcas-hero.json). */
export interface HeroMarca {
  /** Posicionamiento en 3 palabras con "·". Se pinta en mayúsculas por CSS. */
  eyebrow: string;
  /** H1 de la página. */
  titulo: string;
  descripcion: string;
  /** Botón principal. `url` = PDF oficial en Shopify Files; null mientras no se sube. */
  cta?: { texto: string; url: string | null };
  /** Ajustes de la foto del hero, solo cuando la marca los necesita. */
  imagen?: {
    /** El hero va en espejo por defecto; false lo deja al derecho (p. ej. si la foto trae texto). */
    espejo?: boolean;
    /** object-position de la foto. Por defecto "center 75%"; bajar el % enseña más la parte de arriba. */
    posicion?: string;
    /** Acercamiento (1 = sin zoom). Para mover una foto que ya llena el alto del hero. */
    zoom?: number;
    /** Punto fijo del acercamiento (transform-origin), p. ej. "center bottom" para subir la foto. */
    origen?: string;
  };
  /** Multiplicador del alto del logo (1 = normal). Para logos que se ven chicos por su forma. */
  logoEscala?: number;
}

const HEROS = heros as unknown as Record<string, HeroMarca | string>;

/**
 * Hero escrito para la marca, o undefined si todavía no tiene: en ese caso la
 * página enseña el hero de siempre (gama + nombre + frase automática).
 */
export function heroDeMarca(m: Marca): HeroMarca | undefined {
  const h = HEROS[m.slug];
  return typeof h === "object" ? h : undefined;
}

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
 * Filtros de respaldo de la marca, con la misma forma que los del PLP
 * (lib/filtrosPlp.ts). Solo se pintan cuando la marca aún NO tiene piezas
 * publicadas en Shopify: con catálogo vivo, el panel real lo genera
 * `panelFiltrosHtml` (lib/shopify/htmlCatalogo.ts) con los valores de `filtros.*`.
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

// Los productos de la marca viven en Shopify: `productosDeMarca(vendor)` en
// lib/shopify/catalogoVivo.ts (Storefront API, canal Headless). Aquí solo datos
// editoriales de data/marcas.json.
