// TipoGrid — rejilla visual de tipos en el PLP (patrón AJ Madison /refrigerators/,
// traducido al sistema v2): un mosaico por eje de la taxonomía donde cada tipo se
// reconoce de un vistazo por su diagrama, no por el nombre.
//
// Deliberadamente COMPACTA en copy: solo diagrama + nombre. La descripción y las
// specs viven en la guía (/guias/…/refrigeradores/) — repetirlas aquí crearía dos
// páginas compitiendo por la misma consulta. Por eso el bloque cierra con un
// enlace a la guía en vez de duplicar su copy.
//
// Capa que SOLO existe aquí (en Guías el diagrama se queda limpio): el contenido
// que explica el tipo (ContenidoTipo), revelado junto con el interior.
//
// La barra de ancho comparado y la vista de planta se probaron y se quitaron
// (Carla, 2026-07-29): ensuciaban la tarjeta. El código sigue en el historial.

import Link from "next/link";
import type { FiltroProducto, GrupoFicha } from "@/types/guias";
import FiltroDiagrama from "./FiltroDiagrama";
import DiagramaDefs from "./DiagramaDefs";
import { ContenidoTipo } from "./ContenidoTipo";
import { getFotoTipo } from "@/lib/fotosTipos";
import CorteInstalacion, { esTipoInstalacion } from "./CorteInstalacion";

const GRUPOS: { key: GrupoFicha; label: string }[] = [
  { key: "tipo", label: "Tipo de instalación" },
  { key: "estilo", label: "Diseño" },
];

interface Props {
  filtros: FiltroProducto[];
  /** Slug del tipo elegido (?f=…): se marca como seleccionado. */
  activo?: string;
  /** Ruta del PLP; cada tile enlaza a `<base>?f=<slug>`. */
  base: string;
  /** Ruta de la guía del mismo tipo de producto, para el enlace de ayuda. */
  guia?: string;
  contexto: string;
  /** Nombres de eje que difieren del default (taxonomía → etiquetasGrupos). */
  etiquetas?: Partial<Record<GrupoFicha, string>>;
}

/** "/productos/refrigeradores/?f=french-door" → "french-door" */
function slugDeFiltro(filtro: string): string {
  return filtro.split("?f=")[1] ?? "";
}

export default function TipoGrid({ filtros, base, guia, contexto, activo, etiquetas }: Props) {
  const conFicha = filtros.filter((f) => f.ficha);
  if (conFicha.length === 0) return null;

  return (
    <section className="sec tight tpg-sec">
      <div className="container">
        <DiagramaDefs />
        {GRUPOS.map(({ key, label: labelDefault }) => {
          const label = etiquetas?.[key] ?? labelDefault;
          const grupo = conFicha.filter((f) => f.ficha!.grupo === key);
          if (grupo.length === 0) return null;
          return (
            <div className="tpg-group" key={key}>
              <div className="tpg-head">
                <p className="eyebrow tpg-label">{label}</p>
                <span className="tpg-count figures">{grupo.length} opciones</span>
              </div>
              {/* El eje de instalación tiene pocas opciones (3): sus tarjetas
                  se reparten el ancho completo de la sección, en grande. */}
              <div className={`tpg-grid${key === "tipo" ? " tpg-grid--full" : ""}`}>
                {grupo.map((f) => {
                  const dgm = f.ficha!.diagrama;
                  const slug = slugDeFiltro(f.filtro);
                  const esActivo = slug === activo;
                  // Foto real del tipo (packshot) cuando existe; diagrama como
                  // fallback mientras se completa el set de imágenes.
                  const foto = getFotoTipo(base.replace("/productos/", ""), slug);
                  return (
                    <Link
                      key={f.filtro}
                      // Volver a hacer clic en el tipo activo lo quita: es la
                      // única forma intuitiva de deshacer el filtro desde aquí.
                      href={esActivo ? base : `${base}?f=${slug}`}
                      // Sin scroll-al-tope de Next: el viewport se queda en el
                      // mosaico y ScrollAFiltros baja suave al catálogo — sin
                      // esto el clic "recarga" (salta arriba y vuelve a bajar).
                      scroll={false}
                      className={`tpg-card${esActivo ? " is-active" : ""}`}
                      aria-current={esActivo ? "true" : undefined}
                    >
                      {foto ? (
                        <span
                          className={`tpg-photo${
                            key === "tipo" && esTipoInstalacion(slug) ? " has-corte" : ""
                          }`}
                        >
                          {/* Sin loading=lazy: el mosaico es el contenido primario
                              de la página, justo bajo el hero. */}
                          <img src={foto.src} alt={foto.alt} />
                          {/* Hover: la foto cede al corte lateral animado que
                              explica la instalación (sobresale / al ras / tras
                              panel). Solo tiles de instalación de refrigeración. */}
                          {key === "tipo" && esTipoInstalacion(slug) && (
                            <span className="tpg-corte" aria-hidden="true">
                              <CorteInstalacion tipo={slug} />
                            </span>
                          )}
                        </span>
                      ) : (
                        <span
                          className={`tpg-diagram${dgm === "glass-door" ? " es-cristal" : ""}`}
                        >
                          <FiltroDiagrama tipo={dgm}>
                            <ContenidoTipo tipo={dgm} />
                          </FiltroDiagrama>
                        </span>
                      )}
                      <span className="tpg-name">{f.nombre}</span>
                      {esActivo && <span className="tpg-quitar">Quitar filtro ×</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
        {guia && (
          /* Banner compacto de guía — misma anatomía que .cat-guide del home
             (regla oro + serif con itálica + botón negro + garabato dorado),
             a escala del mosaico para que la guía no pase desapercibida. */
          <div className="tpg-banner">
            <div className="tpg-banner-body">
              <span className="rule-gold" />
              <p>
                ¿No sabes cuál te conviene? No te preocupes,{" "}
                <em>nosotros te guiamos</em>.
              </p>
              <Link href={guia} className="btn btn-primary">
                Guía de {contexto.toLowerCase()}
              </Link>
            </div>
            <span className="tpg-banner-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="6" cy="19" r="2" />
                <circle cx="18" cy="5" r="2" />
                <path d="M12 19h4.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h3.5" />
              </svg>
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
