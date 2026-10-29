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
  /**
   * Nombre del tile del riel cuando NO es el nombre del Tipo (Lavavajillas →
   * "Lavavajillas empotrable"); lo usa la miga de la ficha para no repetir la
   * Subcategoría 1 (Carla, 2026-10-12).
   */
  nombreRiel?: string;
  /** Tipo de instalación (`filtros.instalacion`) → otro tile del riel (Lavavajillas: empotrable / de piso). */
  porInstalacion?: Record<string, { slug: string; nombre: string }>;
  /**
   * Accesorios que viven en la MISMA colección que el equipo (sin subcategoría
   * propia, Carla 2026-10-09): se marcan con `filtros.tipo` = "Accesorio de …" y
   * en la web salen como esta opción de "Tipo de producto".
   */
  accesorios?: { slug: string; nombre: string };
  /**
   * Macros con UNA sola colección cuyo riel sale de un filtro de la tabla
   * (Electrodomésticos menores y Lavandería → "Tipo" = `filtros.tipo`; Aire
   * acondicionado → "Tipo de funcionamiento"). Cada tile del riel es un valor de
   * ese grupo; `valores` traduce el slug del tile al valor de la tabla cuando no
   * coinciden (minisplit-frio → "Solo frío").
   */
  ejeRiel?: { nombre: string; clave: string; valores?: Record<string, string> };
}

const COCINA = { nombre: "Cocina y Bar", ruta: "/productos/cocina-y-bar" };
const REFRI = { nombre: "Refrigeración", ruta: "/productos/cocina-y-bar/refrigeracion" };
const COCCION = { nombre: "Cocción", ruta: "/productos/cocina-y-bar/coccion" };
const LAVA = { nombre: "Lavavajillas", ruta: "/productos/cocina-y-bar/lavavajillas" };
const TARJAS = { nombre: "Tarjas y Monomandos", ruta: "/productos/cocina-y-bar/tarjas-y-griferia" };
const TRITURADORES = { nombre: "Trituradores", ruta: "/productos/cocina-y-bar/trituradores" };
const AGUA = { nombre: "Purificadores y Despachadores de Agua", ruta: "/productos/cocina-y-bar/filtros-y-purificadores-de-agua" };
const EXTERIOR = { nombre: "Exterior", ruta: "/productos/exterior" };
const ASADORES = { nombre: "Asadores & Hornos", ruta: "/productos/exterior/asadores-y-hornos" };
const MENORES = { nombre: "Electrodomésticos Menores", ruta: "/productos/electrodomesticos-menores" };
const LAVANDERIA = { nombre: "Lavandería", ruta: "/productos/lavanderia" };
const AIRE = { nombre: "Aire acondicionado", ruta: "/productos/aire-acondicionado" };

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
    nombreRiel: "Lavavajillas empotrable",
    porInstalacion: { "De piso": { slug: "lavavajillas-de-piso", nombre: "Lavavajillas de piso" } },
    accesorios: { slug: "accesorios-lavavajillas", nombre: "Accesorios" },
  },
  // Resto de Cocina y Bar: colecciones creadas y publicadas al canal Headless el
  // 2026-10-13 (aún sin piezas). Al publicar productos con ese Tipo, aparecen solos.
  { tipo: "Tarjas", coleccion: "tarjas", slugRiel: "tarjas", ruta: `${TARJAS.ruta}?tipo=tarjas`, macro: COCINA, sub1: TARJAS },
  { tipo: "Monomandos", coleccion: "monomandos", slugRiel: "monomandos", ruta: `${TARJAS.ruta}?tipo=monomandos`, macro: COCINA, sub1: TARJAS },
  { tipo: "Accesorios de Tarjas y Monomandos", coleccion: "accesorios-de-tarjas-y-monomandos", slugRiel: "accesorios-tarjas-monomandos", ruta: `${TARJAS.ruta}?tipo=accesorios-tarjas-monomandos`, macro: COCINA, sub1: TARJAS },
  // Trituradores no tiene riel (un solo tipo): la página entera es su listado.
  { tipo: "Trituradores", coleccion: "trituradores", slugRiel: "trituradores", ruta: TRITURADORES.ruta, macro: COCINA, sub1: TRITURADORES },
  // Filtros y repuestos (cartuchos, tanques) viven con los purificadores como
  // accesorios: `filtros.tipo` = "Accesorio de purificador" (Carla, 2026-10-21).
  {
    tipo: "Purificadores de agua", coleccion: "purificadores-de-agua", slugRiel: "purificadores-de-agua", ruta: `${AGUA.ruta}?tipo=purificadores-de-agua`, macro: COCINA, sub1: AGUA,
    accesorios: { slug: "filtros-y-repuestos", nombre: "Filtros y repuestos de agua" },
  },
  { tipo: "Despachadores de agua", coleccion: "despachadores-de-agua", slugRiel: "despachadores-de-agua", ruta: `${AGUA.ruta}?tipo=despachadores-de-agua`, macro: COCINA, sub1: AGUA },
  // Exterior: colecciones creadas y publicadas al canal Headless el 2026-10-13 (sin piezas).
  // Asadores tiene dos tiles en el riel según `filtros.instalacion` (Empotrable / Carrito).
  {
    tipo: "Asadores", coleccion: "asadores", slugRiel: "asadores-empotrables", ruta: `${ASADORES.ruta}?tipo=asadores-empotrables`, macro: EXTERIOR, sub1: ASADORES,
    nombreRiel: "Asadores empotrables",
    porInstalacion: { Carrito: { slug: "asadores-con-carrito", nombre: "Asadores con carrito" } },
  },
  { tipo: "Hornos de pizza", coleccion: "hornos-de-pizza", slugRiel: "hornos-de-pizza", ruta: `${ASADORES.ruta}?tipo=hornos-de-pizza`, macro: EXTERIOR, sub1: ASADORES },
  { tipo: "Accesorios Asadores & Hornos", coleccion: "accesorios-asadores-y-hornos", slugRiel: "accesorios-asadores-hornos", ruta: `${ASADORES.ruta}?tipo=accesorios-asadores-hornos`, macro: EXTERIOR, sub1: ASADORES },
  // Tipos que cuelgan directo de la macro (Carla, 2026-10-05): su riel vive en /productos/exterior.
  { tipo: "Quemador lateral", coleccion: "quemador-lateral", slugRiel: "quemador-lateral", ruta: `${EXTERIOR.ruta}?tipo=quemador-lateral`, macro: EXTERIOR, sub1: EXTERIOR },
  { tipo: "Plancha Teppanyaki", coleccion: "plancha-teppanyaki", slugRiel: "plancha-teppanyaki", ruta: `${EXTERIOR.ruta}?tipo=plancha-teppanyaki`, macro: EXTERIOR, sub1: EXTERIOR },
  { tipo: "Ahumadores", coleccion: "ahumadores", slugRiel: "ahumadores", ruta: `${EXTERIOR.ruta}?tipo=ahumadores`, macro: EXTERIOR, sub1: EXTERIOR },
  { tipo: "Hieleras", coleccion: "hieleras", slugRiel: "hieleras", ruta: `${EXTERIOR.ruta}?tipo=hieleras`, macro: EXTERIOR, sub1: EXTERIOR },
  { tipo: "Gabinetes", coleccion: "gabinetes", slugRiel: "gabinetes", ruta: `${EXTERIOR.ruta}?tipo=gabinetes`, macro: EXTERIOR, sub1: EXTERIOR },
  // Una colección por macro (tabla de filtros: Subcategoría 2 = la macro) y el
  // riel por valor de filtro. Colecciones creadas y publicadas al canal Headless
  // el 2026-10-14 (aún sin piezas).
  {
    tipo: "Electrodomésticos menores", coleccion: "electrodomesticos-menores", slugRiel: "electrodomesticos-menores", ruta: MENORES.ruta, macro: MENORES, sub1: MENORES,
    ejeRiel: { nombre: "Tipo", clave: "tipo" },
  },
  {
    tipo: "Lavandería", coleccion: "lavanderia", slugRiel: "lavanderia", ruta: LAVANDERIA.ruta, macro: LAVANDERIA, sub1: LAVANDERIA,
    ejeRiel: { nombre: "Tipo", clave: "tipo" },
  },
  {
    tipo: "Aire acondicionado", coleccion: "aire-acondicionado", slugRiel: "aire-acondicionado", ruta: AIRE.ruta, macro: AIRE, sub1: AIRE,
    ejeRiel: {
      nombre: "Tipo de funcionamiento",
      clave: "funcionamiento",
      valores: { "minisplit-frio": "Solo frío", "minisplit-frio-y-calor": "Frío y calor" },
    },
  },
];

