// Loader + helpers de la taxonomía de GUÍAS.
// La ESTRUCTURA (macros, subcategorías, filtros, tipos de guía) sale de
// GUIAS/taxonomia-guias.json. Los ARTÍCULOS salen del blog "Guías" de Shopify
// (lib/shopify/guias.ts): se ubican por etiquetas y por eso las funciones que
// listan guías son async.

import { existsSync } from "fs";
import { join } from "path";

import taxonomiaData from "@/GUIAS/taxonomia-guias.json";
import { guiaPorRuta, guiasPublicadas, type GuiaPublicada } from "@/lib/shopify/guias";
import type {
  Macrocategoria,
  Subcategoria1,
  Subcategoria2,
  TaxonomiaGuias,
  TipoDeGuia,
} from "@/types/guias";

export const taxonomia = taxonomiaData as unknown as TaxonomiaGuias;

export const HUB_PATH = taxonomia.meta.rutaHub; // "/guias"

export function getMacros(): Macrocategoria[] {
  return taxonomia.macrocategorias;
}

export function getTiposDeGuia(): TipoDeGuia[] {
  return taxonomia.tiposDeGuia;
}

export function getTipo(slug: string): TipoDeGuia | undefined {
  return taxonomia.tiposDeGuia.find((t) => t.slug === slug);
}

export function nombreTipo(slug: string): string {
  return getTipo(slug)?.nombre ?? slug;
}

// ---------------------------------------------------------------------------
// Índice de rutas — discriminado por tipo de página.
// ---------------------------------------------------------------------------

export type RouteNode =
  | { kind: "macro"; macro: Macrocategoria }
  | { kind: "categoria"; macro: Macrocategoria; sub1: Subcategoria1 }
  | { kind: "filtros"; macro: Macrocategoria; sub1: Subcategoria1; sub2: Subcategoria2 }
  | { kind: "guia"; macro: Macrocategoria; sub1?: Subcategoria1; guia: GuiaPublicada };

export type { GuiaPublicada };

/** "/guias/cocina-y-bar/refrigeracion" -> ["cocina-y-bar","refrigeracion"] */
export function segmentsFromRuta(ruta: string): string[] {
  return ruta
    .replace(/^\/guias\/?/, "")
    .replace(/\/$/, "")
    .split("/")
    .filter(Boolean);
}

const routeIndex: Map<string, RouteNode> = new Map();

function register(node: RouteNode, ruta: string) {
  routeIndex.set(segmentsFromRuta(ruta).join("/"), node);
}

for (const macro of taxonomia.macrocategorias) {
  register({ kind: "macro", macro }, macro.ruta);

  for (const sub1 of macro.subcategorias1 ?? []) {
    if (sub1.esLeaf) continue; // leaf de filtro de producto: no es página de guías

    // Índice de categoría de guías (ramas de 3 niveles).
    if (sub1.rutaGuias) register({ kind: "categoria", macro, sub1 }, sub1.rutaGuias);

    // Página de filtros de una Subcategoría 2 (cuando tiene varios filtros).
    for (const sub2 of sub1.subcategorias2 ?? []) {
      if (sub2.rutaFiltros && (sub2.filtros?.length ?? 0) > 1) {
        register({ kind: "filtros", macro, sub1, sub2 }, sub2.rutaFiltros);
      }
    }
  }
}

/**
 * Resuelve los segmentos de URL (después de /guias/) a un índice o a una página
 * de filtros. Síncrono: no conoce los artículos (ver `resolverRuta`).
 */
export function getRoute(segments: string[]): RouteNode | undefined {
  return routeIndex.get(segments.join("/"));
}

/** Como `getRoute`, pero también encuentra los artículos publicados en Shopify. */
export async function resolverRuta(segments: string[]): Promise<RouteNode | undefined> {
  const fijo = getRoute(segments);
  if (fijo) return fijo;
  const guia = await guiaPorRuta(`/guias/${segments.join("/")}`);
  return guia ? { kind: "guia", macro: guia.macro, sub1: guia.sub1, guia } : undefined;
}

/** Segmentos de todas las rutas bajo /guias/, artículos incluidos (generateStaticParams). */
export async function allRouteSegments(): Promise<string[][]> {
  const fijas = Array.from(routeIndex.keys()).map((k) => k.split("/"));
  const articulos = (await guiasPublicadas()).map((g) => segmentsFromRuta(g.ruta));
  return [...fijas, ...articulos];
}

/** Todas las rutas absolutas bajo /guias/ (hub incluido) — para sitemap. */
export async function allGuiasUrls(): Promise<string[]> {
  const urls = [HUB_PATH];
  for (const segs of routeIndex.keys()) urls.push(`/guias/${segs}`);
  for (const g of await guiasPublicadas()) if (!g.borrador) urls.push(g.ruta);
  return urls;
}

