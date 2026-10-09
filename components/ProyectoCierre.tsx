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

import { DATOS_VACIOS, folioDe, queryCotizacion, serializarPartidas, totalesPorMoneda, type DatosCliente } from "@/lib/cotizacion";
import type { Aviso, Carrito, Dinero } from "@/lib/shopify/tipos";
import { formatearDinero } from "@/lib/shopify/tipos";
import { SITE_URL } from "@/lib/site";
import { whatsappHref } from "@/lib/whatsapp";

import { useCarrito } from "./CarritoContexto";
import { partidasDelCarrito } from "./PreCotizacionModal";

interface Props {
  carrito: Carrito;
  aviso?: Aviso;
  ocupado: boolean;
}

const fecha = () =>
  new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "long", year: "numeric" }).format(new Date());

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

/** Partidas del proyecto en el formato de la cotización (SKU:cantidad). */
export function partidasDe(carrito: Carrito): string {
  return serializarPartidas(carrito.lineas.map((l) => ({ sku: l.sku, cantidad: l.cantidad })));
}

/**
 * Listado que recibe el vendedor: folio y link a la cotización preliminar, los
 * datos del cliente y una partida por línea con modelo, cantidad y precio
 * público, más los totales. Se arma con lo que el servidor devolvió: en el
 * navegador no se calcula ni un peso.
 */
export function mensajeListado(carrito: Carrito, datos: DatosCliente): string {
  if (!carrito.lineas.length) return whatsappHref();
  const p = partidasDe(carrito);
  const folio = folioDe(p);
  const link = `${origen()}/cotizacion?${queryCotizacion(
    carrito.lineas.map((l) => ({ sku: l.sku, cantidad: l.cantidad })),
    datos,
  )}`;
  const partidas = carrito.lineas.map((l, i) => {
    const serie = l.serie ? ` (${l.serie})` : "";
    const estado = l.enStock ? "En stock" : "Bajo pedido";
    return `${i + 1}. ${l.marca} · ${l.nombre.split(" — ")[0]}${serie}\n   Modelo ${l.sku} · ${l.cantidad} pza${l.cantidad > 1 ? "s" : ""} · ${formatearDinero(l.precioPublico.venta)} c/u IVA incl. · ${estado}`;
  });
  const quien = [
    datos.nombre,
    datos.telefono ? `Tel. ${datos.telefono}` : "",
    [datos.ciudad, datos.cp].filter(Boolean).join(" "),
    datos.correo,
    datos.proyecto ? `Proyecto: ${datos.proyecto}` : "",
  ].filter(Boolean);
  const n2 = (x: number) => new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x);
  const totales = [
    `Subtotal (precio de venta, sin IVA): ${formatearDinero(carrito.subtotalLista)}`,
    `Ahorro: −${formatearDinero(carrito.ahorro)}`,
    `IVA (16 %): ${formatearDinero(carrito.ivaEstimado)}`,
    `${hayDolares(carrito) ? "Total estimado" : "Total en pesos"}: ${formatearDinero(carrito.totalEstimado)}`,
    ...totalesPorMoneda(partidasDelCarrito(carrito)).flatMap((t) => [
    `Totales en ${t.moneda === "MXN" ? "pesos" : "dólares"} (${t.moneda}): ahorro ${n2(t.ahorro)} · subtotal ${n2(t.subtotal)} · IVA ${n2(t.iva)} · total ${n2(t.total)}`,
  ]),
  ];
  const texto = [
    `Hola, les envío mi pre-cotización HOMEA ${folio} (${fecha()}):`,
    link,
    ...(quien.length ? ["", quien.join(" · ")] : []),
    "",
    ...partidas,
    "",
    ...totales,
    "Se me proporcionará un tipo de cambio vigente y tiempos de entrega estimados.",
  ];
  return whatsappHref(texto.join("\n"));
}

/** Explicación del bloqueo. Nunca se falla en silencio: se dice qué pasa. */
function textoBloqueo(carrito: Carrito): string | null {
  switch (carrito.bloqueo) {
    case "moneda-incoherente":
      return "Precio por confirmar: una pieza en dólares no tiene su precio en pesos al día. Un especialista te confirma el total.";
    case "tienda-con-password":
      return "El pago en línea está en preparación. Cierra tu proyecto con un especialista por WhatsApp.";
    default:
      return null;
  }
}

