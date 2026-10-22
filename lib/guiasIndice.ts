// Índice GLOBAL del buscador de Guías (Carla, 2026-10-21): todo lo que vive en
// una página /guias/… — macros, categorías, tipos de producto con su tarjeta,
// fichas de tipo (descripción, specs y detalle técnico) y las guías del blog
// con su texto completo. Lo sirve /api/buscar-guias y GuiaSearch lo descarga
// solo al usar el buscador (no pesa en el HTML de la página).
//
// Solo servidor: lee el blog de Shopify (lib/guias).

import { getMacros, nombreTipo, todasLasGuias } from "./guias";
import { indiceCategoria, type EntradaBusqueda } from "./guiasBusqueda";
import { conPaginaFichas } from "./paginaFichas";
import type { Subcategoria1, Subcategoria2 } from "@/types/guias";

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Texto plano de un HTML: sin etiquetas, con entidades decodificadas. */
function textoPlano(html: string): string {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : m;
      }
      return ENTIDADES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, " ")
    .trim();
}

type Tipo = Pick<Subcategoria2, "nombre" | "slug" | "tarjeta" | "rutaFiltros" | "filtros">;

/** Tarjeta de un tipo de producto. Con página de fichas lleva a ella; si no, a la
 *  página que la lista (a su tarjeta cuando es portada: todos los hermanos con
 *  tarjeta, igual que page.tsx decide la portada). */
function entradaTipo(s: Tipo, hermanos: Tipo[], padre: { nombre: string; ruta: string }): EntradaBusqueda {
  const portada = hermanos.length > 0 && hermanos.every((h) => h.tarjeta);
  return {
    titulo: s.nombre,
    tag: padre.nombre,
    visible: s.tarjeta?.resumen ?? "",
    extendido: "",
    href: conPaginaFichas(s) ? s.rutaFiltros! : portada ? `${padre.ruta}#tipo-${s.slug}` : padre.ruta,
  };
}

export async function indiceGuias(): Promise<EntradaBusqueda[]> {
  const out: EntradaBusqueda[] = [];

  for (const macro of getMacros()) {
    out.push({ titulo: macro.nombre, tag: "Guías", visible: "", extendido: "", href: macro.ruta });

    if (macro.nivelGuias === "macrocategoria") {
      // Rama de 2 niveles: las Subcategorías 1 son los tipos (leaves).
      const leaves = macro.subcategorias1 as (Subcategoria1 & Tipo)[];
      for (const l of leaves) out.push(entradaTipo(l, leaves, macro));
      out.push(...indiceCategoria(leaves, false));
      continue;
    }

    for (const sub1 of macro.subcategorias1) {
      if (!sub1.rutaGuias) continue;
      const tipos = sub1.subcategorias2 ?? [];
      out.push({ titulo: sub1.nombre, tag: macro.nombre, visible: "", extendido: "", href: sub1.rutaGuias });
      for (const s of tipos) out.push(entradaTipo(s, tipos, { nombre: sub1.nombre, ruta: sub1.rutaGuias }));
      out.push(...indiceCategoria(tipos, false));
    }
  }

  for (const g of await todasLasGuias()) {
    out.push({
      titulo: g.titulo,
      tag: `${g.sub1?.nombre ?? g.macro.nombre} · ${nombreTipo(g.tipo)}`,
      visible: g.resumen,
      extendido: textoPlano(g.html),
      href: g.ruta,
    });
  }

  return out;
}
