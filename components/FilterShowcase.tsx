// FilterShowcase — patrón "Planos de cocina": fichas de tipo de producto con
// diagrama técnico de línea cuyas puertas se ABREN al hover (interior oro
// champagne), descripción concreta siempre visible y línea de specs revelada.
//
// Se usa en la página de filtros de una Subcategoría 2 cuando sus filtros traen
// `ficha` en la taxonomía; los filtros sin ficha caen a chips (FilterList).
// Patrón completo y checklist para nuevas categorías: docs/PATRON-FICHAS-TIPO.md
//
// Cada tarjeta enlaza a su filtro PLP vía <CtaProducto> (sin 404 mientras el
// PLP no exista; cae a WhatsApp con mensaje contextual).

import type { FiltroProducto, GrupoFicha } from "@/types/guias";
import CtaProducto from "./CtaProducto";
import FiltroDiagrama from "./FiltroDiagrama";
import FilterList from "./FilterList";

const GRUPOS: { key: GrupoFicha; label: string }[] = [
  { key: "tipo", label: "Por tipo" },
  { key: "estilo", label: "Por estilo" },
];

interface Props {
  filtros: FiltroProducto[];
  /** Nombre del tipo de producto (p.ej. "Refrigeradores") para el CTA y WhatsApp. */
  contexto: string;
}

export default function FilterShowcase({ filtros, contexto }: Props) {
  const conFicha = filtros.filter((f) => f.ficha);
  const sinFicha = filtros.filter((f) => !f.ficha);
  const ctaLabel = `Ver ${contexto.toLowerCase()}`;

  return (
    <div className="tfk">
      {GRUPOS.map(({ key, label }) => {
        const grupo = conFicha.filter((f) => f.ficha!.grupo === key);
        if (grupo.length === 0) return null;
        return (
          <div className="tfk-group" key={key}>
            <p className="eyebrow tfk-group-label">{label}</p>
            <div className="tfk-grid">
              {grupo.map((f) => (
                <CtaProducto
                  key={f.filtro}
                  filtro={f.filtro}
                  className="tfk-card"
                  fallback="whatsapp"
                  waMessage={`¡Hola! Me interesan ${contexto.toLowerCase()} ${f.nombre}. ¿Me pueden asesorar?`}
                >
                  <span className="tfk-diagram">
                    <FiltroDiagrama tipo={f.ficha!.diagrama} />
                  </span>
                  <span className="tfk-body">
                    <span className="tfk-name">{f.nombre}</span>
                    <span className="tfk-desc">{f.ficha!.descripcion}</span>
                    <span className="tfk-meta">{f.ficha!.specs}</span>
                    <span className="tfk-cta">
                      {ctaLabel}
                      <span className="tfk-arrow" aria-hidden="true" />
                    </span>
                  </span>
                </CtaProducto>
              ))}
            </div>
          </div>
        );
      })}

      {/* Filtros aún sin ficha (categoría a medio definir): chips clásicos. */}
      {sinFicha.length > 0 && (
        <div className="tfk-group">
          {conFicha.length > 0 && <p className="eyebrow tfk-group-label">Más filtros</p>}
          <FilterList filtros={sinFicha} />
        </div>
      )}
    </div>
  );
}
