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
import { srcSet, SIZES_TILE } from "@/lib/imagenResponsiva";
import type { FiltroProducto, GrupoFicha } from "@/types/guias";
import FiltroDiagrama from "./FiltroDiagrama";
import DiagramaDefs from "./DiagramaDefs";
import { ContenidoTipo } from "./ContenidoTipo";
import { getFotoTipo, usaFotos } from "@/lib/fotosTipos";
import CorteInstalacion, { esTipoInstalacion } from "./CorteInstalacion";

const GRUPOS: { key: GrupoFicha; label: string }[] = [
  { key: "tipo", label: "Tipo de instalación" },
  { key: "estilo", label: "Diseño" },
];

interface Props {
  filtros: FiltroProducto[];
  /** Ruta del PLP; cada tile enlaza a `<base>?f=<slug>`. */
  base: string;
  /** Ruta de la guía del mismo tipo de producto, para el enlace de ayuda. */
  guia?: string;
  /** Deep-link a la guía educativa en overlay (p. ej. `<guia>#aprende`). */
  aprendeHref?: string;
  contexto: string;
  /** Nombres de eje que difieren del default (taxonomía → etiquetasGrupos). */
  etiquetas?: Partial<Record<GrupoFicha, string>>;
}

/** "/productos/refrigeradores/?f=french-door" → "french-door" */
function slugDeFiltro(filtro: string): string {
  return filtro.split("?f=")[1] ?? "";
}

export default function TipoGrid({ filtros, base, guia, aprendeHref, contexto, etiquetas }: Props) {
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
                  // Foto real del tipo (packshot) cuando existe. Si la categoría
                  // ya es de foto pero ese tipo aún no la tiene, se deja el HUECO
                  // reservado (misma caja) en vez de caer al diagrama: así el
                  // layout ya es el definitivo y los packshots entran sin mover
                  // nada. El diagrama de línea vive en Guías, no aquí.
                  const plpKey = base.replace("/productos/", "");
                  const foto = getFotoTipo(plpKey, slug);
                  const conFoto = Boolean(foto) || usaFotos(plpKey);
                  const conCorte = key === "tipo" && esTipoInstalacion(slug);
                  return (
                    // <a> plana, no next/Link: la página es estática y el estado
                    // activo (?f=) lo resuelve PlpFiltro en el cliente — clic →
                    // pushState + sync de clases, sin recargar ni saltar al tope.
                    // Volver a hacer clic en el tipo activo lo quita (PlpFiltro
                    // reescribe el href del tile activo a `base`).
                    <a
                      key={f.filtro}
                      href={`${base}?f=${slug}`}
                      data-f={slug}
                      className="tpg-card"
                    >
                      {conFoto ? (
                        <span
                          className={`tpg-photo${conCorte ? " has-corte" : ""}${
                            foto ? "" : " es-pendiente"
                          }`}
                        >
                          {/* Sin loading=lazy: el mosaico es el contenido primario
                              de la página, justo bajo el hero. */}
                          {foto ? (
                            <img src={foto.src} srcSet={srcSet(foto.src)} sizes={SIZES_TILE} alt={foto.alt} loading="lazy" decoding="async" />
                          ) : (
                            <span className="tpg-ph">Foto pendiente</span>
                          )}
                          {/* Hover: la foto cede al corte lateral animado que
                              explica la instalación (sobresale / al ras / tras
                              panel; en campanas, la altura libre sobre la placa). */}
                          {conCorte && (
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
                      {/* Siempre en el DOM (oculta si no está activa) para que la
                          tarjeta no cambie de alto al poner/quitar el filtro. */}
                      <span className="tpg-quitar es-hueco" aria-hidden="true">
                        Quitar filtro ×
                      </span>
                    </a>
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
              <div className="tpg-banner-cta">
                <Link href={guia} className="btn btn-gold">
                  Guía de {contexto.toLowerCase()}
                </Link>
                {aprendeHref && (
                  // El hash #aprende abre el overlay educativo al llegar a la guía
                  // (AprendeCampanas) — el equivalente al botón "Aprende un poco
                  // sobre campanas" del sitio OXATIS.
                  <Link href={aprendeHref} className="btn btn-ghost-light">
                    Aprende a elegir
                  </Link>
                )}
              </div>
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
