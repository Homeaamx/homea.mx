"use client";

// GuideTypeFilter — chips de "tipo de guía" + grid de GuideCard filtrable en cliente.
// Los tipos se leen de tiposDeGuia (pasados como prop); solo se muestran los presentes.
// Con categoría elegida (GuiasPorTema / BlogTemas, Carla 2026-10-20) los chips
// se quedan fijos —cuentan todas las guías de la página— y solo cambian las
// tarjetas (`visibles`) y la acción de la derecha ("Ver productos en tienda").

import { useMemo, useState, type ReactNode } from "react";
import GuideCard, { type GuideCardData } from "./GuideCard";

interface Props {
  cards: GuideCardData[];
  /** Catálogo de tipos (slug+nombre) desde taxonomia.tiposDeGuia. */
  tipos: { slug: string; nombre: string }[];
  /** Oculta los chips mientras haya un solo tipo de guía (no filtran nada). */
  chipsSiVarios?: boolean;
  /** Tarjetas a mostrar (categoría elegida); por omisión, todas. */
  visibles?: GuideCardData[];
  /** Botón a la derecha de los chips. */
  accion?: ReactNode;
  /** Mensaje cuando `visibles` está vacío. */
  vacio?: ReactNode;
}

const TODOS = "__todos__";

export default function GuideTypeFilter({ cards, tipos, chipsSiVarios, visibles, accion, vacio }: Props) {
  const [activo, setActivo] = useState<string>(TODOS);

  // Solo tipos que aparecen en estas tarjetas.
  const tiposPresentes = useMemo(() => {
    const usados = new Set(cards.map((c) => c.tipo));
    return tipos.filter((t) => usados.has(t.slug));
  }, [cards, tipos]);

  const base = visibles ?? cards;
  const mostradas = activo === TODOS ? base : base.filter((c) => c.tipo === activo);

  // Las guías salen del blog "Guías" de Shopify: una categoría puede no tener
  // ninguna publicada todavía.
  if (cards.length === 0) {
    return (
      <>
        {accion && <div className="guide-chips-row">{accion}</div>}
        <p className="guide-empty">
          Estamos preparando las guías de esta categoría. Mientras tanto, un asesor de HOMEA
          te orienta: <a href="/contacto">contáctanos</a>.
        </p>
      </>
    );
  }

  const chips = !(chipsSiVarios && tiposPresentes.length < 2) && (
    <div className="guide-chips" role="tablist" aria-label="Filtrar por tipo de guía">
      <button
        type="button"
        role="tab"
        aria-selected={activo === TODOS}
        className={`chip${activo === TODOS ? " is-active" : ""}`}
        onClick={() => setActivo(TODOS)}
      >
        Todas <span className="chip-n">{cards.length}</span>
      </button>
      {tiposPresentes.map((t) => {
        const n = cards.filter((c) => c.tipo === t.slug).length;
        return (
          <button
            key={t.slug}
            type="button"
            role="tab"
            aria-selected={activo === t.slug}
            className={`chip${activo === t.slug ? " is-active" : ""}`}
            onClick={() => setActivo(t.slug)}
          >
            {t.nombre} <span className="chip-n">{n}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="guide-filter">
      {accion !== undefined ? (
        <div className="guide-chips-row">
          {chips}
          {accion}
        </div>
      ) : (
        chips
      )}

      {mostradas.length === 0 && vacio ? (
        vacio
      ) : (
        <div className="guide-grid">
          {mostradas.map((c) => (
            <GuideCard key={c.href} card={c} />
          ))}
        </div>
      )}
    </div>
  );
}
