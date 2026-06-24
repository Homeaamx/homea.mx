// GuideCard — tarjeta de guía. Presentacional (sin server-only): se usa tanto en
// componentes de servidor como dentro del filtro cliente (GuideTypeFilter).

import Link from "next/link";

export interface GuideCardData {
  titulo: string;
  resumen: string;
  /** slug del tipo de guía (para filtrar). */
  tipo: string;
  /** nombre legible del tipo. */
  tipoNombre: string;
  /** ruta del artículo. */
  href: string;
  /** etiqueta "Categoría / Tipo". */
  etiqueta: string;
}

export default function GuideCard({ card }: { card: GuideCardData }) {
  return (
    <Link className="guide-card" href={card.href} data-tipo={card.tipo}>
      <span className="guide-card-tag">{card.etiqueta}</span>
      <h3 className="guide-card-title">{card.titulo}</h3>
      <p className="guide-card-sum">{card.resumen}</p>
      <span className="guide-card-more">
        Leer guía <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
