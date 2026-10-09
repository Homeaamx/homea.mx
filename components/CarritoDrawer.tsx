"use client";

// CarritoDrawer — el cajón lateral de "Mi proyecto" (modelo Artexa, Carla 2026-10-06;
// composición revisada el 2026-10-08). La lista de piezas vive aquí; los totales,
// las notas según la regla y la salida (Pagar / WhatsApp con formulario) son
// <ProyectoCierre>, compartido con la página /mi-proyecto.
//
// Orden de la información por pieza: marca · serie → nombre → modelo →
// disponibilidad → precio final con IVA → precio tachado → cantidad.
//
// Se abre al sostener el cursor 0,5 s sobre "Mi proyecto" en el nav (el clic
// lleva a /mi-proyecto); ver CarritoProvider.
//
// Reutiliza el CSS del design system v2 (`styles/theme.css`, bloques .wl-* /
// .cart-* / .proy-*). Ojo con `hidden`: `.wl-drawer` tiene `display:flex`, así
// que el cajón se esconde con `transform`; el atributo solo lo saca del árbol de
// accesibilidad y por eso además va `inert` cuando está cerrado.

import type { Aviso, Carrito, LineaCarrito } from "@/lib/shopify/tipos";
import { formatearDinero } from "@/lib/shopify/tipos";

import ProyectoCierre from "./ProyectoCierre";

/** ¿Ya no se puede pedir una más? Solo aplica a piezas en stock con existencia conocida. */
export function topeAlcanzado(linea: LineaCarrito): boolean {
  return linea.enStock && linea.maximo !== null && linea.maximo > 0 && linea.cantidad >= linea.maximo;
}

export { hayDolares } from "./ProyectoCierre";

interface Props {
  carrito: Carrito;
  aviso?: Aviso;
  abierto: boolean;
  ocupado: boolean;
  onCerrar: () => void;
  onCantidad: (linea: LineaCarrito, cantidad: number) => void;
  onQuitar: (linea: LineaCarrito) => void;
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
            {/* El título lleva a la página /mi-proyecto (hover con subrayado-flecha). */}
            <h3 className="wl-title">
              <a className="proy-titulo-link" href="/mi-proyecto" onClick={onCerrar} aria-label="Ir a mi proyecto">
                <span className="proy-titulo-txt">
                  Tu <i>proyecto</i>.
                </span>
                <span className="ln" />
                <span className="ar">→</span>
              </a>
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
                  {/* 1 · Marca · serie o línea */}
                  <span className="wl-brand">
                    {linea.marca}
                    {linea.serie ? <span className="proy-serie"> · {linea.serie}</span> : null}
                  </span>
                  {/* 2 · Descripción corta */}
                  <a className="wl-name" href={linea.ficha ?? "#"} onClick={onCerrar}>
                    {linea.nombre.split(" — ")[0]}
                  </a>
                  {/* 3 · Modelo / SKU */}
                  <span className="proy-sku figures">Modelo {linea.sku}</span>
                  {/* 4 · Disponibilidad */}
                  <span className="proy-tags">
                    <span className={`proy-tag${linea.enStock ? " is-stock" : ""}`}>
                      {linea.enStock ? "En stock" : "Bajo pedido"}
                    </span>
                  </span>
                  {/* 5 · Precio final con IVA · 6 · Precio tachado */}
                  <span className={`wl-price figures${ocupado ? " is-pendiente" : ""}`}>
                    <span className="proy-venta">
                      {formatearDinero(linea.precioPublico.venta)}
                      <span className="proy-iva"> IVA incl.</span>
                    </span>
                    {linea.precioPublico.tachado ? (
                      <s className="proy-was">{formatearDinero(linea.precioPublico.tachado)}</s>
                    ) : null}
                  </span>
                  {/* 7 · Cantidad */}
                  <div className="cart-qty">
                    <button
                      type="button"
                      className="cart-q"
                      onClick={() => onCantidad(linea, linea.cantidad - 1)}
                      // Mínimo una: para sacar la pieza está la ×.
                      disabled={linea.cantidad <= 1}
                      aria-label="Quitar una"
                    >
                      −
                    </button>
                    <span className="figures">{linea.cantidad}</span>
                    <button
                      type="button"
                      className="cart-q"
                      onClick={() => onCantidad(linea, linea.cantidad + 1)}
                      // El tope lo dicta Shopify, pero solo para lo que está en stock:
                      // lo bajo pedido reporta existencia 0 y se sigue vendiendo.
                      disabled={topeAlcanzado(linea)}
                      aria-label="Agregar una"
                    >
                      +
                    </button>
                    {linea.cantidad > 1 ? (
                      <span className={`proy-linea-total figures${ocupado ? " is-pendiente" : ""}`}>
                        ={" "}
                        {formatearDinero({
                          monto: Math.round(linea.precioPublico.venta.monto * linea.cantidad * 100) / 100,
                          moneda: linea.precioPublico.venta.moneda,
                        })}{" "}
                        IVA incl.
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
          <ProyectoCierre carrito={carrito} aviso={aviso} ocupado={ocupado} />
        </div>
      </aside>
    </>
  );
}
