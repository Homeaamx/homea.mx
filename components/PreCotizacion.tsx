"use client";

// PreCotizacion — el formato de pre-cotización (Carla, 2026-10-08), calcado del
// formato de cotización de SAE (muestra: Downloads/cot.muestra.pdf) sin los datos
// fiscales: logo, dirección y teléfonos, fecha de emisión y clave; datos del
// cliente (nombre, teléfono, ciudad, CP, correo opcional) y nombre del proyecto;
// moneda (MXN, USD o MIXTA: aquí el dólar NO se convierte); partidas con
// cantidad, modelo, descripción, P/U, descuento, importe e imagen; totales por
// moneda (pesos primero, luego dólares): ahorro, subtotal, IVA 16 % y total.
//
// Lo usan el modal del carrito (editable: las cajas de datos son inputs) y la
// página /cotizacion (solo lectura, desde la URL). Un solo componente para que
// cliente y ejecutivo vean exactamente el mismo documento.

import {
  fechaVigencia,
  formatearFecha,
  importeDe,
  monedaDeCotizacion,
  totalesPorMoneda,
  type DatosCliente,
  type PartidaCotizacion,
} from "@/lib/cotizacion";

interface Props {
  folio: string;
  /** ISO, para que viaje igual desde el servidor que desde el navegador. */
  fechaIso: string;
  partidas: PartidaCotizacion[];
  datos: DatosCliente;
  editable?: boolean;
  onDatos?: (datos: DatosCliente) => void;
}

const num = (n: number) =>
  new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

/** Miniatura del CDN de Shopify: evita incrustar la foto completa en el PDF. */
const miniatura = (url: string) =>
  /cdn\.shopify\.com/.test(url) ? `${url}${url.includes("?") ? "&" : "?"}width=240` : url;

const NOMBRE_MONEDA = { MXN: "Pesos mexicanos (MXN)", USD: "Dólares (USD)", MIXTA: "Mixta (MXN y USD)", "—": "—" } as const;

