"use client";

// AvisoCierre — el aviso que se ve ANTES de salir del proyecto (Carla, 2026-11-04):
// al pulsar "Pagar" (con o sin piezas en dólares) y al pulsar "Enviar listado a un
// ejecutivo". Va al centro, con el fondo oscuro, en rojo oscuro y con el triángulo
// de alerta. El botón principal sigue el camino que el cliente eligió (checkout de
// Shopify o pre-cotización); "Volver a mi proyecto" o Escape lo cierran sin salir.
//
// Se monta en <body> con un portal: el cajón lateral tiene transform y un
// position: fixed adentro quedaría atrapado en él.

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import ConNegritas from "./ConNegritas";

export type TipoAviso = "pago-usd" | "pago" | "cotizacion" | "tc-vencido";

/** Textos de Carla, con redacción pulida (2026-11-04); lo que va entre **…** sale en negritas (2026-11-05). */
const AVISOS: Record<TipoAviso, { texto: string; pie?: string; boton: string }> = {
  "pago-usd": {
    texto:
      "Uno o más de tus productos tienen **precio en dólares**. Te recomendamos **contactar a un ejecutivo** para que te proporcione la información completa de tu producto, los **tiempos de entrega estimados** y **el tipo de cambio vigente**, y así evitar cualquier imprevisto.",
    pie: "Si estás de acuerdo, haz clic en «Continuar con pago».",
    boton: "Continuar con pago",
  },
  pago: {
    texto:
      "Antes de continuar con tu compra, te recomendamos **contactar a un ejecutivo de ventas** para que te proporcione un **tiempo de entrega estimado** más preciso y así evitar cualquier imprevisto.",
    pie: "Si deseas continuar con tu compra, haz clic en «Continuar con pago».",
    boton: "Continuar con pago",
  },
  // Pagar con el tipo de cambio de un día anterior (Carla, 2026-11-05): no se paga, va al ejecutivo.
  "tc-vencido": {
    texto:
      "Uno o más de tus productos tienen **precio en dólares** y se debe **consultar el tipo de cambio del día de hoy** para poder proceder al pago. Enviaremos tu pedido a **un ejecutivo** para que te proporcione la información completa de tu producto, los **tiempos de entrega estimados** y **el tipo de cambio vigente**, y así evitar cualquier imprevisto.",
    boton: "Continuar con pre-cotización",
  },
  cotizacion: {
    texto:
      "Uno o más de los productos seleccionados tienen **precio en dólares** o **superan el límite de compra en línea**. Para tu protección, necesitamos confirmarte el **tipo de cambio vigente** y **los tiempos de entrega estimados**. A continuación, llena tus datos y enviaremos tu pre-cotización a un ejecutivo.",
    boton: "Continuar con pre-cotización",
  },
};

interface Props {
  tipo: TipoAviso;
  /** Destino del botón principal cuando es un enlace (checkout de Shopify). */
  href?: string;
  /** Acción del botón principal cuando no es enlace (abrir la pre-cotización). */
  onContinuar?: () => void;
  /** Salida a un ejecutivo en los avisos de pago (abre la pre-cotización). */
  onEjecutivo?: () => void;
  onCerrar: () => void;
}

const Alerta = () => (
  <svg className="aviso-cierre-icono" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3 22 20.5H2L12 3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M12 9.5v5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="17.6" r="1.05" fill="currentColor" />
  </svg>
);

export default function AvisoCierre({ tipo, href, onContinuar, onEjecutivo, onCerrar }: Props) {
  const aviso = AVISOS[tipo];
  const principal = useRef<HTMLAnchorElement & HTMLButtonElement>(null);

  useEffect(() => {
    principal.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCerrar();
      }
    };
    // En captura: Escape cierra el aviso, no el cajón que está debajo.
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onCerrar]);

  return createPortal(
    <div className="pc-overlay aviso-cierre-overlay" onClick={onCerrar}>
      <div
        className="aviso-cierre"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="aviso-cierre-titulo"
        aria-describedby="aviso-cierre-texto"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="pc-x" aria-label="Cerrar" onClick={onCerrar}>
          ×
        </button>
        <div className="aviso-cierre-cabeza">
          <Alerta />
          <h2 id="aviso-cierre-titulo">Antes de continuar</h2>
        </div>
        <p id="aviso-cierre-texto" className="aviso-cierre-texto">
          <ConNegritas texto={aviso.texto} />
        </p>
        {aviso.pie ? <p className="aviso-cierre-pie">{aviso.pie}</p> : null}
        <div className="aviso-cierre-acciones">
          {href ? (
            <a ref={principal} className="wl-wa cart-checkout aviso-cierre-boton" href={href} rel="noopener">
              {aviso.boton} <span className="ar">→</span>
            </a>
          ) : (
            <button ref={principal} type="button" className="wl-wa cart-checkout aviso-cierre-boton" onClick={onContinuar}>
              {aviso.boton} <span className="ar">→</span>
            </button>
          )}
          <div className="aviso-cierre-otras">
            {onEjecutivo ? (
              <button type="button" className="cart-aviso-link" onClick={onEjecutivo}>
                Prefiero hablar con un ejecutivo
              </button>
            ) : null}
            <button type="button" className="cart-aviso-link" onClick={onCerrar}>
              Volver a mi proyecto
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
