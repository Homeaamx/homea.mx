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
  children?: React.ReactNode;
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
  children,
}: Props) {
  const photo = Boolean(bgImage);
  const cls = photo
    ? `page-hero page-hero--photo${bgFlip ? " page-hero--flip" : ""}`
    : "page-hero";
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
      <div className="container">
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
      </div>
    </header>
  );
}
