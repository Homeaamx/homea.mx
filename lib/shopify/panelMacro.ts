// panelMacro.ts — opciones del panel de filtros de una macrocategoría
// (Subcategoría · Tipo de producto · filtros.* de sus tipos).
//
// Lo usan /productos/<macro> y /ofertas (que aplica los filtros de Cocina y Bar a
// las piezas en stock, decisión Carla 2026-10-19). Solo macros con riel de tipos
// por colección; las de un solo eje (Lavandería, Aire…) se arman en su página.

import "server-only";

import { categoriaFile, getMain } from "@/lib/preview";

import type { ProductoVivo } from "./catalogoVivo";
import { EXTRAS_DE_MACRO, tilesPresentes, tiposDeMacro } from "./coleccionesWeb";

export interface OpcionesPanelMacro {
  conCategoria: true;
  conTipo: true;
  tiposRiel: { slug: string; nombre: string }[];
  tipos: string[];
}

export function opcionesPanelMacro(categoria: string, productos: ProductoVivo[]): OpcionesPanelMacro {
  const tipos = tiposDeMacro(categoria);
  const extras = EXTRAS_DE_MACRO[`/productos/${categoria}`] ?? [];
  // Tiles del riel que filtran en la página de la macro (?tipo=), aunque no
  // tengan piezas: así cada uno tiene su casilla en "Tipo de producto".
  const riel = [
    ...getMain(categoriaFile(categoria)).matchAll(
      /<a class="subcat" data-tipo="([^"]+)"[\s\S]*?<span class="lbl">([^<]+)<\/span>/g,
    ),
  ].map((m) => ({ slug: m[1], nombre: m[2].replace(/&amp;/g, "&") }));
  for (const t of tilesPresentes(productos)) if (!riel.some((r) => r.slug === t.slug)) riel.push(t);
  // Y los tipos de sus subcategorías (Asadores & Hornos…), con 0 mientras no haya piezas.
  for (const t of tipos) {
    const tiles = [
      { slug: t.slugRiel, nombre: t.nombreRiel ?? t.tipo },
      ...Object.values(t.porInstalacion ?? {}),
      ...(t.accesorios ? [{ slug: t.accesorios.slug, nombre: `${t.accesorios.nombre} de ${t.sub1.nombre.toLowerCase()}` }] : []),
    ];
    for (const tile of tiles) if (!riel.some((r) => r.slug === tile.slug)) riel.push(tile);
  }
  return {
    conCategoria: true,
    conTipo: true,
    tiposRiel: riel,
    tipos: [...tipos.map((t) => t.tipo), ...extras.map((e) => e.tablaFiltros)],
  };
}
