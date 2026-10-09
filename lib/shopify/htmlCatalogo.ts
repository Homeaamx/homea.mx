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

import { existsSync } from "node:fs";
import { join } from "node:path";

import filtrosWeb from "@/data/filtros-web.json";
import marcasJson from "@/data/marcas.json";
import type { Decision } from "@/lib/reglas/reglaMarca";
import type { TipoCambio } from "@/lib/tipoCambio";

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

/* ---------- Logo de marca ------------------------------------------------- */

const normMarca = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

/**
 * Logo original (a color) de la marca para la cabecera de la ficha:
 * public/assets/logos/color/<slug>.* — los mismos del directorio de garantías.
 * Los de /assets/logos/<slug>.webp son blancos (van sobre foto) y no sirven aquí.
 */
function logoDeMarca(vendor: string): string | null {
  type MarcaMin = { slug: string; nombre: string };
  const crudo = marcasJson as unknown as MarcaMin[] | { marcas: MarcaMin[] };
  const lista: MarcaMin[] = Array.isArray(crudo) ? crudo : (crudo.marcas ?? []);
  const n = normMarca(vendor);
  const m = lista.find((x) => normMarca(x.nombre) === n || normMarca(x.slug) === n);
  const slug = m?.slug ?? vendor.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  for (const ext of ["webp", "png", "jpg", "svg"]) {
    const ruta = `/assets/logos/color/${slug}.${ext}`;
    if (existsSync(join(process.cwd(), "public", ruta))) return ruta;
  }
  return null;
}

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
export function lineaSpec(p: ProductoVivo): string[] {
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
  // Orden pedido (Carla, 2026-10-07): precio final arriba, tachado debajo, "IVA
  // incluido" al final.
  const tachado = precio.tachado
    ? `<s class="price-was figures">$${dinero(precio.tachado)} ${precio.moneda}</s>`
    : "";
  return `<div class="pcard-price"><span class="price-tag figures">$${dinero(precio.venta)}<span class="currency">${precio.moneda}</span></span>${tachado}<span class="price-note">IVA incluido</span></div>`;
}

export function precioFichaHtml(precio: PrecioPublico, tc: TipoCambio): string {
  const tachado = precio.tachado
    ? `<s class="pdp-was figures">$${dinero(precio.tachado)} ${precio.moneda}</s>`
    : "";
  const equivalencia =
    precio.moneda === "USD" && precio.mxnEquivalente !== null
      ? `<p class="note figures pdp-mxn">≈ $${dinero(precio.mxnEquivalente)} MXN IVA incluido · TC ${tc.valor.toFixed(2)}${tc.fecha ? ` · ${esc(tc.fecha)}` : ""}</p>`
      : "";
  return `<div class="pdp-precio">
      <span class="price-big figures"><b>$${dinero(precio.venta)}</b><span class="currency">${precio.moneda}</span> <span class="price-note">IVA incluido</span></span>
      ${tachado}
      ${equivalencia}
    </div>`;
}

/* ---------- Tarjeta ------------------------------------------------------- */

/**
 * ¿La imagen es un plano o ficha técnica y no una foto del aparato? Las de
 * Gaggenau se suben con "Plano de medidas: …" en el alt y "-plano-medidas-" en
 * el nombre de archivo (Line_Drawings de BSH). La tarjeta nunca muestra planos.
 */
/** Lo que va en "Productos relacionados" de la ficha. */
export type Relacionados = { modo: "sugerencias" | "similares"; productos: ProductoVivo[] };

export function esImagenTecnica(im: { url: string; alt: string }): boolean {
  const archivo = im.url.split("?")[0].split("/").pop() ?? "";
  return /^plano|^ficha|^diagrama/i.test(im.alt) || /(^|-)(plano|ficha-tecnica|line-drawing|diagrama)(-|\.)/i.test(archivo);
}

