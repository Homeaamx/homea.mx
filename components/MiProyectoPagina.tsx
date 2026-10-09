"use client";

// MiProyectoPagina — /mi-proyecto: la página de "Mi proyecto" con el mismo
// diseño que /wishlist (hero, rejilla de tarjetas, cuadro de cierre). Lee el
// carrito de Shopify por contexto (CarritoProvider envuelve <main>) y usa
// <ProyectoCierre> para los totales y la salida, así dice exactamente lo mismo
// que el cajón: sin peros → "Pagar"; si algo se cotiza → notas y WhatsApp.

import { useCarrito } from "./CarritoContexto";
import { topeAlcanzado } from "./CarritoDrawer";
import ProyectoCierre from "./ProyectoCierre";
import { formatearDinero } from "@/lib/shopify/tipos";

const ICONO = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="ic-stroke">
    <rect x="4.5" y="5" width="15" height="15.5" />
    <path d="M9 5V3.5h6V5" />
    <path d="M8.5 10.5h7M8.5 14h7M8.5 17.5h4" />
  </svg>
);

export default function MiProyectoPagina() {
  const ctx = useCarrito();
  const carrito = ctx?.carrito;
  const cargado = ctx?.cargado ?? false;
  const lineas = carrito?.lineas ?? [];
  const n = carrito?.cantidadTotal ?? 0;
  const vacio = cargado && lineas.length === 0;

  return (
    <div data-mi-proyecto>
      <header className="wlp-hero">
        <div className="container">
          <div className="crumbs">
            <a href="/">Inicio</a>
            <span className="sep">·</span>
            <span>Mi proyecto</span>
          </div>
          <div className="eyebrow">
            Tu proyecto · <span className="figures">{cargado ? `${n} ${n === 1 ? "pieza" : "piezas"}` : "…"}</span>
          </div>
          <h1 className="wlp-title">Mi proyecto {ICONO}</h1>
          <p className="sub">
            Todas las piezas que vas armando. Si cada una cumple la regla de compra, pagas en línea; si alguna se
            cotiza, el proyecto completo va a un ejecutivo con tu cotización preliminar.
          </p>
        </div>
      </header>

      <section className="wlp">
        <div className="container">
          {!cargado ? (
            <p className="mp-cargando" aria-busy="true">
              Cargando tu proyecto…
            </p>
          ) : vacio ? (
            <div className="wlp-vacio">
              <p>Tu proyecto está vacío.</p>
              <p className="sub">
                Agrega piezas desde el catálogo con «Agregar a mi proyecto», o pasa las de tu wishlist de una vez.
              </p>
              <a className="arrow-link" href="/wishlist">
                Ver mi wishlist <span className="ln" />
                <span className="ar">→</span>
              </a>
            </div>
          ) : (
            <>
              <div className="wlp-count">
                <span>Piezas en tu proyecto</span>
              </div>
              <div className="wlp-grid" aria-busy={ctx?.ocupado}>
                {lineas.map((l) => (
                  <div className="pcard wlp-card" key={l.id}>
                    <a className="imgw cutout" href={l.ficha ?? "#"} aria-label={l.nombre}>
                      {l.imagen ? (
                        /* eslint-disable-next-line @next/next/no-img-element -- foto del CDN de Shopify, tarjeta fija. */
                        <img src={l.imagen} alt={l.nombre} loading="lazy" decoding="async" />
                      ) : null}
                    </a>
                    <button
                      type="button"
                      className="wl-remove wlp-x"
                      onClick={() => ctx?.quitar(l)}
                      aria-label={`Quitar ${l.nombre}`}
                    >
                      ×
                    </button>
                    <div className="body">
                      <div className="pcard-head">
                        <span className="brand">{l.marca}</span>
                        {l.serie ? <span className="pcard-serie">{l.serie}</span> : null}
                      </div>
                      <h3 className="pcard-name">
                        <a href={l.ficha ?? "#"}>{l.nombre.split(" — ")[0]}</a>
                      </h3>
                      <span className="pcard-sku figures">
                        <span className="pcard-sku-lbl">Modelo</span>
                        {l.sku}
                      </span>
                      <span className="proy-tags">
                        <span className={`proy-tag${l.enStock ? " is-stock" : ""}`}>
                          {l.enStock ? "En stock" : "Bajo pedido"}
                        </span>
                      </span>
                      <div className={`pcard-price${ctx?.ocupado ? " is-pendiente" : ""}`}>
                        <span className="price-tag figures">
                          {formatearDinero(l.precioPublico.venta)}
                          <span className="proy-iva">IVA incl.</span>
                        </span>
                        {l.precioPublico.tachado ? (
                          <s className="price-was figures">{formatearDinero(l.precioPublico.tachado)}</s>
                        ) : null}
                      </div>
                      <div className="cart-qty">
                        <button
                          type="button"
                          className="cart-q"
                          onClick={() => ctx?.cambiar(l, l.cantidad - 1)}
                          disabled={l.cantidad <= 1}
                          aria-label="Quitar una"
                        >
                          −
                        </button>
                        <span className="figures">{l.cantidad}</span>
                        <button
                          type="button"
                          className="cart-q"
                          onClick={() => ctx?.cambiar(l, l.cantidad + 1)}
                          disabled={topeAlcanzado(l)}
                          aria-label="Agregar una"
                        >
                          +
                        </button>
                        {l.cantidad > 1 ? (
                          <span className="proy-linea-total figures">
                            ={" "}
                            {formatearDinero({
                              monto: Math.round(l.precioPublico.venta.monto * l.cantidad * 100) / 100,
                              moneda: l.precioPublico.venta.moneda,
                            })}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {carrito ? (
                <div className="mp-cierre">
                  <div className="mp-cierre-t">
                    <h3>
                      {carrito.modo === "checkout" ? (
                        <>
                          Todo listo para <i>pagar</i>.
                        </>
                      ) : (
                        <>
                          Tu proyecto se cierra <i>con un ejecutivo</i>.
                        </>
                      )}
                    </h3>
                  </div>
                  <ProyectoCierre carrito={carrito} aviso={ctx?.aviso} ocupado={ctx?.ocupado ?? false} />
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
