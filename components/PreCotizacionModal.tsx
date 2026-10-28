"use client";

// PreCotizacionModal — al pulsar "Enviar listado a un ejecutivo" se cierra el cajón
// y se abre, al centro y con el fondo oscuro, la pre-cotización con las piezas
// del proyecto (Carla, 2026-10-08). El cliente llena sus datos en el propio
// formato y al final descarga el PDF o envía por WhatsApp. Cualquiera de los dos
// guarda la pre-cotización como pedido borrador de Shopify (/api/cotizacion):
// el folio es el del borrador y el mensaje lleva la liga corta /c/<ref>.

import { useMemo, useRef, useState } from "react";

import { DATOS_VACIOS, folioDe, mensajeCotizacion, type DatosCliente, type PartidaCotizacion } from "@/lib/cotizacion";
import type { Carrito } from "@/lib/shopify/tipos";
import { whatsappHref } from "@/lib/whatsapp";

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
    descripcion: l.spec,
    imagen: l.imagen,
    ficha: l.ficha,
    moneda: l.cotizacion.moneda,
    lista: l.cotizacion.lista,
    descuento: l.cotizacion.descuento,
    enStock: l.enStock,
  }));
}

/** Lo que devolvió /api/cotizacion: el borrador ya guardado en Shopify. */
interface Guardada {
  ref: string;
  folio: string;
  fechaIso: string;
  url: string;
  partidas: PartidaCotizacion[];
  /** Partidas + datos con que se guardó: si el cliente cambia algo, se actualiza. */
  huella: string;
}

/** Evento de conversión (GA4 / Google Ads), igual que los enlaces data-track de v2.js. */
function medirWhatsapp(label: string) {
  const w = window as unknown as { gtag?: (...a: unknown[]) => void; dataLayer?: unknown[] };
  w.gtag?.("event", "whatsapp_click", { event_category: "lead", event_label: label, transport_type: "beacon" });
  (w.dataLayer = w.dataLayer || []).push({ event: "whatsapp_click", wa_location: label });
}