export function tarjetaHtml(p: ProductoVivo, tc: TipoCambio, orden = 0): string {
  const precio = precioPublico(p, tc);
  const decision = decisionDeCompra(p, precio);
  const href = `/producto/${p.slug}`;
  // Foto del aparato primero; los planos solo si no hay ninguna foto.
  const img = p.imagenes.find((im) => !esImagenTecnica(im)) ?? p.imagenes[0];
  const spec = lineaSpec(p);
  const tw = tipoWeb(p.tipo);

  // Valores de filtro para public/catalogo.js (slugs separados por espacio).
  const atributos: string[] = [
    `data-cat-card`,
    `data-orden="${orden}"`,
    `data-precio="${precio.mxnEquivalente ?? precio.venta}"`,
    // Para ordenar por inventario (public/catalogo.js): 1 = en stock, 0 = bajo pedido.
    `data-stock="${p.enStock ? 1 : 0}"`,
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
    ? `<span class="pcard-tag is-stock">EN STOCK</span>`
    : `<span class="pcard-tag is-pedido">Bajo pedido</span>`;

  // Solo lo que decide una compra, en este orden (Carla, 2026-10-06): marca y
  // línea · disponibilidad · nombre · modelo · precio tachado y precio final.
  // La foto ocupa todo el recuadro (2026-10-08): disponibilidad y corazón van
  // en el renglón superior del cuerpo, nunca encima del aparato.
  return `<a class="pcard" href="${href}" ${atributos.join(" ")} data-accion="${decision.accion}">
  <div class="imgw cutout">${imagen}</div>
  <div class="body">
    <div class="pcard-top">${stock}<button class="wl-heart" type="button" data-wl-id="${esc(p.sku)}" data-wl-brand="${esc(p.marca)}" data-wl-name="${esc(p.titulo)}" data-wl-spec="${esc(spec.join(" · "))}" data-wl-price="${esc(textoPrecio(precio))}" data-wl-img="${img ? esc(cdn(img.url, 400)) : ""}" data-wl-href="${href}" data-wl-tipo="${esc(p.tipo)}" data-wl-vid="${esc(p.variantId.split("/").pop() ?? "")}" aria-label="Guardar en wishlist" aria-pressed="false">${CORAZON}</button></div>
    <div class="pcard-head"><span class="brand">${esc(p.marca)}</span>${serie ? `<span class="pcard-serie">${esc(serie)}</span>` : ""}</div>
    <h3 class="pcard-name">${esc(nombre)}</h3>
    <span class="pcard-sku figures">${esc(p.sku)}</span>
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

/** Precio con IVA en pesos (equivalente al FIX si la lista es en dólares): la cifra por la que se filtra. */
let tcPanel: TipoCambio | null = null;
function precioRefMxn(p: ProductoVivo): number {
  if (!tcPanel) return 0;
  const precio = precioPublico(p, tcPanel);
  return precio.mxnEquivalente ?? precio.venta;
}

/* ---------- Panel de filtros --------------------------------------------- */

const fmtPesos = (n: number) => `$${n.toLocaleString("es-MX")}`;

/** Cifra "redonda" para el corte de un rango (48,300 → 50,000; 437,000 → 450,000). */
function redondo(v: number): number {
  if (v <= 0) return 0;
  const paso = 10 ** Math.floor(Math.log10(v)) / 2;
  return Math.round(v / paso) * paso;
}

/**
 * Rangos de precio PROPORCIONALES (Carla, 2026-10-08): los cortes salen de los
 * cuantiles de los precios de la página, así cada rango junta más o menos el
 * mismo número de piezas, y se redondean a cifras legibles. Hasta 5 rangos; el
 * último llega hasta el producto más caro (redondeado hacia arriba al millar,
 * el mismo tope del slider). Se calculan aquí con los precios de Shopify
 * (en pesos con IVA, los de dólares a su equivalente del día): no hace falta
 * ningún dato extra en Shopify.
 */
export function rangosPrecio(precios: number[], maxRangos = 5): { lo: number; hi: number }[] {
  const v = precios.filter((n) => n > 0).sort((a, b) => a - b);
  if (v.length < 2) return [];
  const k = Math.min(maxRangos, v.length);
  const cortes: number[] = [];
  for (let i = 1; i < k; i++) {
    const c = redondo(v[Math.floor((i * v.length) / k)]);
    if (c > (cortes[cortes.length - 1] ?? 0) && c < v[v.length - 1]) cortes.push(c);
  }
  if (!cortes.length) return [];
  // Tope = precio más caro redondeado hacia arriba al millar (+1 000 si cae
  // justo en millar, para que esa pieza quede dentro: los rangos son [lo, hi)).
  const tope = Math.floor(v[v.length - 1] / 1000) * 1000 + 1000;
  return [0, ...cortes].map((lo, i) => ({ lo, hi: cortes[i] ?? tope }));
}

interface OpcionesPanel {
  /** Tipo de cambio del día, para el tope del grupo Precio. */
  tc?: TipoCambio;
  /** Incluir el grupo "Tipo" (páginas de Subcategoría 1 con varios tipos). */
  conTipo?: boolean;
  /** Tipos del riel de la página, en su orden (también los que aún no tienen piezas). */
  tiposRiel?: { slug: string; nombre: string }[];
  /** Etiquetas con `data-tipo` = slug del valor, para el mosaico `?f=` de la PLP de tipo. */
  valoresComoTipo?: boolean;
}

/** Todos los grupos arrancan plegados (Carla, 2026-10-07): se abren al tocar su título. */
const GRUPOS_ABIERTOS = 0;

/**
 * Un grupo del panel: <details> con el título como <summary>. Las casillas se
 * marcan sin filtrar; public/catalogo.js aplica al pulsar "Ver N piezas" (o al
 * instante cuando el riel / mosaico marcan un tipo). `data-fsel` muestra cuántas
 * casillas del grupo están activas aunque el grupo esté plegado.
 */
function grupoHtml(nombre: string, clave: string, etiquetas: string, abierto: boolean, ocultarCero = false): string {
  return `<details class="fgroup fgroup--acc" data-fgroup="${esc(clave)}"${abierto ? " open" : ""}${ocultarCero ? " data-ocultar-cero" : ""}>
  <summary class="fgroup-sum"><h6>${esc(nombre)} <span class="fsel figures" data-fsel hidden>0</span></h6><span class="fgroup-caret" aria-hidden="true"></span></summary>
  <div class="fopts">${etiquetas}</div>
</details>`;
}

export function panelFiltrosHtml(
  productos: ProductoVivo[],
  { tc, conTipo = false, tiposRiel = [], valoresComoTipo = false }: OpcionesPanel = {},
): string {
  tcPanel = tc ?? null;
  // Filtros aplicados, arriba del todo (como "Ahora comprando por" de Artexa):
  // catalogo.js lo llena con un chip por valor y "Eliminar todo".
  const grupos: string[] = [
    `<div class="fchips fchips--panel" data-cat-chips hidden></div>
<div class="fhead"><h6>Filtros</h6></div>`,
  ];

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
    grupos.push(grupoHtml("Tipo de producto", "tipo-web", etiquetas, false));
  }

  // Unión ordenada de los filtros de cada tipo presente (tabla de filtros v2).
  const defs: DefFiltro[] = [];
  for (const tipo of new Set(productos.map((p) => p.tipo))) {
    for (const d of DEFS[tipo] ?? []) {
      if (!defs.some((x) => x.clave === d.clave)) defs.push(d);
    }
  }
  if (!defs.length) defs.push({ nombre: "Marca", clave: "marca" });

  // Se muestran TODOS los filtros de la tabla de la subcategoría (Carla,
  // 2026-10-07), aunque las piezas publicadas aún no traigan ese dato: el grupo
  // sale plegado con la nota "Sin opciones por ahora" y se llena solo cuando
  // Shopify tenga valores.
  for (const d of defs) {
    if (d.clave === "compatible") continue;
    if (d.clave === "precio") {
      const precios = productos.map((p) => precioRefMxn(p)).filter((n) => n > 0);
      const max = Math.ceil(Math.max(0, ...precios) / 1000) * 1000;
      // Rangos proporcionales como casillas (suman entre sí) + el slider de siempre.
      const rangosHtml = rangosPrecio(precios)
        .map(({ lo, hi }) => {
          const n = precios.filter((x) => x >= lo && x < hi).length;
          const txt = lo === 0 ? `Hasta ${fmtPesos(hi)}` : `${fmtPesos(lo)} – ${fmtPesos(hi)}`;
          return `<label><input type="checkbox" data-fk="precio-rango" value="${lo}-${hi}"> <span class="flbl figures">${txt}</span> <span class="count figures">${n}</span></label>`;
        })
        .join("");
      grupos.push(
        grupoHtml(
          d.nombre,
          "precio",
          `${rangosHtml}<div class="fprecio" data-cat-precio data-max="${max}">
      <div class="fprecio-slider">
        <span class="fprecio-track"></span><span class="fprecio-fill" data-fp-fill></span>
        <input type="range" min="0" max="${max}" step="1000" value="0" data-fr="min" aria-label="Precio mínimo">
        <input type="range" min="0" max="${max}" step="1000" value="${max}" data-fr="max" aria-label="Precio máximo">
      </div>
      <div class="fprecio-campos">
        <label class="fprecio-campo"><span class="flbl">Desde</span><input type="number" inputmode="numeric" min="0" max="${max}" step="1000" placeholder="0" data-fp="min" aria-label="Precio mínimo en pesos"></label>
        <span class="fprecio-sep">—</span>
        <label class="fprecio-campo"><span class="flbl">Hasta</span><input type="number" inputmode="numeric" min="0" max="${max}" step="1000" placeholder="${max.toLocaleString("es-MX")}" data-fp="max" aria-label="Precio máximo en pesos"></label>
      </div>
    </div>
    <p class="fnote fnote--tight">Precios en MXN con IVA, los productos en dólares se calculan con su tipo de cambio al día.</p>`,
          false,
        ),
      );
      continue;
    }
    const cuenta = new Map<string, number>();
    for (const p of productos) {
      const valores = d.clave === "marca" ? [p.marca] : p.filtros[d.clave] ?? [];
      for (const v of valores) cuenta.set(v, (cuenta.get(v) ?? 0) + 1);
    }
    if (!cuenta.size) {
      grupos.push(
        grupoHtml(d.nombre, d.clave, `<p class="fnote fnote--tight">Sin opciones por ahora.</p>`, false),
      );
      continue;
    }
    const etiquetas = [...cuenta]
      .sort((a, b) => a[0].localeCompare(b[0], "es", { numeric: true }))
      .map(
        ([v, n]) =>
          `<label${valoresComoTipo ? ` data-tipo="${esc(slugValor(v))}"` : ""}><input type="checkbox" data-fk="${esc(d.clave)}" value="${esc(slugValor(v))}"> <span class="flbl">${esc(v)}</span> <span class="count figures">${n}</span></label>`,
      )
      .join("");
    // Marca (Carla, 2026-10-08): caja "Busca por marca" y solo las marcas que
    // aplican con los demás filtros (catalogo.js oculta las que darían 0).
    const buscador =
      d.clave === "marca"
        ? `<label class="fbuscar"><span class="sr-only">Busca por marca</span><input type="search" placeholder="Busca por marca" autocomplete="off" data-fbuscar></label>`
        : "";
    grupos.push(grupoHtml(d.nombre, d.clave, buscador + etiquetas, grupos.length - 1 < GRUPOS_ABIERTOS, d.clave === "marca"));
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
  const numericId = p.variantId.split("/").pop() ?? "";

  // Modelo "Mi proyecto" (Carla, 2026-10-06): TODA pieza se agrega al proyecto.
  // Al cerrar, el proyecto va al pago de Shopify si cada pieza cumple la regla
  // (marca + monto + stock); si alguna se cotiza, el proyecto completo se manda
  // como cotización por WhatsApp. La regla se vuelve a evaluar en el servidor.
  const agregar = `<button class="btn btn-primary cart-add" type="button" data-cart-sku="${esc(p.sku)}" data-cart-vid="${esc(numericId)}" data-cart-name="${esc(p.titulo)}" data-cart-brand="${esc(p.marca)}" data-cart-spec="${esc(lineaSpec(p).join(" · "))}" data-cart-mxn="${p.mxn}" data-cart-usd="${esc(textoPrecio(precio))}" data-cart-img="${p.imagenes[0] ? esc(cdn(p.imagenes[0].url, 400)) : ""}" data-cart-href="/producto/${p.slug}">Agregar a mi proyecto</button>`;
  let nota: string;
  if (decision.accion === "comprar") {
    nota = p.enStock
      ? "En stock · se puede pagar en línea · IVA incluido · entrega coordinada con tu obra."
      : "Bajo pedido · se puede pagar en línea · IVA incluido · un especialista confirma el tiempo de entrega.";
  } else {
    nota =
      "Este producto se cotiza con un ejecutivo: agrégalo a tu proyecto y envíalo por WhatsApp; te confirmamos tipo de cambio, descuento aplicado y tiempo de entrega.";
  }

  const unidades = `<div class="pdp-qty" role="group" aria-label="Unidades">
          <button type="button" class="pdp-qty-btn" data-qty-menos aria-label="Una menos">−</button>
          <input type="number" class="pdp-qty-num figures" data-cart-qty value="1" min="1" max="99" inputmode="numeric" aria-label="Unidades">
          <button type="button" class="pdp-qty-btn" data-qty-mas aria-label="Una más">+</button>
        </div>`;
  return `<div class="pdp-cta" style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap;align-items:stretch">
        ${unidades}
        ${agregar}
      </div>
      <p class="note">${nota}</p>`;
}

/* ---------- Ficha completa ----------------------------------------------- */

/**
 * Nombre visible de cada filtro en la tabla de Características, en el orden en
 * que se listan. La bisagra / apertura va arriba a propósito (Carla, 2026-10-07):
 * en refrigeración y hornos es lo primero que se revisa.
 */
const NOMBRES_FILTRO: Record<string, string> = {
  instalacion: "Instalación",
  diseno: "Diseño",
  funcionamiento: "Funcionamiento",
  bisagra: "Bisagra / apertura",
  ancho: "Ancho",
  altura: "Altura",
  profundidad: "Profundidad",
  acabado: "Acabado",
  material: "Material",
  puerta: "Puerta",
  capacidad: "Capacidad",
  zonas: "Zonas de temperatura",
  fabrica_hielos: "Fábrica de hielos",
  tipo_hielo: "Tipo de hielo",
  produccion: "Producción diaria",
  despachador_agua: "Despachador de agua",
  llenado_agua: "Llenado de agua",
  drenaje: "Drenaje",
  tipo: "Tipo",
  compatible: "Compatible con",
  tipo_gas: "Tipo de gas",
  cubierta: "Configuración de cubierta",
  hornos: "Número de hornos",
  horneado: "Tipo de horneado",
  potencia: "Potencia",
  extraccion: "Tipo de extracción",
  motor: "Motor",
  accesorios_incluidos: "Accesorios",
  racks: "Racks",
  tina: "Interior de tina",
  carga: "Tipo de carga",
  tecnologia: "Tecnología",
  variedades_cafe: "Variedades de café",
  uso: "Uso",
  voltaje: "Voltaje",
  ruido: "Nivel de ruido",
  garantia: "Garantía",
  promocion: "Promoción",
};

/** "Columna de Refrigeración Panelable 24\" — Serie Expressive" → título con la serie en negritas. */
function tituloH1(titulo: string): string {
  return `<b>${esc(nombreYSerie(titulo).nombre)}</b>`;
}

/** Renglón bajo el título: la línea a la izquierda y el modelo a la derecha. */
function serieYModeloHtml(p: ProductoVivo): string {
  const { serie } = nombreYSerie(p.titulo);
  return `<div class="pdp-serie-row"><span class="pdp-h1-serie">${serie ? esc(serie) : ""}</span><span class="pdp-sku figures"><span class="pdp-sku-lbl">Modelo</span> ${esc(p.sku)}</span></div>`;
}

/**
 * Descripción de Shopify con su marcado, pero solo etiquetas de texto: párrafos,
 * listas, negritas y saltos. Todo lo demás (scripts, estilos, atributos) se quita.
 */
function htmlSeguro(html: string): string {
  const PERMITIDAS = new Set(["p", "ul", "ol", "li", "strong", "b", "em", "i", "br"]);
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/?([a-zA-Z0-9]+)[^>]*>/g, (tag, nombre: string) => {
      const n = nombre.toLowerCase();
      if (!PERMITIDAS.has(n)) return "";
      return tag.startsWith("</") ? `</${n}>` : n === "br" ? "<br>" : `<${n}>`;
    });
}

/** Pestañas bajo la galería: Características · Dimensiones · Fichas técnicas. */
function pestanasHtml(p: ProductoVivo, spec: string): string {
  const filas = (lista: { nombre: string; valor: string }[]) =>
    lista
      .map(
        (d) =>
          `<div class="spec-row"><span class="spec-label">${esc(d.nombre)}</span><span class="spec-value figures">${esc(d.valor)}</span></div>`,
      )
      .join("\n");
  const dimProducto = p.dimensiones.length
    ? `<h6 class="pdp-tab-sub">Dimensiones del producto</h6><div class="spec">${filas(p.dimensiones)}</div>`
    : "";
  const dimEmpaque = p.empaque.length
    ? `<h6 class="pdp-tab-sub">Dimensiones del empaque</h6><div class="spec">${filas(p.empaque)}</div>`
    : "";
  const dimensiones =
    dimProducto || dimEmpaque
      ? `${dimProducto}${dimEmpaque}`
      : `<p class="pdp-tab-aviso">Para más información sobre las dimensiones de este producto, favor de contactar a tu asesor de ventas.</p>`;
  // Especificaciones técnicas: un botón por documento oficial. Si de una marca
  // solo se consigue uno de los dos, se muestra solo ese.
  const boton = (f: { url: string }, texto: string, n: number) =>
    `<a class="pdp-doc" href="${esc(f.url)}" target="_blank" rel="noopener"><span class="pdp-doc-ic" aria-hidden="true"></span>${texto}${n > 1 ? ` ${n}` : ""}<span class="ar">→</span></a>`;
  const docs = [
    ...p.fichas.map((f, i) => boton(f, "Ficha técnica de producto", i + 1)),
    ...p.instalacion.map((f, i) => boton(f, "Instrucciones de instalación", i + 1)),
  ];
  const fichas = docs.length
    ? `<div class="pdp-docs">${docs.join("")}</div>`
    : `<p class="pdp-tab-aviso">Para más información sobre las especificaciones técnicas de este producto, favor de contactar a tu asesor de ventas.</p>`;

  const tabs: [string, string, string][] = [
    ["caracteristicas", "Características", `<div class="spec">${spec}</div>`],
    ["dimensiones", "Dimensiones", dimensiones],
    ["fichas", "Especificaciones técnicas", fichas],
  ];
  return `<div class="pdp-tabs" data-pdp-tabs>
        <div class="pdp-tablist" role="tablist">${tabs
          .map(
            ([id, nombre], i) =>
              `<button type="button" role="tab" id="tab-${id}" aria-controls="panel-${id}" aria-selected="${i === 0}" class="pdp-tab${i === 0 ? " is-active" : ""}" data-tab="${id}">${nombre}</button>`,
          )
          .join("")}</div>
        ${tabs
          .map(
            ([id, , html], i) =>
              `<div role="tabpanel" id="panel-${id}" aria-labelledby="tab-${id}" class="pdp-panel${i === 0 ? " is-active" : ""}"${i === 0 ? "" : " hidden"}>${html}</div>`,
          )
          .join("\n")}
      </div>`;
}

export function fichaHtml(
  p: ProductoVivo,
  tc: TipoCambio,
  relacionados: Relacionados,
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

  const logo = logoDeMarca(p.marca);
  const cabecera = logo
    ? `<img class="pdp-logo" src="${esc(logo)}" alt="${esc(p.marca)}" loading="eager" decoding="async">`
    : `<div class="eyebrow">${esc(p.marca)}</div>`;
  const etiquetaStock = p.enStock
    ? `<span class="pcard-tag pdp-tag is-stock">EN STOCK</span>`
    : `<span class="pcard-tag pdp-tag is-pedido">Bajo pedido</span>`;
  const descripcionLarga = p.descripcionHtml || p.descripcion
    ? `<div class="pdp-desc"><div class="eyebrow">Descripción</div>${
        p.descripcionHtml
          ? htmlSeguro(p.descripcionHtml)
          : `<p>${esc(p.descripcion).replace(/\n+/g, "</p><p>")}</p>`
      }</div>`
    : "";

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

  // Sugerencias de compra del catálogo; si no hay, similares del mismo tipo.
  const sugerencias = relacionados.modo === "sugerencias";
  const relacionadosHtml = relacionados.productos.length
    ? `<section class="sec"><div class="container">
  <div class="sec-head-row">
    <div class="sec-head">
      <div class="eyebrow">Productos relacionados</div>
      <span class="rule-gold"></span>
      <h2>${sugerencias ? "Sugerencias de <b>compra</b>." : `Más <b>${esc(p.tipo.toLowerCase())}</b>.`}</h2>
    </div>
    ${!sugerencias && tw ? `<a class="arrow-link" href="${tw.ruta}">Ver ${esc(p.tipo)} <span class="ln"></span><span class="ar">→</span></a>` : ""}
  </div>
  <div class="grid-3" style="margin-top:64px">
${relacionados.productos.map((r, i) => tarjetaHtml(r, tc, i)).join("\n")}
  </div>
</div></section>`
    : "";

  return `<section class="sec tight" style="padding-top:40px"><div class="container">
  <div class="crumbs" style="font-size:12px;color:var(--fg-muted);margin-bottom:36px">${migas}</div>

  <div class="pdp">
    <div class="gallery">
      <div class="gallery-sticky">
      <div class="main pdp-cutout" data-pdp-zoom role="button" tabindex="0" aria-label="Ampliar imagen"><button class="wl-heart" type="button" data-wl-id="${esc(p.sku)}" data-wl-brand="${esc(p.marca)}" data-wl-name="${esc(p.titulo)}" data-wl-spec="${esc(lineaSpec(p).join(" · "))}" data-wl-price="${esc(textoPrecio(precio))}" data-wl-img="${principal ? esc(cdn(principal.url, 400)) : ""}" data-wl-href="${href}" data-wl-tipo="${esc(p.tipo)}" data-wl-vid="${esc(p.variantId.split("/").pop() ?? "")}" aria-label="Guardar en wishlist" aria-pressed="false">${CORAZON}</button>${imagenPrincipal}</div>
      ${miniaturas}
      </div>
      ${pestanasHtml(p, spec)}
    </div>
    <div class="info">
      ${cabecera}
      <span class="rule-gold"></span>
      <div class="pdp-titulo"><h1>${tituloH1(p.titulo)}</h1>${etiquetaStock}</div>
      ${serieYModeloHtml(p)}
      ${p.lead ? `<p class="lead-serif">${esc(p.lead)}</p>` : ""}
      ${precioFichaHtml(precio, tc)}
      ${descripcionLarga}

      ${ctaHtml(p, decision, precio)}
    </div>
  </div>
</div></section>

<!-- Aquí irá la conexión a Syndigo (contenido enriquecido del fabricante) para las
     marcas que la tengan; mientras, se pasa directo a Productos relacionados. -->

${relacionadosHtml}`;
}
