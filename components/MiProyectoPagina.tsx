"use client";

// MiProyectoPagina — /mi-proyecto, la página de "Mi proyecto" (rediseño
// 2026-10-09, mismo lenguaje que /wishlist): cabecera sobria, lista de piezas
// en filas con regla fina (foto · datos · precio unitario · cantidad · importe)
// y un panel de resumen pegajoso a la derecha con los totales y la salida.
//
// Lee el carrito de Shopify por contexto (CarritoProvider envuelve <main>) y usa
// <ProyectoCierre> para totales, tipo de cambio aplicado, notas y botón, así
// dice exactamente lo mismo que el cajón: sin peros → "Pagar"; si algo se
// cotiza → "Enviar listado por WhatsApp" (abre la pre-cotización).

import { useCarrito } from "./CarritoContexto";
import { topeAlcanzado } from "./CarritoDrawer";
import ProyectoCierre from "./ProyectoCierre";
import { formatearDinero, type LineaCarrito } from "@/lib/shopify/tipos";

/** Importe de la línea: precio público con IVA × cantidad, en la moneda de lista. */
function importeDe(l: LineaCarrito) {
  return {
    monto: Math.round(l.precioPublico.venta.monto * l.cantidad * 100) / 100,
    moneda: l.precioPublico.venta.moneda,
  };
}

export default function MiProyectoPagina() {
  const ctx = useCarrito();
  const carrito = ctx?.carrito;
  const cargado = ctx?.cargado ?? false;
  const ocupado = ctx?.ocupado ?? false;
  const lineas = carrito?.lineas ?? [];
  const n = carrito?.cantidadTotal ?? 0;
  const vacio = cargado && lineas.length === 0;
  const seCotiza = carrito?.modo === "cotizacion";

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
            Mi proyecto · <span className="figures">{cargado ? `${n} ${n === 1 ? "pieza" : "piezas"}` : "…"}</span>
          </div>
          <h1 className="wlp-title">
            Tu <i>proyecto</i>.
          </h1>
          <p className="sub">
            Reúne aquí todas las piezas de tu proyecto. Las disponibles para compra en línea se pagan directo; si
            alguna se cotiza, el proyecto completo se envía a un ejecutivo con tu pre-cotización.
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
            <div className="sel-layout">
              <div className="sel-lista is-proyecto" aria-busy={ocupado}>
                {lineas.map((l) => (
                  <article className="sel-row" key={l.id}>
                    <a className="sel-thumb cutout" href={l.ficha ?? "#"} aria-label={l.nombre}>
                      {l.imagen ? (
                        /* eslint-disable-next-line @next/next/no-img-element -- foto del CDN de Shopify, miniatura fija. */
                        <img src={l.imagen} alt="" loading="lazy" decoding="async" />
                      ) : null}
                    </a>

                    <div className="sel-info">
                      <span className="sel-brand">
                        {l.marca}
                        {l.serie ? <span className="sel-serie"> · {l.serie}</span> : null}
                      </span>
                      <h3 className="sel-name">
                        <a href={l.ficha ?? "#"}>{l.nombre.split(" — ")[0]}</a>
                      </h3>
                      <span className="sel-sku figures">
                        <b>Modelo</b>
                        {l.sku}
                      </span>
                      <span className="proy-tags">
                        <span className={`proy-tag${l.enStock ? " is-stock" : ""}`}>
                          {l.enStock ? "En stock" : "Bajo pedido"}
                        </span>
                      </span>
                    </div>

                    {/* Columna de datos (Carla, 2026-10-09): precio con IVA y tachado,
                        regla, cantidad en control segmentado e importe. */}
                    <div className="mp-datos">
                    <div className={`mp-precio${ocupado ? " is-pendiente" : ""}`}>
                      <strong className="figures">{formatearDinero(l.precioPublico.venta)}</strong>
                      <span className="mp-iva">IVA incl.</span>
                      {l.precioPublico.tachado ? (
                        <s className="figures">{formatearDinero(l.precioPublico.tachado)}</s>
                      ) : null}
                    </div>

                    <div className="mp-fila">
                      <span className="mp-lbl">Cantidad</span>
                      <div className="cart-qty mp-qty">
                        <button
                          type="button"
                          className="cart-q"
                          onClick={() => ctx?.cambiar(l, l.cantidad - 1)}
                          // Mínimo una: para sacar la pieza está la ×.
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
                          // El tope lo dicta Shopify, solo para lo que está en stock.
                          disabled={topeAlcanzado(l)}
                          aria-label="Agregar una"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className={`mp-fila${ocupado ? " is-pendiente" : ""}`}>
                      <span className="mp-lbl">Importe</span>
                      <span className="mp-val">
                        <strong className="figures">{formatearDinero(importeDe(l))}</strong>
                        <span className="mp-iva">IVA incl.</span>
                      </span>
                    </div>
                    </div>

                    <button
                      type="button"
                      className="sel-x"
                      onClick={() => ctx?.quitar(l)}
                      aria-label={`Quitar ${l.nombre}`}
                    >
                      ×
                    </button>
                  </article>
                ))}

                <div className="sel-pie">
                  <a className="arrow-link" href="/productos/cocina-y-bar">
                    Seguir explorando <span className="ln" />
                    <span className="ar">→</span>
                  </a>
                </div>
              </div>

              {carrito ? (
                <aside className="sel-aside" aria-label="Resumen de tu proyecto">
                  <h3>
                    {seCotiza ? (
                      <>
                        Se cierra <i>con un ejecutivo</i>.
                      </>
                    ) : (
                      <>
                        Todo listo para <i>pagar</i>.
                      </>
                    )}
                  </h3>
                  <p className="sel-aside-sub">
                    {seCotiza
                      ? "Una o más piezas deben revisarse detenidamente, así que el proyecto completo se envía a un ejecutivo de ventas con tu pre-cotización."
                      : "Todas las piezas se pueden pagar en línea. Envío y facturación se confirman al pagar."}
                  </p>
                  <h4 className="sel-aside-h">
                    Resumen del <i>pedido</i>.
                  </h4>
                  <ProyectoCierre carrito={carrito} aviso={ctx?.aviso} ocupado={ocupado} />
                </aside>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
