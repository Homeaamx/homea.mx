// ¿La subcategoría tiene su página de fichas en /guias? Sí cuando hay varios
// filtros que comparar, o uno solo con ilustración en escena (Lavavajillas
// empotrable, Carla 2026-10-21: solo existe con controles ocultos, pero su
// escena con el botón Panelar merece su página). Si no, la tarjeta va a la tienda.

interface ConFiltros {
  rutaFiltros?: string;
  filtros?: readonly unknown[];
}

const ilustrado = (f: unknown) => Boolean((f as { ficha?: { ilustracion?: string } } | null)?.ficha?.ilustracion);

export function conPaginaFichas(s: ConFiltros): boolean {
  const filtros = s.filtros ?? [];
  return Boolean(s.rutaFiltros) && (filtros.length > 1 || filtros.some(ilustrado));
}