/**
 * Comentarios al pie de los totales (Carla, 2026-10-08, con el Excel REGLAS DE
 * COMPRA POR MARCA como referencia). Exactamente cuatro casos:
 *   · todo en stock                     → Pagar, sin comentario.
 *   · todo se compra, todo en pesos     → Pagar + tiempo de entrega puede variar.
 *   · todo se compra, hay dólares       → Pagar + se cobra al TC del día, se
 *                                         recomienda cotizar con un ejecutivo.
 *   · algo se cotiza (marca / monto)    → Enviar listado por WhatsApp + totales al
 *                                         TC del día, el listado va a un ejecutivo.
 */
export function notasDelProyecto(carrito: Carrito): string[] {
  if (!carrito.lineas.length) return [];
  if (carrito.modo === "cotizacion") {
    return [
      "Totales con el tipo de cambio al día, tu listado se enviará a un ejecutivo de ventas para confirmar montos y tiempos estimados de entrega.",
    ];
  }
  if (carrito.lineas.every((l) => l.enStock)) return [];
  if (hayDolares(carrito)) {
    return [
      "Las piezas en dólares se cobran en pesos al tipo de cambio del día, se recomienda cotizar con un ejecutivo.",
    ];
  }
  return ["Tu tiempo estimado de entrega puede variar de acuerdo a los productos seleccionados."];
}

const Precio = ({ d, pendiente }: { d: Dinero; pendiente: boolean }) => (
  <span className={`figures${pendiente ? " is-pendiente" : ""}`}>{formatearDinero(d)}</span>
);

export default function ProyectoCierre({ carrito, aviso, ocupado }: Props) {
  const ctx = useCarrito();

  const vacio = carrito.lineas.length === 0;
  const bloqueo = textoBloqueo(carrito);
  const dolares = hayDolares(carrito);
  const seCotiza = carrito.modo === "cotizacion";
  const puedePagar = !seCotiza && Boolean(carrito.checkoutUrl) && !carrito.bloqueo && !vacio;
  const wa = mensajeListado(carrito, DATOS_VACIOS);
  const notas = vacio ? [] : notasDelProyecto(carrito);

  if (vacio) return null;

  return (
    <div className="proy-cierre">
      {/* Totales (Carla, 2026-10-08): subtotal a precio de venta − ahorro + IVA = total. */}
      <div className="proy-totales">
        <div className="cart-subtotal">
          <span>Subtotal</span>
          <Precio d={carrito.subtotalLista} pendiente={ocupado} />
        </div>
        <div className="cart-subtotal proy-ahorro">
          <span>Ahorro</span>
          <span className={`figures${ocupado ? " is-pendiente" : ""}`}>−{formatearDinero(carrito.ahorro)}</span>
        </div>
        <div className="cart-subtotal">
          <span>IVA (16 %)</span>
          <Precio d={carrito.ivaEstimado} pendiente={ocupado} />
        </div>
        <div className="cart-subtotal proy-total">
          <span>{dolares ? "Total estimado" : "Total en pesos"}</span>
          <span className={`cart-subtotal-num figures${ocupado ? " is-pendiente" : ""}`}>
            {formatearDinero(carrito.totalEstimado)}
          </span>
        </div>
      </div>

      {notas.length ? (
        <div className="proy-notas">
          {notas.map((n) => (
            <p className="cart-tax-note" key={n}>
              {n}
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
        <button type="button" className="wl-wa cart-checkout" onClick={() => ctx?.abrirCotizacion()}>
          Enviar listado por WhatsApp <span className="ar">→</span>
        </button>
      ) : puedePagar ? (
        <a className="wl-wa cart-checkout" href={carrito.checkoutUrl ?? undefined} rel="noopener">
          Pagar <span className="ar">→</span>
        </a>
      ) : (
        <>
          <span className="wl-wa cart-checkout" aria-disabled="true">
            Pagar <span className="ar">→</span>
          </span>
          {bloqueo ? (
            <p className="cart-aviso" role="status">
              {bloqueo}{" "}
              <a href={wa} target="_blank" rel="noopener" data-track="whatsapp_click" data-label="proyecto_whatsapp">
                Enviar listado por WhatsApp
              </a>
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