/** Tile del riel de una pieza en las macros con `ejeRiel` (por el valor de su filtro). */
function tileDeEje(tw: TipoWeb, p: Pieza): { slug: string; valor: string } | null {
  if (!tw.ejeRiel) return null;
  const valor = (p.filtros[tw.ejeRiel.clave] ?? [])[0];
  if (!valor) return null;
  const k = slugDeTipo(valor);
  const slug =
    Object.entries(tw.ejeRiel.valores ?? {}).find(([, v]) => slugDeTipo(v) === k)?.[0] ?? k;
  return { slug, valor };
}

/**
 * Piezas de OTRA colección que también se listan en una macro, acotadas por un
 * filtro: las campanas de uso Exterior (Tipo "Campanas", Cocción) salen también
 * en /productos/exterior con la tabla "Campanas — Uso: Exterior".
 */
export const EXTRAS_DE_MACRO: Record<
  string,
  { coleccion: string; filtro: { clave: string; valor: string }; tablaFiltros: string }[]
> = {
  "/productos/exterior": [
    { coleccion: "campanas", filtro: { clave: "uso", valor: "Exterior" }, tablaFiltros: "Campanas — Uso: Exterior" },
    // Tarjas, llaves y accesorios de bar para cocina de exterior (Alfresco; Carla, 2026-10-29).
    { coleccion: "tarjas", filtro: { clave: "uso", valor: "Exterior" }, tablaFiltros: "Tarjas" },
    { coleccion: "monomandos", filtro: { clave: "uso", valor: "Exterior" }, tablaFiltros: "Monomandos" },
    { coleccion: "accesorios-de-tarjas-y-monomandos", filtro: { clave: "uso", valor: "Exterior" }, tablaFiltros: "Accesorios de Tarjas y Monomandos" },
  ],
};