export default function PreCotizacion({ folio, fechaIso, partidas, datos, editable = false, onDatos }: Props) {
  const fecha = new Date(fechaIso);
  const moneda = monedaDeCotizacion(partidas);
  const mixta = moneda === "MIXTA";
  const totales = totalesPorMoneda(partidas);

  const campo = (clave: keyof DatosCliente, etiqueta: string, extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => (
    <div className="pc-campo" key={clave}>
      <span className="pc-lbl">{etiqueta}</span>
      {editable ? (
        <input
          value={datos[clave]}
          onChange={(ev) => onDatos?.({ ...datos, [clave]: ev.target.value })}
          maxLength={80}
          placeholder={extra.required ? "Llenar campo" : "Opcional"}
          aria-required={extra.required ? true : undefined}
          {...extra}
        />
      ) : (
        <span className={`pc-val${datos[clave] ? "" : " is-vacio"}`}>{datos[clave] || "—"}</span>
      )}
    </div>
  );

  return (
    <article className="pc" aria-label={`Pre-cotización ${folio}`}>
      <header className="pc-head">
        <div className="pc-marca">
          <div className="pc-logo">
            {/* eslint-disable-next-line @next/next/no-img-element -- logotipo estático de tamaño fijo. */}
            <img src="/assets/black_logo_homea.webp" alt="HOMEA" width={150} height={50} />
          </div>
          <div className="pc-empresa">
            <p className="pc-emp-dir">
              Ahuehuetes No. 7, Col. Álamos 1a Sección
              <br />
              CP 76160, Querétaro, Qro., México
            </p>
            <p className="pc-emp-contacto">
              <b>www.homea.mx</b>
              <span>Tel. (800) 701 2121</span>
              <span>Tel. (442) 216 3552</span>
            </p>
          </div>
        </div>
        <div className="pc-folio">
          <div className="pc-caja">
            <span className="pc-caja-t">Pre-cotización</span>
            <strong className="figures">{folio}</strong>
          </div>
          <div className="pc-caja">
            <span className="pc-caja-t">Fecha de emisión</span>
            <span className="figures">{formatearFecha(fecha)}</span>
          </div>
        </div>
      </header>

      <section className="pc-datos">
        <div className="pc-bloque">
          <h2 className="pc-h">Datos del cliente</h2>
          {campo("nombre", "Nombre", { autoComplete: "name", required: true })}
          <div className="pc-fila">
            {campo("telefono", "Teléfono", { type: "tel", autoComplete: "tel", required: true })}
            {campo("ciudad", "Ciudad", { autoComplete: "address-level2" })}
            {campo("cp", "CP", { inputMode: "numeric", maxLength: 10, autoComplete: "postal-code" })}
          </div>
          {campo("correo", "Correo", { type: "email", autoComplete: "email" })}
        </div>
        <div className="pc-bloque">
          <h2 className="pc-h">Proyecto</h2>
          {campo("proyecto", "Nombre del proyecto")}
          <div className="pc-campo">
            <span className="pc-lbl">Cotización hecha en moneda</span>
            <span className="pc-val">{NOMBRE_MONEDA[moneda]}</span>
          </div>
          <div className="pc-campo">
            <span className="pc-lbl">Vigencia</span>
            <span className="pc-val figures">{formatearFecha(fechaVigencia(fecha))}</span>
          </div>
          <p className="pc-intro">Por medio de la presente se enlista la siguiente pre-cotización.</p>
        </div>
      </section>

      <table className="pc-tabla">
        <thead>
          <tr>
            <th className="num">Cantidad</th>
            <th>Modelo</th>
            <th className="pc-th-desc">Descripción de producto</th>
            <th className="num">P/U sin IVA</th>
            <th className="num">Desc.</th>
            <th className="num">Importe sin IVA</th>
            <th className="pc-th-img" aria-label="Imagen" />
          </tr>
        </thead>
        <tbody>
          {partidas.map((p) => (
            <tr key={p.sku}>
              <td className="num figures" data-l="Cantidad">{p.cantidad}</td>
              <td className="figures pc-sku" data-l="Modelo">{p.sku}</td>
              <td className="pc-desc">
                <div className="pc-desc-in">
                <strong>
                  {p.marca} · {p.nombre}
                  {p.serie ? ` · ${p.serie}` : ""}
                </strong>
                {p.descripcion ? <span>{p.descripcion}</span> : null}
                <span className="pc-estado">
                  {p.enStock ? "En stock" : "Bajo pedido"}
                  {p.preliminar ? " · precio por confirmar" : ""}
                </span>
                </div>
              </td>
              <td className="num figures" data-l="P/U sin IVA">
                {num(p.lista)}
                {mixta ? <em className="pc-mon">{p.moneda}</em> : null}
              </td>
              <td className="num figures" data-l="Desc.">{p.descuento > 0 ? num(p.descuento) : "—"}</td>
              <td className="num figures" data-l="Importe sin IVA">
                {num(importeDe(p))}
                {mixta ? <em className="pc-mon">{p.moneda}</em> : null}
              </td>
              <td className="pc-img">
                {p.imagen ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- miniatura del CDN de Shopify. */
                  <img src={miniatura(p.imagen)} alt="" loading="lazy" />
                ) : null}
              </td>
            </tr>
          ))}
          {partidas.length === 0 ? (
            <tr>
              <td colSpan={7} className="pc-sin">
                Esta pre-cotización no trae partidas.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {totales.length ? (
        <section className="pc-totales">
          {totales.map((t) => (
            <div className="pc-tot proy-totales" key={t.moneda}>
              {mixta ? (
                <span className="pc-tot-t">{t.moneda === "MXN" ? "Totales en pesos (MXN)" : "Totales en dólares (USD)"}</span>
              ) : null}
              <div className="cart-subtotal">
                <span>Subtotal sin IVA</span>
                <span className="figures">{num(t.subtotal)} {t.moneda}</span>
              </div>
              <div className="cart-subtotal proy-ahorro">
                <span>Ahorro</span>
                <span className="figures">−{num(t.ahorro)} {t.moneda}</span>
              </div>
              <div className="cart-subtotal">
                <span>IVA (16 %)</span>
                <span className="figures">{num(t.iva)} {t.moneda}</span>
              </div>
              <div className="cart-subtotal proy-total">
                <span>{t.moneda === "USD" ? "Total estimado · IVA incl." : "Total en pesos · IVA incl."}</span>
                <span className="cart-subtotal-num figures">
                  {num(t.total)} {t.moneda}
                </span>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <p className="pc-nota">Se le proporcionará un tipo de cambio vigente y tiempos de entrega estimados.</p>
    </article>
  );
}
