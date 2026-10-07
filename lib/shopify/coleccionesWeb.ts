// coleccionesWeb.ts — qué colección de Shopify alimenta cada página del sitio.
//
// La llave es el Tipo de producto de Shopify (= Subcategoría 2). Cada tipo tiene
// una colección automática con la regla "Tipo = <tipo>" (creadas el 2026-10-06).
// Solo se listan los tipos que ya tienen productos publicados en el canal
// Headless: el resto de las páginas siguen con su contenido estático.

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
}

const COCINA = { nombre: "Cocina y Bar", ruta: "/productos/cocina-y-bar" };
const REFRI = { nombre: "Refrigeración", ruta: "/productos/cocina-y-bar/refrigeracion" };
const COCCION = { nombre: "Cocción", ruta: "/productos/cocina-y-bar/coccion" };
const LAVA = { nombre: "Lavavajillas", ruta: "/productos/cocina-y-bar/lavavajillas" };

export const TIPOS_WEB: TipoWeb[] = [
  { tipo: "Refrigeradores", coleccion: "refrigeradores", slugRiel: "refrigeradores", ruta: `${REFRI.ruta}/refrigeradores`, macro: COCINA, sub1: REFRI },
  { tipo: "Congeladores", coleccion: "congeladores", slugRiel: "congeladores", ruta: `${REFRI.ruta}?tipo=congeladores`, macro: COCINA, sub1: REFRI },
  { tipo: "Cavas de vino", coleccion: "cavas-de-vino", slugRiel: "cavas-de-vino", ruta: `${REFRI.ruta}?tipo=cavas-de-vino`, macro: COCINA, sub1: REFRI },
  { tipo: "Accesorios de refrigeración", coleccion: "accesorios-de-refrigeracion", slugRiel: "accesorios-refrigeracion", ruta: `${REFRI.ruta}?tipo=accesorios-refrigeracion`, macro: COCINA, sub1: REFRI },
  { tipo: "Parrillas", coleccion: "parrillas", slugRiel: "parrillas", ruta: `${COCCION.ruta}/parrillas`, macro: COCINA, sub1: COCCION },
  { tipo: "Hornos", coleccion: "hornos", slugRiel: "hornos", ruta: `${COCCION.ruta}?tipo=hornos`, macro: COCINA, sub1: COCCION },
  { tipo: "Campanas", coleccion: "campanas", slugRiel: "campanas", ruta: `${COCCION.ruta}/campanas`, macro: COCINA, sub1: COCCION },
  { tipo: "Lavavajillas", coleccion: "lavavajillas", slugRiel: "lavavajillas-empotrable", ruta: `${LAVA.ruta}?tipo=lavavajillas-empotrable`, macro: COCINA, sub1: LAVA },
];

export const tipoWeb = (tipo: string) => TIPOS_WEB.find((t) => t.tipo === tipo) ?? null;

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
