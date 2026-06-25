// FilterList — rejilla de filtros de una Subcategoría 2 (p.ej. Refrigeradores).
// Cada filtro enlaza a su filtro PLP de Shopify vía <CtaProducto> (sin 404
// mientras el PLP no exista; cae a WhatsApp). Primera vista de filtros.

import type { FiltroProducto } from "@/types/guias";
import CtaProducto from "./CtaProducto";

export default function FilterList({ filtros }: { filtros: FiltroProducto[] }) {
  return (
    <div className="filter-grid">
      {filtros.map((f) => (
        <CtaProducto
          key={f.filtro}
          filtro={f.filtro}
          className="filter-chip"
          fallback="whatsapp"
        >
          {f.nombre}
        </CtaProducto>
      ))}
    </div>
  );
}
