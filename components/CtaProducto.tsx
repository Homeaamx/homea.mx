"use client";

// <CtaProducto> — botón ÚNICO para destinos de filtro de producto (PLP).
//
// El destino real (`filtro`, p.ej. "/productos/refrigeradores/?gama=premium") AÚN NO existe:
// la PLP/filtros se construye después. Este componente no rompe el botón:
//
//   • PLP_READY === true   → navega al filtro real (next/link).
//   • PLP_READY === false  → NO navega al filtro (no 404). Según `fallback`:
//        - "soon"     (default): preventDefault + muestra microcopy "Próximamente".
//        - "whatsapp"          : cae al WhatsApp de cotización.
//
// El href real SIEMPRE queda guardado en `data-href`, con clase `data-cta="ver-productos"`,
// para que al activar el PLP (flags.ts → PLP_READY=true) todos los filtros queden vivos
// sin editar este componente ni las guías.

import Link from "next/link";
import { useState } from "react";
import { PLP_READY } from "@/lib/flags";
import { whatsappHref } from "@/lib/whatsapp";

interface Props {
  /** Ruta de filtro real del JSON. */
  filtro: string;
  children: React.ReactNode;
  className?: string;
  /** Qué hacer cuando el PLP aún no existe. */
  fallback?: "soon" | "whatsapp";
  /** Mensaje contextual para el fallback de WhatsApp. */
  waMessage?: string;
}

export default function CtaProducto({
  filtro,
  children,
  className,
  fallback = "soon",
  waMessage,
}: Props) {
  const [soonOpen, setSoonOpen] = useState(false);

  // PLP listo: navegación real al filtro.
  if (PLP_READY) {
    return (
      <Link href={filtro} className={className} data-cta="ver-productos" data-href={filtro}>
        {children}
      </Link>
    );
  }

  // PLP no listo + fallback WhatsApp: cae a cotización (nunca 404).
  if (fallback === "whatsapp") {
    return (
      <a
        href={whatsappHref(waMessage)}
        target="_blank"
        rel="noopener"
        className={className}
        data-cta="ver-productos"
        data-href={filtro}
        data-track="whatsapp_click"
        data-label="cta_producto_fallback"
        title="Próximamente · escríbenos por WhatsApp"
      >
        {children}
      </a>
    );
  }

  // PLP no listo + fallback "soon": no navega; revela microcopy "Próximamente".
  return (
    <span className="cta-soon-wrap">
      <a
        href={filtro}
        className={className}
        data-cta="ver-productos"
        data-href={filtro}
        aria-disabled="true"
        onClick={(e) => {
          e.preventDefault();
          setSoonOpen((v) => !v);
        }}
      >
        {children}
      </a>
      <span className={`cta-soon${soonOpen ? " is-open" : ""}`} role="status">
        Próximamente ·{" "}
        <a
          href={whatsappHref(waMessage)}
          target="_blank"
          rel="noopener"
          data-track="whatsapp_click"
          data-label="cta_soon_whatsapp"
        >
          cotiza por WhatsApp
        </a>
      </span>
    </span>
  );
}
