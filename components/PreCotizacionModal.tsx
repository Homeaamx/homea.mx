"use client";

// PreCotizacionModal — al pulsar "Enviar listado por WhatsApp" se cierra el cajón
// y se abre, al centro y con el fondo oscuro, la pre-cotización con las piezas
// del proyecto (Carla, 2026-10-08). El cliente llena sus datos en el propio
// formato y al final envía por WhatsApp: el mensaje lleva folio, link a la misma
// pre-cotización (/cotizacion?p=…) y las partidas.

import { useMemo, useState } from "react";

import { DATOS_VACIOS, folioDe, type DatosCliente, type PartidaCotizacion } from "@/lib/cotizacion";
import type { Carrito } from "@/lib/shopify/tipos";

import PreCotizacion from "./PreCotizacion";
import { mensajeListado, partidasDe } from "./ProyectoCierre";

interface Props {
  carrito: Carrito;
  onCerrar: () => void;
}

/** Las líneas del carrito en el formato de la pre-cotización (moneda original, sin IVA). */
export function partidasDelCarrito(carrito: Carrito): PartidaCotizacion[] {
  return carrito.lineas.map((l) => ({
    sku: l.sku,
    cantidad: l.cantidad,
    marca: l.marca,
    nombre: l.nombre.split(" — ")[0],
    serie: l.serie,
    descripcion: "",
    imagen: l.imagen,
    ficha: l.ficha,
    moneda: l.cotizacion.moneda,
    lista: l.cotizacion.lista,
    descuento: l.cotizacion.descuento,
    enStock: l.enStock,
  }));
}

export default function PreCotizacionModal({ carrito, onCerrar }: Props) {
  const [datos, setDatos] = useState<DatosCliente>(DATOS_VACIOS);
  const partidas = useMemo(() => partidasDelCarrito(carrito), [carrito]);
  const folio = folioDe(partidasDe(carrito));
  const fechaIso = useMemo(() => new Date().toISOString(), []);
  const listo = datos.nombre.trim().length >= 2 && datos.telefono.trim().length >= 7;
  const wa = mensajeListado(carrito, datos);

  /** El navegador hace el PDF (Imprimir → Guardar como PDF) con el folio como nombre de archivo. */
  function descargarPdf() {
    const titulo = document.title;
    document.title = `Pre-cotizacion HOMEA ${folio}`;
    window.print();
    document.title = titulo;
  }

  return (
    <div className="pc-overlay" role="dialog" aria-modal="true" aria-label={`Pre-cotización ${folio}`} onClick={onCerrar}>
      <div className="pc-modal" onClick={(ev) => ev.stopPropagation()}>
        <button type="button" className="pc-x" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        <PreCotizacion folio={folio} fechaIso={fechaIso} partidas={partidas} datos={datos} editable onDatos={setDatos} />

        <footer className="pc-acciones">
          <p className="pc-acciones-t">
            ¡Llena los campos correspondientes, descarga tu cotización y envíala por WhatsApp. ¡Así de fácil!
          </p>
          <div className="pc-botones">
            <button type="button" className="wl-wa pc-descargar" onClick={descargarPdf} disabled={!listo}>
              Descargar PDF <span className="ar">↓</span>
            </button>
            <a
              className="btn btn-ghost pc-enviar"
              href={wa}
              target="_blank"
              rel="noopener"
              aria-disabled={!listo}
              data-track="whatsapp_click"
              data-label="precotizacion_enviar"
            >
              Enviar por WhatsApp <span className="ar">→</span>
            </a>
            <button type="button" className="pc-volver" onClick={onCerrar}>
              Volver a mi proyecto
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
