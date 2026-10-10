// coleccionesWeb.ts — qué colección de Shopify alimenta cada página del sitio.
//
// La llave es el Tipo de producto de Shopify (= Subcategoría 2). Cada tipo tiene
// una colección automática con la regla "Tipo = <tipo>" (creadas el 2026-10-06).
// Se listan los tipos con colección publicada en el canal Headless (tengan o no
// piezas todavía); las páginas sin ningún producto siguen con su contenido estático.

export interface TipoWeb {
  /** Nombre exacto del Tipo de producto en Shopify. */
  tipo: string;
  /** Handle de la colección automática. */
  coleccion: string;
  /** Slug del tile en el riel de la Subcategoría 1 (`?tipo=`). */
  slugRiel: string;
  /** Página donde se ve ese tipo. */
  ruta: string;
  macro: { nombre: string; ruta: string };
  sub1: { nombre: string; ruta: string };
  /** Tipo de instalación (`filtros.instalacion`) → otro tile del riel (Lavavajillas: empotrable / de piso). */
  porInstalacion?: Record<string, string>;
  /**
   * Accesorios que viven en la MISMA colección que el equipo (sin subcategoría
   * propia, Carla 2026-10-09): se marcan con `filtros.tipo` = "Accesorio de …" y
   * en la web salen como esta opción de "Tipo de producto".
   */
  accesorios?: { slug: string; nombre: string };
}

const COCINA = { nombre: "Cocina y Bar", ruta: "/productos/cocina-y-bar" };
const REFRI = { nombre: "Refrigeración", ruta: "/productos/cocina-y-bar/refrigeracion" };
const COCCION = { nombre: "Cocción", ruta: "/productos/cocina-y-bar/coccion" };
const LAVA = { nombre: "Lavavajillas", ruta: "/productos/cocina-y-bar/lavavajillas" };

export const TIPOS_WEB: TipoWeb[] = [
  { tipo: "Refrigeradores", coleccion: "refrigeradores", slugRiel: "refrigeradores", ruta: `${REFRI.ruta}/refrigeradores`, macro: COCINA, sub1: REFRI },
  { tipo: "Congeladores", coleccion: "congeladores", slugRiel: "congeladores", ruta: `${REFRI.ruta}?tipo=congeladores`, macro: COCINA, sub1: REFRI },
  { tipo: "Cavas de vino", coleccion: "cavas-de-vino", slugRiel: "cavas-de-vino", ruta: `${REFRI.ruta}?tipo=cavas-de-vino`, macro: COCINA, sub1: REFRI },
  // Colecciones creadas y publicadas al canal Headless el 2026-10-07 (aún sin piezas).
  { tipo: "Centros de bebida", coleccion: "centros-de-bebida", slugRiel: "centros-de-bebida", ruta: `${REFRI.ruta}?tipo=centros-de-bebida`, macro: COCINA, sub1: REFRI },
  { tipo: "Frigobares", coleccion: "frigobares", slugRiel: "frigobares", ruta: `${REFRI.ruta}?tipo=frigobares`, macro: COCINA, sub1: REFRI },
  { tipo: "Máquinas de hielo", coleccion: "maquinas-de-hielo", slugRiel: "maquinas-de-hielo", ruta: `${REFRI.ruta}?tipo=maquinas-de-hielo`, macro: COCINA, sub1: REFRI },
  { tipo: "Cajones refrigerantes", coleccion: "cajones-refrigerantes", slugRiel: "cajones-refrigerantes", ruta: `${REFRI.ruta}?tipo=cajones-refrigerantes`, macro: COCINA, sub1: REFRI },
  { tipo: "Accesorios de refrigeración", coleccion: "accesorios-de-refrigeracion", slugRiel: "accesorios-refrigeracion", ruta: `${REFRI.ruta}?tipo=accesorios-refrigeracion`, macro: COCINA, sub1: REFRI },
  { tipo: "Parrillas", coleccion: "parrillas", slugRiel: "parrillas", ruta: `${COCCION.ruta}/parrillas`, macro: COCINA, sub1: COCCION },
  { tipo: "Hornos", coleccion: "hornos", slugRiel: "hornos", ruta: `${COCCION.ruta}?tipo=hornos`, macro: COCINA, sub1: COCCION },
  { tipo: "Campanas", coleccion: "campanas", slugRiel: "campanas", ruta: `${COCCION.ruta}/campanas`, macro: COCINA, sub1: COCCION },
  // Cocción completa: colecciones creadas y publicadas al canal Headless el 2026-10-09.
  { tipo: "Estufas", coleccion: "estufas", slugRiel: "estufas", ruta: `${COCCION.ruta}?tipo=estufas`, macro: COCINA, sub1: COCCION },
  { tipo: "Microondas", coleccion: "microondas", slugRiel: "microondas", ruta: `${COCCION.ruta}?tipo=microondas`, macro: COCINA, sub1: COCCION },
  { tipo: "Cajones", coleccion: "cajones", slugRiel: "cajones", ruta: `${COCCION.ruta}?tipo=cajones`, macro: COCINA, sub1: COCCION },
  { tipo: "Cafeteras", coleccion: "cafeteras", slugRiel: "cafeteras-empotrables", ruta: `${COCCION.ruta}?tipo=cafeteras-empotrables`, macro: COCINA, sub1: COCCION },
  { tipo: "Accesorios de cocción", coleccion: "accesorios-de-coccion", slugRiel: "accesorios-coccion", ruta: `${COCCION.ruta}?tipo=accesorios-coccion`, macro: COCINA, sub1: COCCION },
  {
    tipo: "Lavavajillas", coleccion: "lavavajillas", slugRiel: "lavavajillas-empotrable", ruta: `${LAVA.ruta}?tipo=lavavajillas-empotrable`, macro: COCINA, sub1: LAVA,
    porInstalacion: { "De piso": "lavavajillas-de-piso" },
    accesorios: { slug: "accesorios-lavavajillas", nombre: "Accesorios" },
  },
];

