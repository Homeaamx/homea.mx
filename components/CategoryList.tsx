// CategoryList — listas de la sección Guías.
//   variant "cards"  → grid de tarjetas de Subcategorías 1 (índice de macro de 3 niveles).
//   variant "rail"   → lista vertical lateral de Subcategorías 1 (resalta la actual).
//   variant "leaves" → lista lateral de los TIPOS DE PRODUCTO (Subcategoría 2) de la
//                      categoría actual; enlazan a su filtro PLP vía <CtaProducto> (sin 404).

import Link from "next/link";
import type { Subcategoria1 } from "@/types/guias";
import CtaProducto from "./CtaProducto";

interface Props {
  categorias?: Subcategoria1[];
  variant?: "cards" | "rail" | "leaves";
  currentSlug?: string;
  /** Leaves de producto (con nombre + filtro) para variant "leaves".
      Acepta Subcategoría 2 (3 niveles) o leaves de Subcategoría 1 (2 niveles).
      Si el leaf trae `rutaFiltros` y varios `filtros`, enlaza a su página de filtros. */
  leaves?: {
    nombre: string;
    filtro: string;
    rutaFiltros?: string;
    filtros?: unknown[];
  }[];
  /** Encabezado del rail (default "Categorías"). */
  railHead?: string;
}

export default function CategoryList({
  categorias = [],
  variant = "cards",
  currentSlug,
  leaves = [],
  railHead = "Categorías",
}: Props) {
  if (variant === "leaves") {
    return (
      <nav className="cat-rail" aria-label={railHead}>
        <span className="cat-rail-head eyebrow">{railHead}</span>
        {leaves.map((l) => {
          // Con varios filtros → página de filtros; si no → filtro PLP directo.
          const tieneFiltros = Boolean(l.rutaFiltros) && (l.filtros?.length ?? 0) > 1;
          return tieneFiltros ? (
            <Link
              key={l.rutaFiltros}
              href={l.rutaFiltros as string}
              className="cat-rail-item cat-rail-leaf"
            >
              {l.nombre}
            </Link>
          ) : (
            <CtaProducto
              key={l.filtro}
              filtro={l.filtro}
              className="cat-rail-item cat-rail-leaf"
              fallback="whatsapp"
            >
              {l.nombre}
            </CtaProducto>
          );
        })}
      </nav>
    );
  }

  if (variant === "rail") {
    return (
      <nav className="cat-rail" aria-label="Otras categorías">
        <span className="cat-rail-head eyebrow">{railHead}</span>
        {categorias.map((c) => (
          <Link
            key={c.slug}
            href={c.rutaGuias ?? "#"}
            className={`cat-rail-item${c.slug === currentSlug ? " is-active" : ""}`}
            aria-current={c.slug === currentSlug ? "page" : undefined}
          >
            {c.nombre}
            <span className="cat-rail-n">{c.guias?.length ?? 0}</span>
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <div className="category-cards">
      {categorias.map((c) => {
        const leafNames = (c.subcategorias2 ?? []).map((s) => s.nombre).slice(0, 5).join(" · ");
        return (
          <Link key={c.slug} href={c.rutaGuias ?? "#"} className="category-card">
            <div className="category-card-top">
              <h3>{c.nombre}</h3>
              <span className="category-card-n">{c.guias?.length ?? 0} guías</span>
            </div>
            {leafNames && <p className="category-card-leaves">{leafNames}</p>}
            <span className="category-card-more">
              Ver guías <span aria-hidden="true">→</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