/**
 * Piezas de OTRA colección que también se listan en la PLP de un tipo, acotadas
 * por un filtro: las parrillas de inducción con extractor integrado (Elica
 * NikolaTesla) son Tipo "Parrillas" y salen también en Campanas, en el diseño
 * "Inducción con sistema de extracción" (Carla, 2026-10-27).
 */
export const EXTRAS_DE_TIPO: Record<
  string,
  { coleccion: string; filtro: { clave: string; valor: string }; quitar?: string[] }[]
> = {
  // `quitar`: filtros de su propio tipo que no aplican aquí (la instalación
  // "Tradicional" de parrilla no es una opción de campana).
  Campanas: [
    {
      coleccion: "parrillas",
      filtro: { clave: "diseno", valor: "Inducción con sistema de extracción" },
      quitar: ["instalacion", "funcionamiento", "quemadores"],
    },
  ],
};

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
  const eje = tileDeEje(tw, p);
  if (eje) return { slug: eje.slug, nombre: eje.valor };
  for (const v of p.filtros.instalacion ?? []) {
    const tile = tw.porInstalacion?.[v];
    if (tile) return { slug: tile.slug, nombre: null };
  }
  return { slug: tw.slugRiel, nombre: null };
}

/**
 * Tile del riel de una pieza con su nombre visible y su página, para la miga de
 * la ficha: Lavavajillas · Lavavajillas empotrable (o de piso, según
 * `filtros.instalacion`), nunca "Lavavajillas · Lavavajillas".
 */
export function tileDePieza(p: Pieza): { ruta: string; nombre: string } | null {
  const tw = tipoWeb(p.tipo);
  if (!tw) return null;
  if (tw.accesorios && esAccesorio(p)) return { ruta: `${tw.sub1.ruta}?tipo=${tw.accesorios.slug}`, nombre: tw.accesorios.nombre };
  const eje = tileDeEje(tw, p);
  if (eje) return { ruta: `${tw.sub1.ruta}?tipo=${eje.slug}`, nombre: eje.valor };
  for (const v of p.filtros.instalacion ?? []) {
    const tile = tw.porInstalacion?.[v];
    if (tile) return { ruta: `${tw.sub1.ruta}?tipo=${tile.slug}`, nombre: tile.nombre };
  }
  return { ruta: tw.ruta, nombre: tw.nombreRiel ?? p.tipo };
}

/** Macrocategoría (`/productos/<macro>`) → todos sus tipos con catálogo vivo. */
export function tiposDeMacro(categoria: string): TipoWeb[] {
  const ruta = `/productos/${categoria}`;
  return TIPOS_WEB.filter((t) => t.macro.ruta === ruta);
}

/**
 * Tiles de "Tipo de producto" que SÍ tienen piezas entre `productos`, en el
 * orden de TIPOS_WEB (equipos antes que accesorios, variantes por instalación
 * después del tile base). Para los paneles sin riel propio (página de marca,
 * macrocategoría): el grupo enseña solo lo que existe, no los 17 tipos.
 */
export function tilesPresentes(productos: Pieza[]): { slug: string; nombre: string }[] {
  const vistos = new Map<string, string>();
  for (const p of productos) {
    const slug = tipoDePieza(p).slug ?? slugDeTipo(p.tipo);
    if (vistos.has(slug)) continue;
    const tw = tipoWeb(p.tipo);
    let nombre = tileDePieza(p)?.nombre ?? p.tipo;
    // Fuera de su subcategoría, "Accesorios" a secas no dice de qué: se completa
    // ("Accesorios de lavavajillas") para distinguirlo de los de refrigeración y cocción.
    if (tw && tw.accesorios && slug === tw.accesorios.slug && !/ de /i.test(nombre)) {
      nombre = `${nombre} de ${tw.sub1.nombre.toLowerCase()}`;
    }
    vistos.set(slug, nombre);
  }
  // Orden de TIPOS_WEB; dentro de un tipo, el tile base, luego sus variantes por
  // instalación y al final sus accesorios.
  const orden = (slug: string) => {
    for (let i = 0; i < TIPOS_WEB.length; i++) {
      const t = TIPOS_WEB[i];
      if (t.slugRiel === slug) return i * 10;
      if (Object.values(t.porInstalacion ?? {}).some((v) => v.slug === slug)) return i * 10 + 1;
      if (t.accesorios?.slug === slug) return i * 10 + 2;
    }
    return TIPOS_WEB.length * 10;
  };
  return [...vistos]
    .map(([slug, nombre]) => ({ slug, nombre }))
    .sort((a, b) => orden(a.slug) - orden(b.slug) || a.nombre.localeCompare(b.nombre, "es"));
}

/** "Cavas de vino" → "cavas-de-vino" (mismo criterio que slugValor de htmlCatalogo). */
function slugDeTipo(v: string): string {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