export default function PreCotizacionModal({ carrito, onCerrar }: Props) {
  const [datos, setDatos] = useState<DatosCliente>(DATOS_VACIOS);
  const [guardada, setGuardada] = useState<Guardada | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  // Newsletter (Carla, 2026-10-12): casilla opcional, desmarcada por defecto
  // (el consentimiento de marketing tiene que ser explícito).
  const [boletin, setBoletin] = useState(false);
  const suscrito = useRef<string | null>(null);
  const partidasCarrito = useMemo(() => partidasDelCarrito(carrito), [carrito]);
  const p = partidasDe(carrito);
  const huella = JSON.stringify({ p, datos });
  const vigente = guardada && guardada.huella === huella ? guardada : null;
  const fechaIso = useMemo(() => new Date().toISOString(), []);
  // Solo los campos obligatorios (nombre y teléfono) habilitan descargar y
  // enviar; los opcionales pueden quedar vacíos (Carla, 2026-10-10). Sin
  // validar formato: el cliente nos comparte el PDF por WhatsApp, así que el
  // contacto llega de todos modos.
  const listo = datos.nombre.trim() !== "" && datos.telefono.trim() !== "";

  /**
   * Guarda la pre-cotización como pedido borrador de Shopify (una sola vez por
   * versión: si el cliente corrige un dato, se actualiza el mismo borrador). Si
   * Shopify no responde, devuelve null y se usa la liga sin guardar.
   */
  async function guardar(): Promise<Guardada | null> {
    if (vigente) return vigente;
    setOcupado(true);
    setAviso(null);
    try {
      const r = await fetch("/api/cotizacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ p, datos, ref: guardada?.ref }),
      });
      const j = (await r.json()) as Partial<Guardada> & { ok?: boolean };
      if (!j.ok || !j.ref || !j.folio || !j.url || !j.fechaIso || !j.partidas) return null;
      const nueva: Guardada = { ref: j.ref, folio: j.folio, fechaIso: j.fechaIso, url: j.url, partidas: j.partidas, huella };
      setGuardada(nueva);
      return nueva;
    } catch {
      return null;
    } finally {
      setOcupado(false);
    }
  }

  const correoValido = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(datos.correo.trim());

  /** Con la casilla marcada, el correo entra a la lista de HOMEA (/api/lead); una vez por correo, sin esperar. */
  function suscribir() {
    const correo = datos.correo.trim().toLowerCase();
    if (!boletin || !correoValido || suscrito.current === correo) return;
    suscrito.current = correo;
    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ correo, nombre: datos.nombre.trim(), ciudad: datos.ciudad.trim(), consiente: true, origen: "pre-cotizacion" }),
    }).catch(() => {});
    const w = window as unknown as { dataLayer?: unknown[] };
    (w.dataLayer = w.dataLayer || []).push({ event: "newsletter_signup", newsletter_location: "newsletter-pre-cotizacion" });
  }

  /** El navegador hace el PDF (Imprimir → Guardar como PDF) con el folio como nombre de archivo. */
  async function descargarPdf() {
    suscribir();
    const g = await guardar();
    const folio = g?.folio ?? folioDe(p);
    if (!g) setAviso("No pudimos registrar tu pre-cotización; el PDF sale con un folio provisional.");
    // Un cuadro para que el documento ya pinte el folio definitivo antes de imprimir.
    await new Promise((r) => setTimeout(r, 60));
    const titulo = document.title;
    document.title = `Pre-cotizacion HOMEA ${folio}`;
    window.print();
    document.title = titulo;
  }

  /**
   * La ventana se abre en el mismo clic (si se abre después de esperar a Shopify,
   * el navegador la bloquea) y se manda a WhatsApp en cuanto hay liga.
   */
  async function enviar() {
    const ventana = window.open("", "_blank");
    medirWhatsapp("precotizacion_enviar");
    suscribir();
    const g = await guardar();
    // Respaldo: la liga sin guardar de siempre, para que el lead nunca se pierda.
    const destino = g ? whatsappHref(mensajeCotizacion(g.url)) : mensajeListado(carrito, datos);
    if (ventana) ventana.location.href = destino;
    else window.location.href = destino;
  }

  const doc = vigente ?? null;

  return (
    <div className="pc-overlay" role="dialog" aria-modal="true" aria-label={`Pre-cotización ${doc?.folio ?? ""}`.trim()} onClick={onCerrar}>
      <div className="pc-modal" onClick={(ev) => ev.stopPropagation()}>
        <button type="button" className="pc-x" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        <PreCotizacion
          folio={doc?.folio ?? "Por asignar"}
          fechaIso={doc?.fechaIso ?? fechaIso}
          partidas={doc?.partidas ?? partidasCarrito}
          datos={datos}
          editable
          onDatos={setDatos}
        />

        <footer className="pc-acciones">
          <p className="pc-acciones-t">
            Llena tus datos, descarga tu pre-cotización y envíala por WhatsApp. ¡Así de fácil!
          </p>
          {!listo ? (
            <p className="pc-hint" role="status">
              Llena los campos obligatorios (nombre y teléfono) para descargar o enviar.
            </p>
          ) : null}
          <label className="pc-boletin">
            <input type="checkbox" checked={boletin} onChange={(ev) => setBoletin(ev.target.checked)} />
            <span>
              Quiero recibir promociones y novedades de HOMEA en mi correo.{" "}
              <a href="/aviso-de-privacidad" target="_blank" rel="noopener">
                Aviso de privacidad
              </a>
            </span>
          </label>
          {boletin && !correoValido ? (
            <p className="pc-hint" role="status">
              Escribe tu correo en la pre-cotización para suscribirte.
            </p>
          ) : null}
          {aviso ? (
            <p className="pc-hint" role="status">
              {aviso}
            </p>
          ) : null}
          <div className="pc-botones">
            <button type="button" className="wl-wa pc-descargar" onClick={descargarPdf} disabled={!listo || ocupado}>
              {ocupado ? "Registrando…" : "Descargar PDF"} <span className="ar">↓</span>
            </button>
            <button type="button" className="btn btn-ghost pc-enviar" onClick={enviar} disabled={!listo || ocupado}>
              Enviar por WhatsApp a un ejecutivo <span className="ar">→</span>
            </button>
            <button type="button" className="pc-volver" onClick={onCerrar}>
              Volver a mi proyecto
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
