// Tipos de la taxonomía de GUÍAS.
// Fuente de verdad: GUIAS/taxonomia-guias.json — NO duplicar datos aquí, solo su forma.

/** Nivel donde se anclan las guías de una macrocategoría. */
export type NivelGuias = "subcategoria1" | "macrocategoria";

/** Una sección dentro del cuerpo de una guía: enlaza a un filtro de producto (PLP). */
export interface SeccionGuia {
  titulo: string;
  /** Ruta de filtro PLP, p.ej. "/productos/refrigeradores/?caracteristica=panelable". Aún no existe (ver lib/flags.ts). */
  filtro: string;
}

/** Un artículo de guía. */
export interface Guia {
  titulo: string;
  /** slug de tipo de guía (debe existir en tiposDeGuia): "guia-de-compra", "top-picks", … */
  tipo: string;
  /** Ruta canónica completa de la guía, tal cual viene del JSON. */
  ruta: string;
  resumen: string;
  secciones: SeccionGuia[];
}

/**
 * Subcategoría 2 = tipo de producto / leaf de filtro (en ramas de 3 niveles).
 */
export interface Subcategoria2 {
  nombre: string;
  slug: string;
  /** Ruta de filtro PLP del leaf. */
  filtro: string;
}

/**
 * Subcategoría 1. En ramas de 3 niveles es una "categoría de guías" (esLeaf:false,
 * tiene rutaGuias, subcategorias2 y guias). En ramas de 2 niveles es un leaf de
 * filtro (esLeaf:true, tiene filtro).
 */
export interface Subcategoria1 {
  nombre: string;
  slug: string;
  esLeaf: boolean;
  // — rama de 3 niveles (esLeaf:false) —
  rutaGuias?: string;
  subcategorias2?: Subcategoria2[];
  guias?: Guia[];
  // — rama de 2 niveles (esLeaf:true) —
  filtro?: string;
}

export interface Macrocategoria {
  slug: string;
  nombre: string;
  ruta: string;
  nivelGuias: NivelGuias;
  /** Guías ancladas en la macro (solo cuando nivelGuias === "macrocategoria"). */
  guias: Guia[];
  subcategorias1: Subcategoria1[];
}

export interface TipoDeGuia {
  slug: string;
  nombre: string;
  funcion: string;
}

export interface TaxonomiaMeta {
  rutaHub: string;
  patronRutaMacro: string;
  patronRutaCategoriaGuias3Niveles: string;
  patronRutaGuia3Niveles: string;
  patronRutaGuia2Niveles: string;
  patronFiltroProducto: string;
  reglaNivelGuias: string;
  facetas: string[];
  gamas: string[];
  ctaPrimario: string;
  ctaSecundario: string;
  notaSEO: string;
}

export interface TaxonomiaGuias {
  version: string;
  fecha: string;
  meta: TaxonomiaMeta;
  tiposDeGuia: TipoDeGuia[];
  macrocategorias: Macrocategoria[];
}
