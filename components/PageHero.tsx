// PageHero — encabezado de página (estilo .page-hero del design system v2):
// migas + eyebrow + H1 serif + subtítulo. Reutilizado por índices y artículos.

import type { Crumb } from "@/lib/guias";
import Breadcrumb from "./Breadcrumb";

interface Props {
  crumbs: Crumb[];
  eyebrow?: string;
  /** Permite cursivas vía dangerouslySetInnerHTML o texto plano. */
  title: React.ReactNode;
  sub?: string;
  children?: React.ReactNode;
}

export default function PageHero({ crumbs, eyebrow, title, sub, children }: Props) {
  return (
    <header className="page-hero">
      <div className="container">
        <Breadcrumb crumbs={crumbs} />
        {eyebrow && (
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            {eyebrow}
          </div>
        )}
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
        {children}
      </div>
    </header>
  );
}
