"use client";

// GuideTypeFilter — chips de "tipo de guía" + grid de GuideCard filtrable en cliente.
// Los tipos se leen de tiposDeGuia (pasados como prop); solo se muestran los presentes.

import { useMemo, useState } from "react";
import GuideCard, { type GuideCardData } from "./GuideCard";

interface Props {
  cards: GuideCardData[];
  /** Catálogo de tipos (slug+nombre) desde taxonomia.tiposDeGuia. */
  tipos: { slug: string; nombre: string }[];
}

const TODOS = "__todos__";

export default function GuideTypeFilter({ cards, tipos }: Props) {
  const [activo, setActivo] = useState<string>(TODOS);

  // Solo tipos que aparecen en estas tarjetas.
  const tiposPresentes = useMemo(() => {
    const usados = new Set(cards.map((c) => c.tipo));
    return tipos.filter((t) => usados.has(t.slug));
  }, [cards, tipos]);

  const visibles = activo === TODOS ? cards : cards.filter((c) => c.tipo === activo);

  return (
    <div className="guide-filter">
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

      <div className="guide-grid">
        {visibles.map((c) => (
          <GuideCard key={c.href} card={c} />
        ))}
      </div>
    </div>
  );
}
