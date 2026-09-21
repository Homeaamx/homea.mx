"use client";

// CarritoDrawer — el cajón lateral del carrito.
//
// Es la transcripción a JSX del markup que armaba `public/cart.js`, clase por
// clase: todo el CSS del design system v2 (`styles/theme.css`, bloque .wl-* /
// .cart-*) se reutiliza sin tocar una línea. Si aquí cambia un nombre de clase,
// el cajón se despinta.
//
// Ojo con `hidden`: `.wl-drawer` tiene `display:flex`, que le gana al
// `[hidden]{display:none}` del navegador. El cajón se esconde de verdad con
// `transform: translateX(100%)`; el atributo solo lo saca del árbol de
// accesibilidad. Por eso además se marca `inert` cuando está cerrado: si no, sus
// enlaces siguen siendo tabulables fuera de la pantalla.

import type { Aviso, Carrito, LineaCarrito } from "@/lib/shopify/tipos";
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

/** Mensaje de cotización con todas las partidas, igual que el carrito anterior. */
function whatsappDelCarrito(carrito: Carrito): string {
  const lineas = carrito.lineas.map(
    (l) =>
      `• ${l.cantidad > 1 ? `${l.cantidad} × ` : ""}${l.marca} ${l.nombre} (mod. ${l.sku})`,
  );
  if (!lineas.length) return whatsappHref();
  return whatsappHref(`¡Hola! Quiero cotizar mi carrito:\n${lineas.join("\n")}`);
}

/** Explicación del bloqueo. Nunca se falla en silencio: se dice qué pasa. */
function textoBloqueo(carrito: Carrito): string | null {
  switch (carrito.bloqueo) {
    case "moneda-incoherente":
      return "Precio por confirmar: la moneda de este producto no coincide con la de la tienda. Un especialista te confirma el total.";
    case "tienda-con-password":
      return "El pago en línea está en preparación. Cierra tu compra con un especialista por WhatsApp.";
    default:
      return null;
  }
}

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
  const puedePagar = Boolean(carrito.checkoutUrl) && !carrito.bloqueo && !vacio;

  return (
    <>
      <div
        className={`wl-overlay${abierto ? " open" : ""}`}
        hidden={!abierto}
        onClick={onCerrar}
        data-cart-close
      />
      <aside
        className={`wl-drawer cart-drawer${abierto ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito"
        hidden={!abierto}
        inert={!abierto}
      >
        <div className="wl-head">
          <div>
            <div className="eyebrow">
              Carrito · <span className="cart-headcount figures">{carrito.cantidadTotal}</span>
            </div>
            <h3 className="wl-title">
              Tu <i>carrito</i>.
            </h3>
          </div>
          <button className="wl-x" type="button" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="wl-list" role="list" aria-busy={ocupado}>
          {vacio ? (
            <div className="wl-empty">
              <p>Tu carrito está vacío.</p>
              <p className="wl-empty-sub">
                Las piezas del piloto Gaggenau se pueden comprar en línea; el resto del catálogo
                se cotiza con un especialista.
              </p>
            </div>
          ) : (
            carrito.lineas.map((linea) => (
              <div className="wl-item" role="listitem" key={linea.id}>
                <a className="wl-thumb" href={linea.ficha ?? "#"} onClick={onCerrar}>
                  {linea.imagen ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- miniatura de 1 línea,
                       la URL puede venir del CDN de Shopify o de /assets; no vale un layout shift. */
                    <img src={linea.imagen} alt={linea.nombre} loading="lazy" />
                  ) : null}
                </a>

                <div className="wl-info">
                  <span className="wl-brand">{linea.marca}</span>
                  <a className="wl-name" href={linea.ficha ?? "#"} onClick={onCerrar}>
                    {linea.nombre}
                  </a>
                  <span className={`wl-price figures${ocupado ? " is-pendiente" : ""}`}>
                    {formatearDinero(linea.total)}
                    {linea.cantidad > 1 ? ` · ${linea.cantidad} pzas` : ""}
                  </span>
                  {!linea.disponible ? (
                    <span className="cart-aviso">Bajo pedido · lo confirma un especialista</span>
                  ) : null}

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
          <div className="cart-subtotal">
            <span>Subtotal</span>
            <span className={`cart-subtotal-num figures${ocupado ? " is-pendiente" : ""}`}>
              {formatearDinero(carrito.subtotal)}
            </span>
          </div>
          <p className="cart-tax-note">El IVA y el envío se calculan en el pago.</p>

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

          {bloqueo ? (
            <p className="cart-aviso is-bloqueo" role="status">
              {bloqueo}
            </p>
          ) : null}

          {puedePagar ? (
            <a className="wl-wa cart-checkout" href={carrito.checkoutUrl ?? undefined} rel="noopener">
              Finalizar compra <span className="ar">→</span>
            </a>
          ) : (
            <span className="wl-wa cart-checkout" aria-disabled="true">
              Finalizar compra <span className="ar">→</span>
            </span>
          )}

          <a
            className="arrow-link cart-wa-alt"
            href={whatsappDelCarrito(carrito)}
            target="_blank"
            rel="noopener"
            data-track="whatsapp_click"
            data-label="wa_cart"
          >
            {puedePagar ? "Prefiero cotizar por WhatsApp" : "Cotizar por WhatsApp"}
            <span className="ln" />
            <span className="ar">→</span>
          </a>
        </div>
      </aside>
    </>
  );
}
