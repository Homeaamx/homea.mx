"use client";

// ProyectoCierre — el cierre de "Mi proyecto": totales, notas según la regla,
// y la salida (Pagar en Shopify o enviar el listado al ejecutivo por WhatsApp
// con el formulario de datos del cliente). Lo comparten el cajón lateral
// (CarritoDrawer) y la página /mi-proyecto (MiProyectoPagina), así los dos
// dicen exactamente lo mismo.
//
// Regla (Excel REGLAS DE COMPRA POR MARCA, Carla 2026-10-06/08; la evalúa el
// servidor en lib/shopify/normalizar.ts): (1) en stock/oferta se compra;
// (2) marca "solo cotizar" se cotiza; (3) más de $100,000 MXN con IVA se cotiza;
// (4) lo demás se compra. Si algo se cotiza, el proyecto completo va al vendedor.
// La moneda de lista NO decide: una pieza en dólares en stock se paga en línea.
//
// Comentarios al pie: cuatro casos exactos de Carla (2026-10-08), documentados
// en docs/REGLAS-CARRITO-Y-COMENTARIOS.md.

import { useState } from "react";

import { tonoDe } from "@/lib/coloresMarca";
import { mensajeCotizacion, queryCotizacion, serializarPartidas, type DatosCliente } from "@/lib/cotizacion";
import type { Aviso, Carrito, Dinero } from "@/lib/shopify/tipos";
import { formatearDinero } from "@/lib/shopify/tipos";
import { SITE_URL } from "@/lib/site";
import { whatsappHref } from "@/lib/whatsapp";

import AvisoCierre, { type TipoAviso } from "./AvisoCierre";
import ConNegritas from "./ConNegritas";
import { useCarrito } from "./CarritoContexto";

interface Props {
  carrito: Carrito;
  aviso?: Aviso;
  ocupado: boolean;
}

/** ¿Alguna pieza se vende en dólares? Decide el título del total y las notas. */
export function hayDolares(carrito: Carrito): boolean {
  return carrito.lineas.some((l) => l.precioPublico.venta.moneda === "USD");
}

/** Origen del link de la cotización: el del sitio; en local o preview, el del navegador. */
function origen(): string {
  if (typeof window !== "undefined" && /localhost|127\.0\.0\.1|vercel\.app/.test(window.location.host)) {
    return window.location.origin;
  }
  return SITE_URL;
}

/** Partida de la cotización de una línea del proyecto: SKU, cantidad y tono de Standard Color. */
const refDeLinea = (l: Carrito["lineas"][number]) => ({ sku: l.sku, cantidad: l.cantidad, tono: tonoDe(l.tono)?.codigo });

/** Partidas del proyecto en el formato de la cotización (SKU:cantidad[:tono]). */
export function partidasDe(carrito: Carrito): string {
  return serializarPartidas(carrito.lineas.map(refDeLinea));
}

/**
 * Mensaje que recibe el vendedor: el MISMO texto que manda la página /cotizacion
 * (`mensajeCotizacion`): saludo y link a la pre-cotización con las piezas y los
 * datos del cliente.
 */
export function mensajeListado(carrito: Carrito, datos: DatosCliente): string {
  if (!carrito.lineas.length) return whatsappHref();
  const link = `${origen()}/cotizacion?${queryCotizacion(
    carrito.lineas.map(refDeLinea),
    datos,
  )}`;
  return whatsappHref(mensajeCotizacion(link));
}

/** Explicación del bloqueo. Nunca se falla en silencio: se dice qué pasa. */
function textoBloqueo(carrito: Carrito): string | null {
  switch (carrito.bloqueo) {
    case "moneda-incoherente":
      return "**Precio por confirmar:** una pieza en dólares no tiene su **precio en pesos al día**. Un especialista te confirma el total.";
    case "tienda-con-password":
      return "El **pago en línea está en preparación**. Cierra tu proyecto con **un especialista por WhatsApp**.";
    default:
      return null;
  }
}

