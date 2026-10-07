"use client";

// CarritoDrawer — el cajón lateral de "Mi proyecto" (modelo Artexa, Carla 2026-10-06).
//
// El proyecto ES el carrito de Shopify: toda pieza entra. Al cerrar, el servidor
// ya dijo cómo (`carrito.modo`):
//   · `checkout`   → todas cumplen la regla marca + monto + stock → pago en Shopify.
//   · `cotizacion` → alguna se cotiza → el proyecto completo va al vendedor por
//                    WhatsApp con el formato de cotización (modelo, cantidad,
//                    precio público y totales). Los datos del cliente llegan en
//                    una fase posterior (formulario antes de enviar).
//
// Reutiliza el CSS del design system v2 (`styles/theme.css`, bloques .wl-* /
// .cart-* / .proy-*). Ojo con `hidden`: `.wl-drawer` tiene `display:flex`, así
// que el cajón se esconde con `transform`; el atributo solo lo saca del árbol de
// accesibilidad y por eso además va `inert` cuando está cerrado.

import type { Aviso, Carrito, Dinero, LineaCarrito } from "@/lib/shopify/tipos";
import { formatearDinero } from "@/lib/shopify/tipos";
import { whatsappHref } from "@/lib/whatsapp";

interface Props {
  carrito: Carrito;
  aviso?: Aviso;
  abierto: boolean;
  ocupado: boolean;
  onCerrar: () => void;
  onCantidad: (linea: LineaCarrito, cantidad: number) => void;
  onQuitar: (linea: LineaCarrito) => void;
}

const fecha = () =>
  new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "long", year: "numeric" }).format(new Date());

/**
 * Formato de cotización que recibe el vendedor: una partida por línea con
 * modelo, cantidad y precio público, más los totales estimados. Se arma con lo
 * que el servidor devolvió: en el navegador no se calcula ni un peso.
 */