// ---------------------------------------------------------------------------
// Helpers de contenido.
// ---------------------------------------------------------------------------

/** Las guías que viven bajo una macro (directo o en cualquiera de sus Sub1). */
export async function guiasDeMacro(macro: Macrocategoria): Promise<GuiaPublicada[]> {
  return (await guiasPublicadas()).filter((g) => g.macro.slug === macro.slug);
}

/** Las guías de una Subcategoría 1 de guías (Refrigeración, Cocción…). */
export async function guiasDeSub1(macro: Macrocategoria, sub1: Subcategoria1): Promise<GuiaPublicada[]> {
  return (await guiasPublicadas()).filter(
    (g) => g.macro.slug === macro.slug && g.sub1?.slug === sub1.slug,
  );
}

/** Subcategorías 1 que son categorías de guías (ramas de 3 niveles). */
export function categoriasDeGuias(macro: Macrocategoria): Subcategoria1[] {
  return (macro.subcategorias1 ?? []).filter((s) => !s.esLeaf);
}

/** Subcategorías 1 que son leaves de filtro (ramas de 2 niveles). */
export function leavesDeMacro(macro: Macrocategoria): Subcategoria1[] {
  return (macro.subcategorias1 ?? []).filter((s) => s.esLeaf);
}

/**
 * Todos los leaves de producto (con su filtro) de una macro, sin importar el nivel:
 * Subcategoría 2 en ramas de 3 niveles; Subcategoría 1 en ramas de 2 niveles.
 * Útil para el mega-menú de Productos.
 */
export function leafFiltros(macro: Macrocategoria): { nombre: string; filtro: string }[] {
  if (macro.nivelGuias === "macrocategoria") {
    return leavesDeMacro(macro)
      .filter((s) => s.filtro)
      .map((s) => ({ nombre: s.nombre, filtro: s.filtro as string }));
  }
  return categoriasDeGuias(macro).flatMap((sub1) =>
    (sub1.subcategorias2 ?? []).map((s2) => ({ nombre: s2.nombre, filtro: s2.filtro }))
  );
}

/** Todas las guías publicadas (planas, con su macro/sub1) — para búsqueda en el hub. */
export async function todasLasGuias(): Promise<GuiaPublicada[]> {
  return guiasPublicadas();
}

/** Guías destacadas / más leídas para el hub. Prioriza guías de compra y top-picks. */
export async function guiasDestacadas(limit = 6): Promise<GuiaPublicada[]> {
  const prioridad = (t: string) => (t === "guia-de-compra" ? 0 : t === "top-picks" ? 1 : 2);
  // sort es estable: dentro de cada tipo se conserva el orden de publicación.
  return [...(await guiasPublicadas())]
    .sort((a, b) => prioridad(a.tipo) - prioridad(b.tipo))
    .slice(0, limit);
}

/**
 * Catálogo vivo de la guía — destino de "Ver productos". La Subcategoría 1 si
 * tiene página propia en /productos (preview/subcategoria-<macro>--<sub1>.html);
 * si no, la macro.
 */
export function rutaProductos(macro: Macrocategoria, sub1?: Subcategoria1): string {
  if (sub1 && existsSync(join(process.cwd(), "preview", `subcategoria-${macro.slug}--${sub1.slug}.html`))) {
    return `/productos/${macro.slug}/${sub1.slug}`;
  }
  return `/productos/${macro.slug}`;
}

// ---------------------------------------------------------------------------
// Breadcrumbs.
// ---------------------------------------------------------------------------

export interface Crumb {
  nombre: string;
  href?: string; // sin href = posición actual
}

export function buildBreadcrumb(node: RouteNode): Crumb[] {
  const crumbs: Crumb[] = [
    { nombre: "Inicio", href: "/" },
    { nombre: "Guías", href: HUB_PATH },
  ];

  if (node.kind === "macro") {
    crumbs.push({ nombre: node.macro.nombre });
    return crumbs;
  }

  crumbs.push({ nombre: node.macro.nombre, href: node.macro.ruta });

  if (node.kind === "categoria") {
    crumbs.push({ nombre: node.sub1.nombre });
    return crumbs;
  }

  if (node.kind === "filtros") {
    crumbs.push({ nombre: node.sub1.nombre, href: node.sub1.rutaGuias });
    crumbs.push({ nombre: node.sub2.nombre });
    return crumbs;
  }

  // node.kind === "guia"
  if (node.sub1?.rutaGuias) {
    crumbs.push({ nombre: node.sub1.nombre, href: node.sub1.rutaGuias });
  }
  crumbs.push({ nombre: node.guia.titulo });
  return crumbs;
}
