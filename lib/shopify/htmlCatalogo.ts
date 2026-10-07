// htmlCatalogo.ts — tarjetas, filtros y ficha de producto del catálogo vivo, en
// el MISMO markup del preview (design system v2).
//
// Se generan como HTML (no como componentes) por la misma razón que pdpSlots.ts:
// las páginas de Subcategoría 1 son HTML del preview inyectado, y lo que va ahí
// adentro tiene que salir del servidor para que Google lo vea. Un solo
// generador sirve a la vez a esas páginas, a las PLP de tipo (React) y a la
// ficha: la tarjeta se ve idéntica en todos lados.
//
// El filtrado es del lado del cliente (public/catalogo.js): cada tarjeta lleva
// sus valores en `data-fv-<clave>` y cada casilla del panel su `data-fk`.

import "server-only";

import filtrosWeb from "@/data/filtros-web.json";
import type { Decision } from "@/lib/reglas/reglaMarca";
import type { TipoCambio } from "@/lib/tipoCambio";
import { whatsappHref } from "@/lib/whatsapp";

import { tipoWeb } from "./coleccionesWeb";
import {
  decisionDeCompra,
  precioPublico,
  type PrecioPublico,
  type ProductoVivo,
} from "./catalogoVivo";

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** "Bajo cubierta" → "bajo-cubierta"; '24"' → "24". */
export function slugValor(v: string): string {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const dinero = (n: number) =>
  new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

/** El CDN de Shopify redimensiona por parámetro: se pide solo el ancho necesario. */
function cdn(url: string, ancho: number): string {
  return `${url}${url.includes("?") ? "&" : "?"}width=${ancho}`;
}

function srcsetCdn(url: string, maximo: number): string {
  return [400, 640, 960, 1280]
    .filter((w) => w <= Math.max(400, maximo))
    .map((w) => `${cdn(url, w)} ${w}w`)
    .join(", ");
}

const CORAZON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3 4.9 13a4.8 4.8 0 0 1 0-6.8 4.7 4.7 0 0 1 6.7 0l.4.4.4-.4a4.7 4.7 0 0 1 6.7 0 4.8 4.8 0 0 1 0 6.8Z"/></svg>';

/* ---------- Definición de filtros por tipo -------------------------------- */

interface DefFiltro {
  nombre: string;
  clave: string;
}

const DEFS = (filtrosWeb as { subcategorias: Record<string, DefFiltro[]> }).subcategorias;

/**
 * "Refrigerador French Door 36\" — Serie Expressive" → nombre corto + línea.
 * La línea (serie) va aparte en la tarjeta, como Fisher & Paykel "Series 7".
 */
export function nombreYSerie(titulo: string): { nombre: string; serie: string | null } {
  const [nombre, ...resto] = titulo.split(" — ");
  const serie = resto.join(" — ").trim();
  return { nombre: nombre.trim(), serie: serie || null };
}

/** Línea corta (wishlist y resumen del proyecto): lo que distingue a la pieza de un vistazo. */
function lineaSpec(p: ProductoVivo): string[] {
  const f = p.filtros;
  const partes = [
    ...(f.diseno ?? []),
    ...(f.ancho ?? []),
    ...(f.acabado ?? []),
    ...(f.tipo ?? []),
    ...(f.funcionamiento ?? []).filter((v) => !/^Todo /.test(v)),
  ];
  return [...new Set(partes)].slice(0, 3).concat(p.sku);
}

/* ---------- Precio -------------------------------------------------------- */

function textoPrecio(precio: PrecioPublico): string {
  return `$${dinero(precio.venta)} ${precio.moneda} IVA incluido`;
}

function precioTarjeta(precio: PrecioPublico): string {
  const tachado = precio.tachado
    ? `<s class="price-was figures">$${dinero(precio.tachado)} ${precio.moneda}</s>`
    : "";
  return `<div class="pcard-price">${tachado}<span class="price-tag figures">$${dinero(precio.venta)}<span class="currency">${precio.moneda}</span></span><span class="price-note">IVA incluido</span></div>`;
}

export function precioFichaHtml(precio: PrecioPublico, tc: TipoCambio): string {
  const tachado = precio.tachado
    ? `<s class="price-was">$${dinero(precio.tachado)}</s>`
    : "";
  const principal = `<span class="price-big figures">${tachado}$${dinero(precio.venta)}<span class="currency">${precio.moneda}</span> <span class="price-note">IVA incluido</span></span>`;
  if (precio.moneda !== "USD" || precio.mxnEquivalente === null) return principal;
  return `${principal}
      <p class="note figures" style="margin-top:-4px">≈ $${dinero(precio.mxnEquivalente)} MXN IVA incluido · TC ${tc.valor.toFixed(2)}${tc.fecha ? ` · ${esc(tc.fecha)}` : ""}</p>`;
}

/* ---------- Tarjeta ------------------------------------------------------- */

export function tarjetaHtml(p: ProductoVivo, tc: TipoCambio, orden = 0): string {
  const precio = precioPublico(p, tc);
  const decision = decisionDeCompra(p, precio);
  const href = `/producto/${p.slug}`;
  const img = p.imagenes[0];
  const spec = lineaSpec(p);
  const tw = tipoWeb(p.tipo);

  // Valores de filtro para public/catalogo.js (slugs separados por espacio).
  const atributos: string[] = [
    `data-cat-card`,
    `data-orden="${orden}"`,
    `data-precio="${precio.mxnEquivalente ?? precio.venta}"`,
    `data-tipo="${esc(tw?.slugRiel ?? slugValor(p.tipo))}"`,
    `data-fv-marca="${slugValor(p.marca)}"`,
  ];
  for (const [clave, valores] of Object.entries(p.filtros)) {
    if (clave === "compatible") continue;
    atributos.push(`data-fv-${clave}="${valores.map(slugValor).join(" ")}"`);
  }

  const imagen = img
    ? `<img width="${img.ancho}" height="${img.alto}" srcset="${srcsetCdn(img.url, img.ancho)}" sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 34vw" loading="lazy" decoding="async" src="${cdn(img.url, 640)}" alt="${esc(img.alt)}">`
    : `<span class="ph" style="height:100%"><span class="ph-inner">${esc(p.tipo)}</span></span>`;

  const { nombre, serie } = nombreYSerie(p.titulo);
  const stock = p.enStock
    ? `<span class="pcard-tag is-stock">En stock</span>`
    : `<span class="pcard-tag is-pedido">Bajo pedido</span>`;

  // Solo lo que decide una compra, en este orden (Carla, 2026-10-06): marca y
  // línea · disponibilidad · nombre · modelo · precio tachado y precio final.
  return `<a class="pcard" href="${href}" ${atributos.join(" ")} data-accion="${decision.accion}">
  <button class="wl-heart" type="button" data-wl-id="${esc(p.sku)}" data-wl-brand="${esc(p.marca)}" data-wl-name="${esc(p.titulo)}" data-wl-spec="${esc(spec.join(" · "))}" data-wl-price="${esc(textoPrecio(precio))}" data-wl-img="${img ? esc(cdn(img.url, 400)) : ""}" data-wl-href="${href}" aria-label="Guardar en wishlist" aria-pressed="false">${CORAZON}</button>
  <div class="imgw cutout">${stock}${imagen}</div>
  <div class="body">
    <div class="pcard-head"><span class="brand">${esc(p.marca)}</span>${serie ? `<span class="pcard-serie">${esc(serie)}</span>` : ""}</div>
    <h3 class="pcard-name">${esc(nombre)}</h3>
    <span class="pcard-sku figures"><span class="pcard-sku-lbl">Modelo</span> ${esc(p.sku)}</span>
    ${precioTarjeta(precio)}
  </div>
</a>`;
}

const QUOTE_CARD = `<div class="quote-card" data-cat-quote>
  <div class="eyebrow eyebrow-bright">Proyecto de cocina</div>
  <h3>¿Especificando una cocina <i>completa</i>?</h3>
  <p>Un especialista arma contigo el paquete por marca: medidas, cargas eléctricas, ventilación y paneles. Sin costo.</p>
  <a class="arrow-link light" href="/contacto">Cotizar con especialista <span class="ln"></span><span class="ar">→</span></a>
</div>`;

/** Orden por defecto: equipos antes que accesorios; dentro, de mayor a menor precio. */
function ordenar(productos: ProductoVivo[], tc: TipoCambio): ProductoVivo[] {
  const peso = (p: ProductoVivo) => (/^Accesorios/.test(p.tipo) ? 1 : 0);
  return [...productos].sort((a, b) => {
    const d = peso(a) - peso(b);
    if (d) return d;
    const pa = precioPublico(a, tc);
    const pb = precioPublico(b, tc);
    return (pb.mxnEquivalente ?? pb.venta) - (pa.mxnEquivalente ?? pa.venta);
  });
}

/** Rejilla de tarjetas con la tarjeta de lead después de la quinta pieza. */
export function rejillaHtml(productos: ProductoVivo[], tc: TipoCambio): string {
  const piezas = ordenar(productos, tc).map((p, i) => tarjetaHtml(p, tc, i));
  piezas.splice(Math.min(5, piezas.length), 0, QUOTE_CARD);
  piezas.push(
    `<p class="plp-aviso" data-cat-vacio hidden style="grid-column:1/-1">Aún no hay piezas publicadas con esa combinación. <a class="arrow-link" href="/contacto">Pregúntanos por ellas <span class="ln"></span><span class="ar">→</span></a></p>`,
  );
  return piezas.join("\n");
}

/* ---------- Panel de filtros --------------------------------------------- */

interface OpcionesPanel {
  /** Incluir el grupo "Tipo" (páginas de Subcategoría 1 con varios tipos). */
  conTipo?: boolean;
  /** Tipos del riel de la página, en su orden (también los que aún no tienen piezas). */
  tiposRiel?: { slug: string; nombre: string }[];
  /** Etiquetas con `data-tipo` = slug del valor, para el mosaico `?f=` de la PLP de tipo. */
  valoresComoTipo?: boolean;
}

/** Cuántos grupos arrancan desplegados; el resto se abre al tocar su título. */
const GRUPOS_ABIERTOS = 2;

/**
 * Un grupo del panel: <details> con el título como <summary>. Las casillas se
 * marcan sin filtrar; public/catalogo.js aplica al pulsar "Ver N piezas" (o al
 * instante cuando el riel / mosaico marcan un tipo). `data-fsel` muestra cuántas
 * casillas del grupo están activas aunque el grupo esté plegado.
 */
function grupoHtml(nombre: string, clave: string, etiquetas: string, abierto: boolean): string {
  return `<details class="fgroup fgroup--acc" data-fgroup="${esc(clave)}"${abierto ? " open" : ""}>
  <summary class="fgroup-sum"><h6>${esc(nombre)} <span class="fsel figures" data-fsel hidden>0</span></h6><span class="fgroup-caret" aria-hidden="true"></span></summary>
  <div class="fopts">${etiquetas}</div>
</details>`;
}

export function panelFiltrosHtml(
  productos: ProductoVivo[],
  { conTipo = false, tiposRiel = [], valoresComoTipo = false }: OpcionesPanel = {},
): string {
  const grupos: string[] = [];

  if (conTipo) {
    const cuenta = new Map<string, { nombre: string; n: number }>();
    for (const t of tiposRiel) cuenta.set(t.slug, { nombre: t.nombre, n: 0 });
    for (const p of productos) {
      const slug = tipoWeb(p.tipo)?.slugRiel ?? slugValor(p.tipo);
      const c = cuenta.get(slug) ?? { nombre: p.tipo, n: 0 };
      c.n++;
      cuenta.set(slug, c);
    }
    const etiquetas = [...cuenta]
      .map(
        ([slug, c]) =>
          `<label data-tipo="${esc(slug)}"><input type="checkbox" data-fk="tipo-web" value="${esc(slug)}"> <span class="flbl">${esc(c.nombre)}</span> <span class="count figures">${c.n}</span></label>`,
      )
      .join("");
    grupos.push(grupoHtml("Tipo", "tipo-web", etiquetas, true));
  }

  // Unión ordenada de los filtros de cada tipo presente (tabla de filtros v2).
  const defs: DefFiltro[] = [];
  for (const tipo of new Set(productos.map((p) => p.tipo))) {
    for (const d of DEFS[tipo] ?? []) {
      if (!defs.some((x) => x.clave === d.clave)) defs.push(d);
    }
  }
  if (!defs.length) defs.push({ nombre: "Marca", clave: "marca" });

  for (const d of defs) {
    if (d.clave === "precio" || d.clave === "compatible") continue;
    const cuenta = new Map<string, number>();
    for (const p of productos) {
      const valores = d.clave === "marca" ? [p.marca] : p.filtros[d.clave] ?? [];
      for (const v of valores) cuenta.set(v, (cuenta.get(v) ?? 0) + 1);
    }
    if (!cuenta.size) continue;
    // Un filtro con un solo valor no filtra nada: no se muestra.
    if (cuenta.size < 2 && d.clave !== "marca") continue;
    const etiquetas = [...cuenta]
      .sort((a, b) => a[0].localeCompare(b[0], "es", { numeric: true }))
      .map(
        ([v, n]) =>
          `<label${valoresComoTipo ? ` data-tipo="${esc(slugValor(v))}"` : ""}><input type="checkbox" data-fk="${esc(d.clave)}" value="${esc(slugValor(v))}"> <span class="flbl">${esc(v)}</span> <span class="count figures">${n}</span></label>`,
      )
      .join("");
    grupos.push(grupoHtml(d.nombre, d.clave, etiquetas, grupos.length < GRUPOS_ABIERTOS));
  }

  grupos.push(
    `<div class="fbar" data-cat-bar hidden>
  <button type="button" class="fbar-apply" data-cat-apply hidden>Ver <span data-cat-n>0</span> piezas</button>
  <button type="button" class="fbar-clear" data-cat-clear>Limpiar filtros</button>
</div>
<p class="fnote">Precios con IVA. Las piezas en dólares muestran su equivalente en pesos al tipo de cambio del día.</p>`,
  );
  return grupos.join("\n");
}

/** Texto inicial del conteo (catalogo.js lo actualiza al filtrar). */
export function conteoHtml(productos: ProductoVivo[]): string {
  const n = productos.length;
  return `${n} ${n === 1 ? "pieza" : "piezas"} en línea`;
}

/* ---------- Llamado a la acción ------------------------------------------ */

export function ctaHtml(p: ProductoVivo, decision: Decision, precio: PrecioPublico): string {
  const wa = whatsappHref(
    `¡Hola! Me interesa el ${p.marca} ${p.titulo} (modelo ${p.sku}). ¿Me pueden cotizar?`,
  );
  const numericId = p.variantId.split("/").pop() ?? "";

  // Modelo "Mi proyecto" (Carla, 2026-10-06): TODA pieza se agrega al proyecto.
  // Al cerrar, el proyecto va al pago de Shopify si cada pieza cumple la regla
  // (marca + monto + stock); si alguna se cotiza, el proyecto completo se manda
  // como cotización por WhatsApp. La regla se vuelve a evaluar en el servidor.
  const agregar = `<button class="btn btn-primary cart-add" type="button" data-cart-sku="${esc(p.sku)}" data-cart-vid="${esc(numericId)}" data-cart-name="${esc(p.titulo)}" data-cart-brand="${esc(p.marca)}" data-cart-spec="${esc(lineaSpec(p).join(" · "))}" data-cart-mxn="${p.mxn}" data-cart-usd="${esc(textoPrecio(precio))}" data-cart-img="${p.imagenes[0] ? esc(cdn(p.imagenes[0].url, 400)) : ""}" data-cart-href="/producto/${p.slug}">Agregar a mi proyecto</button>`;
  const cotizar = `<a class="btn btn-ghost" href="${esc(wa)}" target="_blank" rel="noopener" data-track="whatsapp_click" data-label="pdp_cotizar">Cotizar por WhatsApp</a>`;

  let nota: string;
  if (decision.accion === "comprar") {
    nota = p.enStock
      ? "En stock · se puede pagar en línea · IVA incluido · entrega coordinada con tu obra."
      : "Bajo pedido · se puede pagar en línea · IVA incluido · un especialista confirma el tiempo de entrega.";
  } else {
    nota =
      decision.motivo === "marca"
        ? `${esc(p.marca)} se cotiza con tu ejecutivo: agrégala a tu proyecto y envíalo por WhatsApp; te confirma tipo de cambio, descuento y tiempo de entrega.`
        : "Por su monto, esta pieza se cotiza con un especialista: agrégala a tu proyecto y envíalo por WhatsApp; te confirma tipo de cambio, descuento y tiempo de entrega.";
  }

  return `<div class="pdp-cta" style="display:flex;gap:16px;margin-top:16px;flex-wrap:wrap">
        ${agregar}
        ${cotizar}
      </div>
      <p class="note">${nota}</p>`;
}

/* ---------- Ficha completa ----------------------------------------------- */

const NOMBRES_FILTRO: Record<string, string> = {
  instalacion: "Instalación",
  diseno: "Diseño",
  funcionamiento: "Funcionamiento",
  ancho: "Ancho",
  acabado: "Acabado",
  tipo: "Tipo",
  compatible: "Compatible con",
  tipo_gas: "Tipo de gas",
  potencia: "Potencia",
  fabrica_hielos: "Fábrica de hielos",
  llenado_agua: "Llenado de agua",
  capacidad: "Capacidad",
  voltaje: "Voltaje",
  garantia: "Garantía",
};

/** "Columna de Refrigeración Panelable 24\" — Serie Expressive" → título con la serie en negritas. */
function tituloH1(titulo: string): string {
  const [base, serie] = titulo.split(" — ");
  return serie ? `${esc(base)} <b>${esc(serie)}</b>` : esc(titulo);
}

export function fichaHtml(
  p: ProductoVivo,
  tc: TipoCambio,
  relacionados: ProductoVivo[],
): string {
  const precio = precioPublico(p, tc);
  const decision = decisionDeCompra(p, precio);
  const tw = tipoWeb(p.tipo);
  const href = `/producto/${p.slug}`;
  const [principal, ...resto] = p.imagenes;

  const migas = [
    `<a href="/" style="color:var(--fg-muted);border-bottom:none">Inicio</a>`,
    ...(tw
      ? [
          `<a href="${tw.macro.ruta}" style="color:var(--fg-muted);border-bottom:none">${esc(tw.macro.nombre)}</a>`,
          `<a href="${tw.sub1.ruta}" style="color:var(--fg-muted);border-bottom:none">${esc(tw.sub1.nombre)}</a>`,
          `<a href="${tw.ruta}" style="color:var(--fg-muted);border-bottom:none">${esc(p.tipo)}</a>`,
        ]
      : []),
    `<span class="figures">${esc(p.marca)} ${esc(p.sku)}</span>`,
  ].join('<span class="sep" style="color:var(--homea-gold);padding:0 .6em">·</span>');

  const imagenPrincipal = principal
    ? `<img id="pdp-img" width="${principal.ancho}" height="${principal.alto}" srcset="${srcsetCdn(principal.url, principal.ancho)}" sizes="(max-width: 700px) 100vw, 50vw" fetchpriority="high" decoding="async" src="${cdn(principal.url, 960)}" alt="${esc(principal.alt)}">`
    : `<span class="ph" style="height:100%"><span class="ph-inner">${esc(p.tipo)}</span></span>`;

  const miniaturas = principal && resto.length
    ? `<div class="pdp-thumbs" role="list">${[principal, ...resto]
        .map(
          (im, i) =>
            `<button type="button" class="pdp-thumb${i === 0 ? " is-active" : ""}" role="listitem" data-src="${esc(cdn(im.url, 960))}" data-srcset="${esc(srcsetCdn(im.url, im.ancho))}" data-alt="${esc(im.alt)}" aria-label="Ver imagen ${i + 1}"><img src="${esc(cdn(im.url, 160))}" alt="" loading="lazy" decoding="async"></button>`,
        )
        .join("")}</div>`
    : "";

  const filas: [string, string][] = [
    ["Marca", p.marca],
    ["Tipo", p.tipo],
  ];
  for (const [clave, nombre] of Object.entries(NOMBRES_FILTRO)) {
    const v = p.filtros[clave];
    if (v?.length) filas.push([nombre, v.join(" · ")]);
  }
  filas.push(["Modelo", p.sku]);
  filas.push(["Disponibilidad", p.enStock ? "En stock · entrega inmediata" : "Bajo pedido · importación"]);

  const spec = filas
    .map(
      ([k, v]) =>
        `<div class="spec-row"><span class="spec-label">${esc(k)}</span><span class="spec-value figures">${esc(v)}</span></div>`,
    )
    .join("\n        ");

  const relacionadosHtml = relacionados.length
    ? `<section class="sec"><div class="container">
  <div class="sec-head-row">
    <div class="sec-head">
      <div class="eyebrow">Curaduría · Relacionados</div>
      <span class="rule-gold"></span>
      <h2>Más de <b>${esc(p.tipo.toLowerCase())}</b>.</h2>
    </div>
    ${tw ? `<a class="arrow-link" href="${tw.ruta}">Ver ${esc(p.tipo)} <span class="ln"></span><span class="ar">→</span></a>` : ""}
  </div>
  <div class="grid-3" style="margin-top:64px">
${relacionados.map((r, i) => tarjetaHtml(r, tc, i)).join("\n")}
  </div>
</div></section>`
    : "";

  return `<section class="sec tight" style="padding-top:40px"><div class="container">
  <div class="crumbs" style="font-size:12px;color:var(--fg-muted);margin-bottom:36px">${migas}</div>

  <div class="pdp">
    <div class="gallery">
      <div class="main pdp-cutout"><button class="wl-heart" type="button" data-wl-id="${esc(p.sku)}" data-wl-brand="${esc(p.marca)}" data-wl-name="${esc(p.titulo)}" data-wl-spec="${esc(lineaSpec(p).join(" · "))}" data-wl-price="${esc(textoPrecio(precio))}" data-wl-img="${principal ? esc(cdn(principal.url, 400)) : ""}" data-wl-href="${href}" aria-label="Guardar en wishlist" aria-pressed="false">${CORAZON}</button>${imagenPrincipal}</div>
      ${miniaturas}
    </div>
    <div class="info">
      <div class="eyebrow">${esc(p.marca)}${tw ? ` · ${esc(tw.sub1.nombre)}` : ""} · ${esc(p.tipo)}</div>
      <span class="rule-gold"></span>
      <h1>${tituloH1(p.titulo)}</h1>
      ${p.lead ? `<p class="lead-serif">${esc(p.lead)}</p>` : ""}
      ${precioFichaHtml(precio, tc)}

      <div class="spec" style="width:100%;margin-top:8px">
        ${spec}
      </div>

      ${ctaHtml(p, decision, precio)}
    </div>
  </div>
</div></section>

<section class="sec tight on-greige"><div class="container">
  <div class="split">
    <div class="text">
      <div class="eyebrow">Especificación · Sin costo</div>
      <span class="rule-gold"></span>
      <h2>Esta pieza se especifica <i>con un experto</i>.</h2>
      <p style="margin:0;color:var(--fg-muted)">Medidas, cargas eléctricas, ventilación y paneles: un asesor revisa tu plano antes de confirmar el pedido, para que llegue bien a la primera.</p>
      <a class="arrow-link" href="/contacto">Hablar con un asesor <span class="ln"></span><span class="ar">→</span></a>
    </div>
    <div class="imgw" style="aspect-ratio:16/10"><img width="1200" height="1600" srcset="/assets/photos/proyecto-1-400.webp 400w, /assets/photos/proyecto-1-640.webp 640w, /assets/photos/proyecto-1-960.webp 960w, /assets/photos/proyecto-1.webp 1200w" sizes="(max-width: 700px) 100vw, 50vw" loading="lazy" decoding="async" src="/assets/photos/proyecto-1.webp" alt="Integración panelable en encino, proyecto HOMEA"></div>
  </div>
</div></section>

${relacionadosHtml}`;
}