export const tipoWeb = (tipo: string) => TIPOS_WEB.find((t) => t.tipo === tipo) ?? null;

type Pieza = { tipo: string; filtros: Record<string, string[]> };

/** ¿Es accesorio? Por su colección ("Accesorios de …") o por su `filtros.tipo` ("Accesorio de lavavajillas"). */
export const esAccesorio = (p: Pieza) =>
  /^Accesorios/i.test(p.tipo) || (p.filtros.tipo ?? []).some((v) => /^Accesorio/i.test(v));

/**
 * Opción de "Tipo de producto" (riel / grupo del panel) de una pieza: los
 * accesorios de una colección de equipos y las variantes por instalación tienen
 * la suya; lo demás usa el tile de su Tipo. `nombre` solo cuando no hay tile en el riel.
 */
export function tipoDePieza(p: Pieza): { slug: string | null; nombre: string | null } {
  const tw = tipoWeb(p.tipo);
  if (!tw) return { slug: null, nombre: null };
  if (tw.accesorios && esAccesorio(p)) return { slug: tw.accesorios.slug, nombre: tw.accesorios.nombre };
  for (const v of p.filtros.instalacion ?? []) {
    const slug = tw.porInstalacion?.[v];
    if (slug) return { slug, nombre: null };
  }
  return { slug: tw.slugRiel, nombre: null };
}

/** Subcategoría 1 (`<macro>/<sub1>`) → sus tipos con catálogo vivo. */
export function tiposDeSub1(categoria: string, subcategoria: string): TipoWeb[] {
  const ruta = `/productos/${categoria}/${subcategoria}`;
  return TIPOS_WEB.filter((t) => t.sub1.ruta === ruta);
}

/** PLP de tipo (`<macro>/<sub1>/<tipo>`) → su tipo con catálogo vivo. */
export function tipoDePlp(categoria: string, subcategoria: string, tipo: string): TipoWeb | null {
  const ruta = `/productos/${categoria}/${subcategoria}/${tipo}`;
  return TIPOS_WEB.find((t) => t.ruta === ruta) ?? null;
}
