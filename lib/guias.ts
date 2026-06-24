// Loader + helpers de la taxonomía de GUÍAS.
// Lee la ÚNICA fuente de verdad: GUIAS/taxonomia-guias.json.
// No se hardcodea ninguna categoría/ruta aquí: todo se deriva del JSON.

import taxonomiaData from "@/GUIAS/taxonomia-guias.json";
import type {
  Guia,
  Macrocategoria,
  Subcategoria1,
  TaxonomiaGuias,
  TipoDeGuia,
} from "@/types/guias";

export const taxonomia = taxonomiaData as unknown as TaxonomiaGuias;

export const HUB_PATH = taxonomia.meta.rutaHub; // "/guias/"

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
  | { kind: "guia"; macro: Macrocategoria; sub1?: Subcategoria1; guia: Guia };

/** "/guias/cocina-y-bar/refrigeracion/" -> ["cocina-y-bar","refrigeracion"] */
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

  // Guías ancladas en la macro (ramas de 2 niveles).
  for (const guia of macro.guias ?? []) {
    register({ kind: "guia", macro, guia }, guia.ruta);
  }

  for (const sub1 of macro.subcategorias1 ?? []) {
    if (sub1.esLeaf) continue; // leaf de filtro de producto: no es página de guías

    // Índice de categoría de guías (ramas de 3 niveles).
    if (sub1.rutaGuias) register({ kind: "categoria", macro, sub1 }, sub1.rutaGuias);

    for (const guia of sub1.guias ?? []) {
      register({ kind: "guia", macro, sub1, guia }, guia.ruta);
    }
  }
}

/** Resuelve los segmentos de URL (después de /guias/) a un nodo de ruta. */
export function getRoute(segments: string[]): RouteNode | undefined {
  return routeIndex.get(segments.join("/"));
}

/** Todos los segmentos de ruta bajo /guias/ (para generateStaticParams del catch-all). */
export function allRouteSegments(): string[][] {
  return Array.from(routeIndex.keys()).map((k) => k.split("/"));
}

/** Todas las rutas absolutas bajo /guias/ (hub incluido) — para sitemap. */
export function allGuiasUrls(): string[] {
  const urls = [HUB_PATH];
  for (const segs of routeIndex.keys()) urls.push(`/guias/${segs}/`);
  return urls;
}

// ---------------------------------------------------------------------------
// Helpers de contenido.
// ---------------------------------------------------------------------------

/** Las guías que viven directamente bajo una macro o bajo una de sus Sub1. */
export function guiasDeMacro(macro: Macrocategoria): Guia[] {
  if (macro.nivelGuias === "macrocategoria") return macro.guias ?? [];
  return (macro.subcategorias1 ?? []).flatMap((s) => s.guias ?? []);
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

/** Guías destacadas / más leídas para el hub. Prioriza guías de compra y top-picks. */
export function guiasDestacadas(limit = 6): { macro: Macrocategoria; sub1?: Subcategoria1; guia: Guia }[] {
  const all: { macro: Macrocategoria; sub1?: Subcategoria1; guia: Guia }[] = [];
  for (const node of routeIndex.values()) {
    if (node.kind === "guia") all.push({ macro: node.macro, sub1: node.sub1, guia: node.guia });
  }
  const prioridad = (t: string) => (t === "guia-de-compra" ? 0 : t === "top-picks" ? 1 : 2);
  all.sort((a, b) => prioridad(a.guia.tipo) - prioridad(b.guia.tipo));
  return all.slice(0, limit);
}

/**
 * Filtro de producto "principal" de una guía — destino del CTA "Ver todos los productos".
 * Es el leaf base del dominio de la guía (sin faceta).
 */
export function filtroPrincipal(node: Extract<RouteNode, { kind: "guia" }>): string {
  if (node.sub1?.subcategorias2?.length) return node.sub1.subcategorias2[0].filtro;
  const leaf = leavesDeMacro(node.macro)[0];
  if (leaf?.filtro) return leaf.filtro;
  // Fallback: base del primer filtro de sección (sin query).
  const first = node.guia.secciones[0]?.filtro;
  return first ? first.split("?")[0] : "/productos/";
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

  // node.kind === "guia"
  if (node.sub1?.rutaGuias) {
    crumbs.push({ nombre: node.sub1.nombre, href: node.sub1.rutaGuias });
  }
  crumbs.push({ nombre: node.guia.titulo });
  return crumbs;
}
