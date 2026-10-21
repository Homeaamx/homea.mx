// FilterShowcase — patrón "Planos de cocina": fichas de tipo de producto con
// diagrama técnico de línea cuyas puertas se ABREN al hover (interior oro
// champagne), descripción concreta siempre visible y línea de specs revelada.
//
// Se usa en la página de filtros de una Subcategoría 2 cuando sus filtros traen
// `ficha` en la taxonomía; los filtros sin ficha caen a chips (FilterList).
// Patrón completo y checklist para nuevas categorías: docs/PATRON-FICHAS-TIPO.md
//
// Clic en una tarjeta → FichaModal (tarjeta sobre fondo oscuro con la explicación
// técnica, los puntos clave y el botón al catálogo filtrado; Carla, 2026-10-19).
// Cada tarjeta es un enlace a `ficha.catalogo` (sin JS navega directo); las que
// aún no tengan catálogo caen a <CtaProducto> (WhatsApp).

import type { FiltroProducto, GrupoFicha } from "@/types/guias";
import CtaProducto from "./CtaProducto";
import FiltroDiagrama from "./FiltroDiagrama";
import DiagramaDefs from "./DiagramaDefs";
import FilterList from "./FilterList";
import FichaModal from "./FichaModal";
import DestinoBusqueda from "./DestinoBusqueda";
import EtiquetasSinChoque from "./EtiquetasSinChoque";
import { slugFicha } from "@/lib/guiasBusqueda";
import IlustracionTipo, { panelar, tieneIlustracion } from "./IlustracionTipo";
import IlustracionCoccion, { tieneCoccion } from "./IlustracionCoccion";

// Las etiquetas son EXACTAMENTE los nombres de los filtros del PLP (tabla de
// filtros de Carla, 2026-07-28): la guía y el filtro deben nombrar igual el
// mismo eje para que el usuario reconozca dónde está parado.
const GRUPOS: { key: GrupoFicha; label: string }[] = [
  { key: "tipo", label: "Tipo de instalación" },
  { key: "instalacion", label: "Tipo de instalación" },
  { key: "estilo", label: "Diseño" },
];

interface Props {
  filtros: FiltroProducto[];
  /** Nombre del tipo de producto (p.ej. "Refrigeradores") para el CTA y WhatsApp. */
  contexto: string;
  /** Nombres de eje que difieren del default (taxonomía → etiquetasGrupos). */
  etiquetas?: Partial<Record<GrupoFicha, string>>;
}

export default function FilterShowcase({ filtros, contexto, etiquetas }: Props) {
  const conFicha = filtros.filter((f) => f.ficha);
  const sinFicha = filtros.filter((f) => !f.ficha);

  return (
    <div className="tfk">
      <DiagramaDefs />
      <FichaModal contexto={contexto} />
      <DestinoBusqueda />
      <EtiquetasSinChoque />
      {GRUPOS.map(({ key, label: labelDefault }) => {
        const label = etiquetas?.[key] ?? labelDefault;
        const grupo = conFicha.filter((f) => f.ficha!.grupo === key);
        if (grupo.length === 0) return null;
        // Ilustración en escena (Carla, 2026-10-19): tarjeta grande en su propia
        // rejilla, en el grupo "Diseño".
        // También "Tipo de instalación", solo en Refrigeradores: De Piso y
        // Empotrado se repiten en otras categorías con su diagrama de línea.
        // Resto de Refrigeración (2026-10-19): la ficha pide su escena con
        // `ilustracion` y se dibuja en cualquier grupo.
        const escena = (f: FiltroProducto) => f.ficha!.ilustracion ?? f.ficha!.diagrama;
        const conEscena = (f: FiltroProducto) =>
          f.ficha!.ilustracion
            ? tieneIlustracion(f.ficha!.ilustracion) || tieneCoccion(f.ficha!.ilustracion)
            : (key === "estilo" || (key === "tipo" && contexto === "Refrigeradores")) && tieneIlustracion(f.ficha!.diagrama);
        const ilus = grupo.filter(conEscena);
        const linea = grupo.filter((f) => !conEscena(f));
        const tarjeta = (f: FiltroProducto) => {
          const conIlus = conEscena(f);
          const panel = conIlus ? panelar(escena(f)) : null;
          const cuerpo = (
            <>
              {conIlus ? (
                <span className={panel?.inicial ? "tfk-ilus is-panel" : "tfk-ilus"}>
                  {tieneCoccion(escena(f)) ? <IlustracionCoccion tipo={escena(f)} /> : <IlustracionTipo tipo={escena(f)} />}
                  {panel?.boton && (
                    // <span> y no <button>: la tarjeta entera es un <a>. FichaModal
                    // atiende el clic/Enter y alterna el panel de carpintería.
                    <span
                      className="tfk-panelar"
                      role="button"
                      tabIndex={0}
                      aria-pressed={panel.inicial ? "true" : "false"}
                      data-panelar=""
                      style={{ right: panel.right, top: panel.y }}
                    >
                      {panel.inicial ? "Ver en acero" : "Panelar"}
                    </span>
                  )}
                  <span className="tfk-zoom" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <circle cx="10.5" cy="10.5" r="6.5" />
                      <path d="m15.5 15.5 5 5M10.5 7.5v6M7.5 10.5h6" />
                    </svg>
                  </span>
                </span>
              ) : (
                <span className="tfk-diagram">
                  <FiltroDiagrama tipo={f.ficha!.diagrama} />
                </span>
              )}
              <span className="tfk-body">
                <span className="tfk-name">{f.nombre}</span>
                <span className="tfk-desc">{f.ficha!.descripcion}</span>
                <span className="tfk-meta">{f.ficha!.specs}</span>
                <span className="tfk-cta">
                  Conocer más
                  <span className="tfk-arrow" aria-hidden="true" />
                </span>
              </span>
            </>
          );
          return f.ficha!.catalogo ? (
            <a
              key={f.filtro}
              id={`ficha-${slugFicha(f.nombre)}`}
              href={f.ficha!.catalogo}
              className={conIlus ? "tfk-card tfk-card--ilus" : "tfk-card"}
              data-ficha=""
              data-nombre={f.nombre}
              data-grupo={label}
              data-desc={f.ficha!.descripcion}
              data-specs={f.ficha!.specs}
              data-detalle={f.ficha!.detalle ?? ""}
              data-panelable={panel?.boton ? "" : undefined}
            >
              {cuerpo}
            </a>
          ) : (
            <CtaProducto
              key={f.filtro}
              id={`ficha-${slugFicha(f.nombre)}`}
              filtro={f.filtro}
              className="tfk-card"
              fallback="whatsapp"
              waMessage={`¡Hola! Me interesan ${contexto.toLowerCase()} ${f.nombre}. ¿Me pueden asesorar?`}
            >
              {cuerpo}
            </CtaProducto>
          );
        };
        return (
          <div className="tfk-group" key={key}>
            <p className="eyebrow tfk-group-label">{label}</p>
            {ilus.length > 0 && <div className="tfk-grid tfk-grid--ilus">{ilus.map(tarjeta)}</div>}
            {linea.length > 0 && <div className="tfk-grid">{linea.map(tarjeta)}</div>}
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
