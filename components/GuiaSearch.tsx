"use client";

// GuiaSearch — buscador de la sección Guías.
//  • En el hub /guias: filtra entre TODAS las guías (título, resumen, etiqueta).
//  • En una categoría (Subcategoría 1, p.ej. Refrigeración): se pasa `topics`
//    (las Subcategorías 2 / tipos de producto) además de las guías de esa
//    categoría → la búsqueda queda ACOTADA a esa subcategoría y encuentra tanto
//    sus temas (Refrigeradores, Cavas de vino, …) como sus guías.
// Los temas enlazan a su filtro PLP vía <CtaProducto> (sin 404); las guías a su ruta.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { GuideCardData } from "./GuideCard";
import CtaProducto from "./CtaProducto";

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

interface Topic {
  nombre: string;
  filtro: string;
}

interface Props {
  guias: GuideCardData[];
  /** Temas (Subcategoría 2) de la categoría actual; acotan la búsqueda a la subcategoría. */
  topics?: Topic[];
  /** Texto del placeholder del input. */
  placeholder?: string;
  /** Etiqueta accesible del input. */
  ariaLabel?: string;
  /** Etiqueta (tag) que se muestra en los resultados de tema. */
  scopeLabel?: string;
}

export default function GuiaSearch({
  guias,
  topics = [],
  placeholder = "Busca en el Centro de Guías",
  ariaLabel = "Buscar en las guías",
  scopeLabel = "Tema",
}: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const term = norm(q.trim());

  // Temas (Subcategoría 2) que coinciden por nombre.
  const temas = useMemo(() => {
    if (term.length < 2) return [];
    return topics.filter((t) => norm(t.nombre).includes(term));
  }, [term, topics]);

  // Guías que coinciden (título + resumen + etiqueta).
  const resultados = useMemo(() => {
    if (term.length < 2) return [];
    return guias.filter((g) => norm(`${g.titulo} ${g.resumen} ${g.etiqueta}`).includes(term));
  }, [term, guias]);

  const total = temas.length + resultados.length;

  // Cerrar el panel al hacer clic fuera o con Escape.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const showPanel = open && term.length >= 2;

  // Limitar la altura del panel para que no invada la sección de abajo: su borde
  // inferior nunca pasa del encabezado de la sección (ni del viewport).
  useEffect(() => {
    if (!showPanel) return;
    const panel = panelRef.current;
    if (!panel) return;
    const heading = document.querySelector(".catsec h2, .category-main h2, .sec h2");
    const fit = () => {
      const top = panel.getBoundingClientRect().top;
      const headingTop = heading
        ? heading.getBoundingClientRect().top - 24
        : window.innerHeight;
      const bound = Math.min(headingTop, window.innerHeight - 8);
      panel.style.maxHeight = `${Math.max(0, bound - top)}px`;
    };
    fit();
    window.addEventListener("scroll", fit, { passive: true });
    window.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("scroll", fit);
      window.removeEventListener("resize", fit);
    };
  }, [showPanel, total]);

  return (
    <div
      className="guia-search"
      ref={wrapRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="guia-search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
             strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </svg>
        <input
          type="search"
          className="guia-search-input"
          placeholder={placeholder}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-label={ariaLabel}
          autoComplete="off"
        />
      </div>

      {showPanel && (
        <div className="guia-search-panel" ref={panelRef} role="listbox" aria-label="Resultados de búsqueda">
          {total === 0 ? (
            <p className="guia-search-empty">Sin resultados para «{q.trim()}».</p>
          ) : (
            <ul className="guia-search-results">
              {temas.map((t) => (
                <li key={`t-${t.filtro}`}>
                  <CtaProducto
                    filtro={t.filtro}
                    className="guia-search-result"
                    fallback="whatsapp"
                  >
                    <span className="guia-search-result-tag">{scopeLabel}</span>
                    <span className="guia-search-result-title">{t.nombre}</span>
                  </CtaProducto>
                </li>
              ))}
              {resultados.map((g) => (
                <li key={`g-${g.href}`}>
                  <Link className="guia-search-result" href={g.href} onClick={() => setOpen(false)}>
                    <span className="guia-search-result-tag">{g.etiqueta}</span>
                    <span className="guia-search-result-title">{g.titulo}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