function mensajeCotizacion(carrito: Carrito): string {
  if (!carrito.lineas.length) return whatsappHref();
  const partidas = carrito.lineas.map((l, i) => {
    const serie = l.serie ? ` (${l.serie})` : "";
    const estado = l.enStock ? "En stock" : "Bajo pedido";
    const cierre = l.decision.accion === "cotizar" ? " · se cotiza" : "";
    return `${i + 1}. ${l.marca} · ${l.nombre}${serie}\n   Modelo ${l.sku} · ${l.cantidad} pza${l.cantidad > 1 ? "s" : ""} · ${formatearDinero(l.precioPublico.venta)} c/u IVA incl. · ${estado}${cierre}`;
  });
  const texto = [
    `Hola, quiero cotizar mi proyecto HOMEA (${fecha()}):`,
    "",
    ...partidas,
    "",
    `Subtotal estimado: ${formatearDinero(carrito.subtotal)} + IVA`,
    `IVA estimado: ${formatearDinero(carrito.ivaEstimado)}`,
    `Total estimado: ${formatearDinero(carrito.totalEstimado)} IVA incl.`,
    "(Piezas en dólares: equivalencia en pesos al tipo de cambio del día; el ejecutivo confirma TC y descuento.)",
    "",
    "Mis datos: nombre / ciudad / tipo de proyecto —",
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

/** Marcas y motivos por los que el proyecto se cotiza, para explicarlo en una línea. */
function porQueSeCotiza(carrito: Carrito): string {
  const marcas = new Set<string>();
  let monto = false;
  for (const l of carrito.lineas) {
    if (l.decision.accion !== "cotizar") continue;
    if (l.decision.motivo === "marca") marcas.add(l.marca);
    if (l.decision.motivo === "monto") monto = true;
  }
  const partes: string[] = [];
  if (marcas.size) partes.push(`${[...marcas].join(", ")} se cotiza con tu ejecutivo`);
  if (monto) partes.push("hay piezas que por su monto se cotizan con un especialista");
  return partes.length
    ? `Tu proyecto se envía como cotización: ${partes.join(" y ")}. Te confirma tipo de cambio, descuento y tiempo de entrega.`
    : "Tu proyecto se envía como cotización a un especialista.";
}

const Precio = ({ d, pendiente }: { d: Dinero; pendiente: boolean }) => (
  <span className={`figures${pendiente ? " is-pendiente" : ""}`}>{formatearDinero(d)}</span>
);

export default function CarritoDrawer({
  carrito,
  aviso,
  abierto,
  ocupado,
  onCerrar,
  onCantidad,
  onQuitar,
}: Props) {
  const vacio = carrito.lineas.length === 0;
  const bloqueo = textoBloqueo(carrito);
  const seCotiza = carrito.modo === "cotizacion";
  const puedePagar = !seCotiza && Boolean(carrito.checkoutUrl) && !carrito.bloqueo && !vacio;
  const wa = mensajeCotizacion(carrito);

  return (
    <>
      <div
        className={`wl-overlay${abierto ? " open" : ""}`}
        hidden={!abierto}
        onClick={onCerrar}
        data-cart-close
      />
      <aside
        className={`wl-drawer cart-drawer proy-drawer${abierto ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mi proyecto"
        hidden={!abierto}
        inert={!abierto}
      >
        <div className="wl-head">
          <div>
            <div className="eyebrow">
              Mi proyecto · <span className="cart-headcount figures">{carrito.cantidadTotal}</span>{" "}
              {carrito.cantidadTotal === 1 ? "pieza" : "piezas"}
            </div>
            <h3 className="wl-title">
              Tu <i>proyecto</i>.
            </h3>
          </div>
          <button className="wl-x" type="button" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="wl-list" role="list" aria-busy={ocupado}>
          {vacio ? (
            <div className="wl-empty">
              <p>Tu proyecto está vacío.</p>
              <p className="wl-empty-sub">
                Agrega piezas desde el catálogo. Las que cumplen la regla de compra se pagan en
                línea; si alguna se cotiza, el proyecto completo va a un especialista por WhatsApp.
              </p>
            </div>
          ) : (
            carrito.lineas.map((linea) => (
              <div className="wl-item proy-item" role="listitem" key={linea.id}>
                <a className="wl-thumb" href={linea.ficha ?? "#"} onClick={onCerrar}>
                  {linea.imagen ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- miniatura de 1 línea,
                       la URL puede venir del CDN de Shopify o de /assets; no vale un layout shift. */
                    <img src={linea.imagen} alt={linea.nombre} loading="lazy" />
                  ) : null}
                </a>

                <div className="wl-info">
                  <span className="wl-brand">
                    {linea.marca}
                    {linea.serie ? <span className="proy-serie"> · {linea.serie}</span> : null}
                  </span>
                  <a className="wl-name" href={linea.ficha ?? "#"} onClick={onCerrar}>
                    {linea.nombre.split(" — ")[0]}
                  </a>
                  <span className="proy-sku figures">Modelo {linea.sku}</span>

                  <span className="proy-tags">
                    <span className={`proy-tag${linea.enStock ? " is-stock" : ""}`}>
                      {linea.enStock ? "En stock" : "Bajo pedido"}
                    </span>
                    {linea.decision.accion === "cotizar" ? (
                      <span className="proy-tag is-cotiza">Se cotiza</span>
                    ) : (
                      <span className="proy-tag is-online">Pago en línea</span>
                    )}
                  </span>

                  <span className={`wl-price figures${ocupado ? " is-pendiente" : ""}`}>
                    {linea.precioPublico.tachado ? (
                      <s className="proy-was">{formatearDinero(linea.precioPublico.tachado)}</s>
                    ) : null}
                    {formatearDinero(linea.precioPublico.venta)}
                    <span className="proy-iva"> IVA incl.</span>
                  </span>

                  <div className="cart-qty">
                    <button
                      type="button"
                      className="cart-q"
                      onClick={() => onCantidad(linea, linea.cantidad - 1)}
                      aria-label="Quitar una"
                    >
                      −
                    </button>
                    <span className="figures">{linea.cantidad}</span>
                    <button
                      type="button"
                      className="cart-q"
                      onClick={() => onCantidad(linea, linea.cantidad + 1)}
                      // El tope lo dicta Shopify, no el navegador.
                      disabled={linea.maximo !== null && linea.cantidad >= linea.maximo}
                      aria-label="Agregar una"
                    >
                      +
                    </button>
                    {linea.cantidad > 1 ? (
                      <span className={`proy-linea-total figures${ocupado ? " is-pendiente" : ""}`}>
                        = {formatearDinero(linea.total)} + IVA
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  className="wl-remove cart-remove"
                  type="button"
                  onClick={() => onQuitar(linea)}
                  aria-label={`Quitar ${linea.nombre}`}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <div className="wl-foot" hidden={vacio}>
          <div className="proy-totales">
            <div className="cart-subtotal">
              <span>Subtotal</span>
              <Precio d={carrito.subtotal} pendiente={ocupado} />
            </div>
            <div className="cart-subtotal">
              <span>IVA (16 %){carrito.impuesto ? "" : " estimado"}</span>
              <Precio d={carrito.ivaEstimado} pendiente={ocupado} />
            </div>
            <div className="cart-subtotal proy-total">
              <span>Total estimado</span>
              <span className={`cart-subtotal-num figures${ocupado ? " is-pendiente" : ""}`}>
                {formatearDinero(carrito.totalEstimado)}
              </span>
            </div>
          </div>
          <p className="cart-tax-note">
            {seCotiza
              ? "Totales en pesos al tipo de cambio del día; el ejecutivo los confirma en la cotización."
              : "El envío se calcula en el pago. Piezas en dólares: equivalencia al tipo de cambio del día."}
          </p>

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
            <p className="cart-aviso is-bloqueo" role="status">
              {porQueSeCotiza(carrito)}
            </p>
          ) : bloqueo ? (
            <p className="cart-aviso is-bloqueo" role="status">
              {bloqueo}
            </p>
          ) : null}

          {seCotiza ? (
            <a
              className="wl-wa cart-checkout"
              href={wa}
              target="_blank"
              rel="noopener"
              data-track="whatsapp_click"
              data-label="proyecto_cotizar"
            >
              Solicitar cotización por WhatsApp <span className="ar">→</span>
            </a>
          ) : puedePagar ? (
            <a className="wl-wa cart-checkout" href={carrito.checkoutUrl ?? undefined} rel="noopener">
              Pagar en línea <span className="ar">→</span>
            </a>
          ) : (
            <span className="wl-wa cart-checkout" aria-disabled="true">
              Pagar en línea <span className="ar">→</span>
            </span>
          )}

          {!seCotiza ? (
            <a
              className="arrow-link cart-wa-alt"
              href={wa}
              target="_blank"
              rel="noopener"
              data-track="whatsapp_click"
              data-label="proyecto_whatsapp"
            >
              {puedePagar ? "Prefiero cotizar por WhatsApp" : "Cotizar por WhatsApp"}
              <span className="ln" />
              <span className="ar">→</span>
            </a>
          ) : (
            <p className="wl-note">
              Al enviar, un ejecutivo arma tu cotización formal con folio y te la regresa por el
              mismo chat.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
