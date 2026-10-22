// Índice del buscador de una categoría de Guías (Carla, 2026-10-20): cada
// tarjeta de la portada (tipo de producto) y cada ficha de tipo (FilterShowcase)
// con todo su texto, para que cualquier palabra de la sección lleve a la tarjeta
// donde aparece. Se arma en el servidor (page.tsx) y viaja a GuiaSearch.
//
// Destinos (los atiende DestinoBusqueda en la página que llega):
//   #tipo-<slug>     tarjeta de la portada (misma página)
//   #ficha-<slug>    ficha cerrada (la palabra está en nombre, descripción o specs)
//   #detalle-<slug>  ficha con su descripción extendida (la palabra solo está en
//                    el detalle técnico del modal)

import type { GrupoFicha, Subcategoria2 } from "@/types/guias";
import { conPaginaFichas } from "./paginaFichas";

export interface EntradaBusqueda {
  /** Título visible del resultado (nombre de la tarjeta o ficha). */
  titulo: string;
  /** Etiqueta del resultado: "Refrigeradores · Diseño". */
  tag: string;
  /** Texto visible en la tarjeta cerrada (descripción y specs). */
  visible: string;
  /** Texto que solo aparece al abrir la ficha (detalle técnico). */
  extendido: string;
  href: string;
  /** Destino cuando la coincidencia está solo en `extendido`. */
  hrefDetalle?: string;
}

/** Slug estable del nombre de una ficha (id de la tarjeta en FilterShowcase). */
export function slugFicha(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Mismas etiquetas por omisión que FilterShowcase.
const GRUPO: Record<GrupoFicha, string> = {
  tipo: "Tipo de instalación",
  instalacion: "Tipo de instalación",
  estilo: "Diseño",
};

/** Entradas de una categoría: sus tarjetas de portada (si `portada`) y todas las
 *  fichas de sus tipos que tienen página de fichas. */
export function indiceCategoria(
  tipos: (Pick<Subcategoria2, "nombre" | "slug" | "tarjeta" | "rutaFiltros" | "etiquetasGrupos"> & {
    filtros?: Subcategoria2["filtros"];
  })[],
  portada: boolean,
): EntradaBusqueda[] {
  const out: EntradaBusqueda[] = [];
  for (const s of tipos) {
    if (portada && s.tarjeta) {
      out.push({ titulo: s.nombre, tag: "Categoría", visible: s.tarjeta.resumen, extendido: "", href: `#tipo-${s.slug}` });
    }
    if (!conPaginaFichas(s)) continue;
    for (const f of s.filtros!) {
      if (!f.ficha) continue;
      const slug = slugFicha(f.nombre);
      const grupo = s.etiquetasGrupos?.[f.ficha.grupo] ?? GRUPO[f.ficha.grupo];
      out.push({
        titulo: f.nombre,
        tag: `${s.nombre} · ${grupo}`,
        visible: `${f.ficha.descripcion} ${f.ficha.specs.replace(/·/g, ".")}`,
        extendido: f.ficha.detalle ?? "",
        href: `${s.rutaFiltros}#ficha-${slug}`,
        hrefDetalle: f.ficha.detalle ? `${s.rutaFiltros}#detalle-${slug}` : undefined,
      });
    }
  }
  return out;
}
