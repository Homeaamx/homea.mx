// PageHero — encabezado de página (estilo .page-hero del design system v2):
// migas + eyebrow + H1 serif + subtítulo. Reutilizado por índices y artículos.

import type { Crumb } from "@/lib/guias";
import Breadcrumb from "./Breadcrumb";

interface Props {
  crumbs: Crumb[];
  eyebrow?: string;
  /** Muestra la línea de oro de marca en lugar de un eyebrow de texto. */
  rule?: boolean;
  /** Permite cursivas vía dangerouslySetInnerHTML o texto plano. */
  title: React.ReactNode;
  sub?: string;
  /** Foto de fondo (ruta en /public). El texto se monta encima con velo de legibilidad. */
  bgImage?: string;
  /** Posición de la foto de fondo (default "center"). */
  bgPosition?: string;
  /** Espejo horizontal de la foto (el texto queda normal). */
  bgFlip?: boolean;
  /** Arte de línea de fondo (diagrama del equipo) sobre espresso — sin foto.
   *  Se usa donde no existe activo fotográfico por categoría; ver theme.css
   *  (.page-hero--plano). Ignorado si hay bgImage. */
  art?: React.ReactNode;
  /** Fuerza el fondo espresso aunque no haya arte (p. ej. cuando el hueco
   *  derecho lo ocupa un `aside`). Implícito si se pasa `art`. */
  plano?: boolean;
  children?: React.ReactNode;
  /** Columna derecha del hero (p. ej. tarjeta "Aprende sobre campanas"). */
  aside?: React.ReactNode;
}

export default function PageHero({
  crumbs,
  eyebrow,
  rule,
  title,
  sub,
  bgImage,
  bgPosition,
  bgFlip,
  art,
  plano: planoProp,
  children,
  aside,
}: Props) {
  const photo = Boolean(bgImage);
  const plano = !photo && (Boolean(art) || Boolean(planoProp));
  const cls = photo
    ? `page-hero page-hero--photo${bgFlip ? " page-hero--flip" : ""}`
    : plano
      ? "page-hero page-hero--plano"
      : "page-hero";
  const main = (
    <>
      <Breadcrumb crumbs={crumbs} />
      {eyebrow && (
        <div className="eyebrow" style={{ marginBottom: 18 }}>
          {eyebrow}
        </div>
      )}
      {rule && <span className="rule-gold" style={{ marginBottom: 22 }} />}
      <h1>{title}</h1>
      {sub && <p className="sub">{sub}</p>}
      {children}
    </>
  );
  return (
    <header
      className={cls}
      style={
        photo
          ? {
              backgroundImage: `url('${bgImage}')`,
              backgroundPosition: bgPosition ?? "center",
            }
          : undefined
      }
    >
      {photo && <div className="page-hero__veil" aria-hidden="true" />}
      {plano && art && (
        <div className="page-hero__art" aria-hidden="true">
          {art}
        </div>
      )}
      <div className="container">
        {aside ? (
          <div className="hero-split">
            <div className="hero-split-main">{main}</div>
            <div className="hero-split-aside">{aside}</div>
          </div>
        ) : (
          main
        )}
      </div>
    </header>
  );
}
