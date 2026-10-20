// Tipos de la taxonomía de GUÍAS.
// Fuente de verdad: GUIAS/taxonomia-guias.json — NO duplicar datos aquí, solo su forma.

/** Nivel donde se anclan las guías de una macrocategoría. */
export type NivelGuias = "subcategoria1" | "macrocategoria";

// Los ARTÍCULOS de guía ya no viven en el JSON: salen del blog "Guías" de
// Shopify (tipo GuiaPublicada en lib/shopify/guias.ts).

/**
 * Subcategoría 2 = tipo de producto / leaf de filtro (en ramas de 3 niveles).
 */
/**
 * Grupo de una ficha: "tipo" (primer eje de la subcategoría), "instalacion" (cómo
 * se instala, cuando el primer eje es otro: Grifería, Purificadores) y "estilo"
 * (formato/configuración). La etiqueta visible sale de `etiquetasGrupos`.
 */
export type GrupoFicha = "tipo" | "instalacion" | "estilo";

/**
 * Ficha de tipo de producto — alimenta el patrón "Planos de cocina" (FilterShowcase):
 * tarjeta con diagrama técnico de línea + descripción concreta + specs al hover.
 * Patrón y checklist para nuevas categorías: docs/PATRON-FICHAS-TIPO.md
 */
export interface FichaFiltro {
  /** Fila donde vive la tarjeta ("Por instalación" / "Por configuración"). */
  grupo: GrupoFicha;
  /** Key del diagrama SVG en components/FiltroDiagrama.tsx (fallback: "generic"). */
  diagrama: string;
  /** Escena ilustrada de components/IlustracionTipo.tsx cuando no coincide con
   *  `diagrama` (p.ej. Congeladores "de-piso" → "cong-de-piso"). Con este campo la
   *  tarjeta usa la ilustración en cualquier grupo (Refrigeración, 2026-10-19). */
  ilustracion?: string;
  /** UNA oración concreta y útil: qué es + para quién (siempre visible). */
  descripcion: string;
  /** Puntos clave revelados al hover, separados por "·": "Gas o inducción · 220 V". */
  specs: string;
  /** Explicación técnica ampliada del modal (2–3 oraciones). */
  detalle?: string;
  /**
   * Página de catálogo con el filtro de esta ficha ya aplicado: `?f=` en las PLP de
   * tipo (Refrigeradores, Parrillas, Campanas) o `?tipo=…&filtro=<clave>:<valor>`
   * en la Subcategoría 1 (public/catalogo.js marca la casilla).
   */
  catalogo?: string;
}

/** Un filtro que subdivide una Subcategoría 2 (p.ej. "French Door" dentro de Refrigeradores). */
export interface FiltroProducto {
  nombre: string;
  /** Ruta de filtro PLP aplicada (aún no existe; ver lib/flags.ts). */
  filtro: string;
  /** Ficha de tipo (opcional). Con fichas → FilterShowcase; sin fichas → chips (FilterList). */
  ficha?: FichaFiltro;
}

/**
 * Si la Subcategoría 2 tiene `filtros` (varios), al hacer clic se abre su página de
 * filtros (`rutaFiltros`); si no, se va directo al filtro PLP de Shopify (`filtro`).
 */
export interface Subcategoria2 {
  nombre: string;
  slug: string;
  /** Ruta de filtro PLP del leaf (destino directo cuando NO hay varios filtros). */
  filtro: string;
  /**
   * Nombre del eje por grupo cuando difiere del default ("Tipo de instalación" /
   * "Diseño"). P.ej. Parrillas: estilo = "Tipo de funcionamiento". Debe nombrar
   * EXACTAMENTE igual que el filtro del PLP (tabla de filtros de Carla).
   */
  etiquetasGrupos?: Partial<Record<GrupoFicha, string>>;
  /** Página de filtros de este tipo de producto (cuando `filtros` tiene varios). */
  rutaFiltros?: string;
  /** Dónde se ven sus productos en la tienda (/productos/…?tipo=… o /marcas/<slug>
   *  si solo va en PDF): botón "Ver productos" y tarjeta de la portada. */
  tienda?: string;
  /** Filtros que subdividen este tipo de producto. */
  filtros?: FiltroProducto[];
  /** Tarjeta del índice de la Subcategoría 1 (portada de guías, Carla 2026-10-19):
   *  foto del tipo (la misma del slider de Productos) y una línea de resumen.
   *  Con todas las Subcategorías 2 con tarjeta, la página usa la portada nueva. */
  tarjeta?: {
    imagen: string;
    resumen: string;
    /** Foto de producto en ambiente (llena el cuadro); sin esto, packshot sobre greige. */
    ambiente?: boolean;
    /** object-position del recorte en ambiente (p.ej. "center 70%"). */
    pos?: string;
  };
}

/**
 * Subcategoría 1. En ramas de 3 niveles es una "categoría de guías" (esLeaf:false,
 * tiene rutaGuias y subcategorias2; sus guías vienen de Shopify). En ramas de 2 niveles es un leaf de
 * filtro (esLeaf:true, tiene filtro).
 */
export interface Subcategoria1 {
  nombre: string;
  slug: string;
  esLeaf: boolean;
  // — rama de 3 niveles (esLeaf:false) —
  rutaGuias?: string;
  subcategorias2?: Subcategoria2[];
  // — rama de 2 niveles (esLeaf:true) —
  filtro?: string;
  /** Igual que en Subcategoría 2 (leaves de las macros de 2 niveles). */
  tienda?: string;
  /** Tarjeta de la portada de guías de su macro (Electrodomésticos menores). */
  tarjeta?: Subcategoria2["tarjeta"];
}

export interface Macrocategoria {
  slug: string;
  nombre: string;
  ruta: string;
  /** Dónde se anclan sus guías de Shopify: en la macro o en cada Subcategoría 1. */
  nivelGuias: NivelGuias;
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