/**
 * Comentarios al pie de los totales (Carla, 2026-10-08, con el Excel REGLAS DE
 * COMPRA POR MARCA como referencia). Exactamente cuatro casos:
 *   · todo en stock                     → Pagar, sin comentario.
 *   · todo se compra, todo en pesos     → Pagar + tiempo de entrega puede variar.
 *   · todo se compra, hay dólares       → Pagar + "Tipo de cambio al <día>", se
 *                                         cobra al TC del día, se debe cotizar
 *                                         con un ejecutivo (2026-11-04).
 *   · algo se cotiza (marca / monto)    → Enviar listado a un ejecutivo + totales al
 *                                         TC del día, el listado va a un ejecutivo.
 */
export function notasDelProyecto(carrito: Carrito): string[] {
  if (!carrito.lineas.length) return [];
  if (carrito.modo === "cotizacion") {
    return [
      `Totales con el **tipo de cambio ${carrito.tipoCambioDia ? `al ${carrito.tipoCambioDia}` : "al día"}**, tu listado se enviará a **un ejecutivo de ventas** para confirmar montos y **tiempos estimados de entrega**.`,
    ];
  }
  // Tipo de cambio de un día anterior (Carla, 2026-11-05): el comentario dice
  // por qué no se puede pagar todavía; "Pagar" abre el aviso tc-vencido.
  if (carrito.tipoCambioVencido) {
    const varias = carrito.lineas.filter((l) => l.tipoCambio !== null).length > 1;
    return [
      `${varias ? "Tus productos tienen" : "Tu producto tiene"} **el tipo de cambio ${carrito.tipoCambioDia ? `del día ${carrito.tipoCambioDia}` : "de un día anterior"}**, necesitas **contactar a un ejecutivo** para que te proporcione el precio con **el tipo de cambio del día de hoy**.`,
    ];
  }
  if (carrito.lineas.every((l) => l.enStock)) return [];
  if (hayDolares(carrito)) {
    // Carla, 2026-11-04: el comentario dice de qué día es el tipo de cambio.
    return [
      `${carrito.tipoCambioDia ? `**Tipo de cambio al ${carrito.tipoCambioDia}.** ` : ""}Las **piezas en dólares** se cobran en pesos al **tipo de cambio del día**, se recomienda **cotizar con un ejecutivo**.`,
    ];
  }
  return ["Tu **tiempo estimado de entrega** puede variar de acuerdo a los productos seleccionados."];
}

const Precio = ({ d, pendiente }: { d: Dinero; pendiente: boolean }) => (
  <span className={`figures es-precio${pendiente ? " is-pendiente" : ""}`}>{formatearDinero(d)}</span>
);

export default function ProyectoCierre({ carrito, aviso, ocupado }: Props) {
  const ctx = useCarrito();
  // Aviso antes de salir del proyecto (Carla, 2026-11-04): Pagar y Enviar listado
  // pasan primero por <AvisoCierre>; su botón principal sigue el camino elegido.
  const [confirmar, setConfirmar] = useState<TipoAviso | null>(null);

  const vacio = carrito.lineas.length === 0;
  const bloqueo = textoBloqueo(carrito);
  const dolares = hayDolares(carrito);
  const seCotiza = carrito.modo === "cotizacion";
  const puedePagar = !seCotiza && Boolean(carrito.checkoutUrl) && !carrito.bloqueo && !vacio;
  const notas = vacio ? [] : notasDelProyecto(carrito);

  if (vacio) return null;

  return (
    <div className="proy-cierre">
      {/* Totales (Carla, 2026-10-09): TODO con IVA. Subtotal a precio de lista con
          IVA − ahorro con IVA = total; el IVA se informa aparte, sin sumarse. */}
      <div className="proy-totales">
        <div className="cart-subtotal">
          <span>Subtotal en pesos</span>
          <Precio d={carrito.subtotalConIva} pendiente={ocupado} />
        </div>
        <div className="cart-subtotal proy-ahorro">
          <span>Ahorro en pesos</span>
          <span className={`figures es-precio${ocupado ? " is-pendiente" : ""}`}>−{formatearDinero(carrito.ahorroConIva)}</span>
        </div>
        <div className="cart-subtotal proy-total">
          <span>{dolares ? "Total estimado" : "Total en pesos"}</span>
          <span className={`cart-subtotal-num figures es-precio${ocupado ? " is-pendiente" : ""}`}>
            {formatearDinero(carrito.totalEstimado)}
          </span>
        </div>
        <div className="cart-subtotal proy-tc">
          <span>Incluye IVA 16 %</span>
          <Precio d={carrito.ivaEstimado} pendiente={ocupado} />
        </div>
        {/* Las piezas en dólares se suman en pesos: aquí se dice con qué tipo de
            cambio (el FIX con el que Shopify tiene escritos los pesos), para que
            el salto USD → MXN sea trazable (2026-10-09). */}
        {dolares && carrito.tipoCambio ? (
          <div className="cart-subtotal proy-tc">
            <span>Tipo de cambio aplicado</span>
            <span className="figures">
              1 USD = {new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(carrito.tipoCambio)} MXN
            </span>
          </div>
        ) : null}
      </div>

      {notas.length ? (
        <div className="proy-notas">
          {notas.map((n) => (
            <p className="cart-tax-note" key={n}>
              <ConNegritas texto={n} />
            </p>
          ))}
        </div>
      ) : null}

      {aviso ? (
        <p className={`cart-aviso${aviso.tipo === "error" ? " is-error" : ""}`} role="status">
          {aviso.mensaje}
          {aviso.whatsapp ? (
            <>
              {" "}
              <a href={aviso.whatsapp} target="_blank" rel="noopener">
                Escríbenos
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      {seCotiza ? (
        // Abre la pre-cotización al centro (cierra el cajón): ahí van los datos del cliente.
        <button type="button" className="wl-wa cart-checkout" onClick={() => setConfirmar("cotizacion")}>
          Enviar listado a un ejecutivo <span className="ar">→</span>
        </button>
      ) : puedePagar ? (
        <a
          className="wl-wa cart-checkout"
          href={carrito.checkoutUrl ?? undefined}
          rel="noopener"
          onClick={(e) => {
            e.preventDefault();
            setConfirmar(dolares ? "pago-usd" : "pago");
          }}
        >
          Pagar <span className="ar">→</span>
        </a>
      ) : (
        <>
          {carrito.bloqueo === "tc-vencido" ? (
            // Con el tipo de cambio vencido el botón dice "Continuar" (aún no se puede
            // pagar) y abre el aviso que lleva a la pre-cotización (Carla, 2026-11-05).
            <button type="button" className="wl-wa cart-checkout" onClick={() => setConfirmar("tc-vencido")}>
              Continuar <span className="ar">→</span>
            </button>
          ) : (
            <span className="wl-wa cart-checkout" aria-disabled="true">
              Pagar <span className="ar">→</span>
            </span>
          )}
          {/* Con el tipo de cambio vencido solo sale el aviso al pulsar Pagar (Carla, 2026-11-05). */}
          {carrito.bloqueo !== "tc-vencido" && bloqueo ? (
            <p className="cart-aviso" role="status">
              <ConNegritas texto={bloqueo} />{" "}
              {/* Pasa por la pre-cotización: así también queda como borrador en Shopify. */}
              <button type="button" className="cart-aviso-link" onClick={() => ctx?.abrirCotizacion()}>
                Enviar listado a un ejecutivo
              </button>
            </p>
          ) : null}
        </>
      )}

      {confirmar ? (
        <AvisoCierre
          tipo={confirmar}
          href={confirmar === "cotizacion" || confirmar === "tc-vencido" ? undefined : (carrito.checkoutUrl ?? undefined)}
          onContinuar={() => {
            setConfirmar(null);
            ctx?.abrirCotizacion();
          }}
          onEjecutivo={
            confirmar === "cotizacion" || confirmar === "tc-vencido"
              ? undefined
              : () => {
                  setConfirmar(null);
                  ctx?.abrirCotizacion();
                }
          }
          onCerrar={() => setConfirmar(null)}
        />
      ) : null}
    </div>
  );
}
