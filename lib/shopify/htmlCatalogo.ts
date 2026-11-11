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
import descuentosMarca from "@/data/descuentos-marca.json";
import type { Decision } from "@/lib/reglas/reglaMarca";
import type { TipoCambio } from "@/lib/tipoCambio";
import { TONOS_ESTANDAR, type Tono } from "@/lib/coloresMarca";
import { coloresDeModelo, muestraFiltroColor, type ColorHermano } from "@/lib/coloresModelo";
import { IMAGEN_RESPALDO } from "@/lib/imagenRespaldo";

import { TIPOS_WEB, esAccesorio, tileDePieza, tipoDePieza, tipoWeb } from "./coleccionesWeb";
import { clasificarDimensiones } from "./dimensiones";
import { otrosColores } from "./sugerencias";
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

/**
 * Valor numérico de una opción de filtro para ordenarla: '24"' → 24,
 * "15 1/2\"" → 15.5, "0.75 HP" → 0.75, "1,200 CFM" → 1200. "Hasta 45 cm" y
 * "Menor a 24\"" van justo antes de su número; "Más de 100 cm", justo después.
 * Texto sin número al inicio → null.
 */
function numeroDeValor(v: string): number | null {
  const s = v.trim().toLowerCase();
  const num = (t: string) => {
    const m = t.match(/^(\d[\d,]*(?:\.\d+)?)(?:\s+(\d+)\/(\d+))?|^(\d+)\/(\d+)/);
    if (!m) return null;
    if (m[4]) return Number(m[4]) / Number(m[5]);
    return Number(m[1].replace(/,/g, "")) + (m[2] ? Number(m[2]) / Number(m[3]) : 0);
  };
  const tope = s.match(/^(hasta|menor a|menos de)\s+(.*)$/);
  if (tope) return (num(tope[2]) ?? NaN) - 0.001;
  const piso = s.match(/^(más de|mas de|mayor a)\s+(.*)$/);
  if (piso) return (num(piso[2]) ?? NaN) + 0.001;
  return num(s);
}

/**
 * Orden de las opciones de los filtros (Carla, 2026-11-02): siempre de menor a
 * mayor y de la A a la Z. Los números van primero; el texto, después y alfabético.
 */
export function ordenValores(a: string, b: string): number {
  const na = numeroDeValor(a);
  const nb = numeroDeValor(b);
  const va = na !== null && !Number.isNaN(na);
  const vb = nb !== null && !Number.isNaN(nb);
  // Un filtro compartido puede mezclar unidades (Capacidad: botellas de cava y
  // libras de máquina de hielo): cada unidad va junta y en su orden.
  // Solo cuenta como unidad lo que va tras el número ("27 lb", "51 a 100",
  // "Hasta 400 CFM"); "2 tinas iguales" no tiene unidad y se ordena por número.
  const unidad = (v: string) => {
    const resto = v.trim().replace(/^(hasta|menor a|menos de|más de|mas de|mayor a)\s+/i, "");
    const m = resto.match(/^[\d.,/\s]+(?:a\s+[\d.,/]+\s*)?([a-záéíóúñ"%°]*)\s*$/i);
    return m ? m[1].toLowerCase().replace(/(.{2,})s$/, "$1") : null;
  };
  const ua = unidad(a);
  const ub = unidad(b);
  if (va && vb && ua !== null && ub !== null && ua !== ub) return ua.localeCompare(ub, "es");
  if (va && vb && na !== nb) return na! - nb!;
  if (va !== vb) return va ? -1 : 1;
  return a.localeCompare(b, "es", { sensitivity: "base", numeric: true });
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

const MAS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';

/* Disponibilidad (Carla, 2026-10-22): ícono + texto. En stock = palomita en
   círculo sobre verde olivo (2026-10-29); Bajo pedido = reloj sobre rojo oscuro. Las mismas figuras van en
   public/wishlist.js. */
const ICONO_STOCK =
  '<svg class="pcard-tag-ic" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7.2" fill="currentColor"/><path class="ic-check" d="m4.9 8.2 2.1 2.1 4.1-4.4" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICONO_PEDIDO =
  '<svg class="pcard-tag-ic" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 4.6V8l2.4 1.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/** Etiqueta En stock / Bajo pedido y, con inventario, cuántas piezas quedan. */
function etiquetaDisponibilidad(p: ProductoVivo, clase = ""): string {
  const extra = clase ? ` ${clase}` : "";
  // Las dos van en .pcard-disp: en la tarjeta la etiqueta ocupa el mismo renglón
  // de 34px (alineada con "+" y corazón) haya o no piezas debajo.
  if (!p.enStock) return `<span class="pcard-disp"><span class="pcard-tag${extra} is-pedido">${ICONO_PEDIDO}Bajo pedido</span></span>`;
  const piezas = p.piezas
    ? `<span class="pcard-piezas figures">${p.piezas === 1 ? "Queda 1 pieza" : `Quedan ${p.piezas} piezas`}</span>`
    : "";
  return `<span class="pcard-disp"><span class="pcard-tag${extra} is-stock">${ICONO_STOCK}En stock</span>${piezas}</span>`;
}

/* ---------- Logo de marca ------------------------------------------------- */

const normMarca = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

/**
 * Logo original (a color) de la marca para la cabecera de la ficha.
 *
 * REGLA (Carla, 2026-10-23): en la ficha toda marca de la tienda va SIN FONDO.
 * El logo sale de public/assets/logos/ficha/<slug>.webp, recortado al trazo
 * (lo genera scripts/logo-ficha.py) y con su alto en styles/theme.css
 * (.pdp-logo[data-marca="<slug>"]). Mientras una marca no lo tenga se usa el de
 * public/assets/logos/color/<slug>.* (directorio de garantías, con fondo) y el
 * build avisa en consola. Los de /assets/logos/<slug>.webp son blancos (van
 * sobre foto) y no sirven aquí.
 */
const avisadosSinFicha = new Set<string>();
function logoDeMarca(vendor: string): { ruta: string; slug: string; sinFondo: boolean } | null {
  type MarcaMin = { slug: string; nombre: string };
  const crudo = marcasJson as unknown as MarcaMin[] | { marcas: MarcaMin[] };
  const lista: MarcaMin[] = Array.isArray(crudo) ? crudo : (crudo.marcas ?? []);
  const n = normMarca(vendor);
  const m = lista.find((x) => normMarca(x.nombre) === n || normMarca(x.slug) === n);
  const slug = m?.slug ?? vendor.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const candidatas = [
    `/assets/logos/ficha/${slug}.webp`,
    ...["webp", "png", "jpg", "svg"].map((ext) => `/assets/logos/color/${slug}.${ext}`),
  ];
  const ruta = candidatas.find((r) => existsSync(join(process.cwd(), "public", r)));
  const sinFondo = ruta === candidatas[0];
  if (!sinFondo && !avisadosSinFicha.has(slug)) {
    avisadosSinFicha.add(slug);
    console.warn(`[catalogo] ${vendor}: falta su logo sin fondo (python3 scripts/logo-ficha.py ${slug} <archivo>)`);
  }
  return ruta ? { ruta, slug, sinFondo } : null;
}

/* ---------- Definición de filtros por tipo -------------------------------- */

interface DefFiltro {
  nombre: string;
  clave: string;
  /** Lista cerrada de la tabla de filtros (scripts/filtros-web-valores.py), en su orden. */
  valores?: string[];
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
    ...(f.color ?? []),
    ...(f.panel ?? []),
    ...(f.tipo ?? []),
    ...(f.funcionamiento ?? []).filter((v) => !/^Todo /.test(v)),
  ];
  // El color elegido (Standard / Custom Color) siempre se ve: cambia el precio.
  return [...new Set(partes)].slice(0, 3).concat(p.color ? [p.color] : [], p.sku);
}

/* ---------- Precio -------------------------------------------------------- */

/**
 * Pieza publicada sin precio (precio 0 en Shopify): se ve "Precio por confirmar"
 * en lugar de $0 (Carla, 2026-10-30, Bertazzoni 901390 en stock sin lista).
 */
const sinPrecio = (precio: PrecioPublico) => !(precio.venta > 0);
const POR_CONFIRMAR = "Precio por confirmar";

function textoPrecio(precio: PrecioPublico): string {
  if (sinPrecio(precio)) return POR_CONFIRMAR;
  return `$${dinero(precio.venta)} ${precio.moneda} IVA incluido`;
}

function precioTarjeta(precio: PrecioPublico): string {
  if (sinPrecio(precio)) return `<div class="pcard-price"><span class="price-note">${POR_CONFIRMAR}</span></div>`;
  // Orden pedido (Carla, 2026-10-07): precio final arriba, tachado debajo, "IVA
  // incluido" al final.
  const tachado = precio.tachado
    ? `<s class="price-was figures">$${dinero(precio.tachado)} ${precio.moneda}</s>`
    : "";
  return `<div class="pcard-price"><span class="price-tag figures">$${dinero(precio.venta)}<span class="currency">${precio.moneda}</span></span>${tachado}<span class="price-note">IVA incluido</span></div>`;
}

export function precioFichaHtml(precio: PrecioPublico, tc: TipoCambio): string {
  if (sinPrecio(precio)) return `<div class="pdp-precio"><span class="pdp-iva">${POR_CONFIRMAR}</span></div>`;
  // El % de descuento va en píldora junto al precio final (Carla, 2026-10-30).
  const pct = porcentajeDescuento(precio);
  const tachado = precio.tachado
    ? `<s class="pdp-was figures">$${dinero(precio.tachado)} ${precio.moneda}</s>`
    : "";
  const equivalencia =
    precio.moneda === "USD" && precio.mxnEquivalente !== null
      ? `<p class="note figures pdp-mxn">≈ $${dinero(precio.mxnEquivalente)} MXN IVA incluido · TC ${tc.valor.toFixed(2)}${tc.fecha ? ` · ${esc(tc.fecha)}` : ""}</p>`
      : "";
  // Orden (Carla, 2026-10-13): precio final con moneda · tachado · IVA INCLUIDO ·
  // equivalencia en pesos. Igual que la tarjeta.
  return `<div class="pdp-precio">
      <span class="price-big figures"><b>$${dinero(precio.venta)}</b><span class="currency">${precio.moneda}</span></span>${pct ? `<span class="pdp-desc-pct figures">−${pct}%</span>` : ""}
      ${tachado}
      <span class="pdp-iva">IVA incluido</span>
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

function imgRespaldo(p: ProductoVivo, extra = ""): string {
  return `<img class="is-respaldo"${extra} width="${IMAGEN_RESPALDO.ancho}" height="${IMAGEN_RESPALDO.alto}" decoding="async" src="${IMAGEN_RESPALDO.url}" alt="${esc(`${p.marca} ${p.sku}: imagen no disponible`)}">`;
}

export function esImagenTecnica(im: { url: string; alt: string }): boolean {
  const archivo = im.url.split("?")[0].split("/").pop() ?? "";
  return /^plano|^ficha|^diagrama/i.test(im.alt) || /(^|-)(plano-medidas|ficha-tecnica|line-drawing|diagrama)(-|\.)/i.test(archivo);
}

/** Nombre de la Subcategoría 1 de una pieza ("Refrigeración"); su Tipo si no está en TIPOS_WEB. */
function subcategoriaDe(p: ProductoVivo): string {
  return tipoWeb(p.tipo)?.sub1.nombre ?? p.tipo;
}

/** Foto de la tarjeta: la del aparato primero; los planos solo si no hay ninguna foto. */
const fotoDeTarjeta = (p: ProductoVivo) => p.imagenes.find((im) => !esImagenTecnica(im)) ?? p.imagenes[0];

/**
 * Datos de la tarjeta que leen los filtros y el orden de public/catalogo.js
 * (slugs separados por espacio). Los llevan igual la tarjeta completa y la vacía.
 */
function atributosDeTarjeta(p: ProductoVivo, precio: PrecioPublico, orden: number): string {
  const atributos: string[] = [
    `data-cat-card`,
    `data-sku="${esc(p.sku)}"`,
    `data-orden="${orden}"`,
    `data-precio="${precio.mxnEquivalente ?? precio.venta}"`,
    // Para ordenar por inventario (public/catalogo.js): 1 = en stock, 0 = bajo pedido.
    `data-stock="${p.enStock ? 1 : 0}"`,
    `data-tipo="${esc(tipoDePieza(p).slug ?? slugValor(p.tipo))}"`,
    `data-fv-marca="${slugValor(p.marca)}"`,
    // Subcategoría 1 (Refrigeración, Cocción…): grupo "Subcategoría" de los
    // paneles que cruzan varias (página de marca, macrocategoría).
    `data-fv-categoria="${slugValor(subcategoriaDe(p))}"`,
  ];
  for (const [clave, valores] of Object.entries(p.filtros)) {
    if (clave === "compatible") continue;
    atributos.push(`data-fv-${clave}="${valores.map(slugValor).join(" ")}"`);
  }
  atributos.push(`data-accion="${decisionDeCompra(p, precio).accion}"`);
  return atributos.join(" ");
}

/**
 * Tarjeta vacía (Carla, 2026-11-04: 50 por página): solo los datos de filtro y
 * orden, sin foto ni textos. public/catalogo.js la cuenta y la filtra como a
 * cualquier otra, y cuando entra en la página que se ve pide su contenido a
 * /api/tarjetas. Va con `data-fuera`: oculta hasta que le toque. Sin foto a
 * propósito (pesaba 0.3 MB en Cocina y Bar): si una hermana de color vacía hace
 * falta para la vista previa, catalogo.js la pide en ese momento.
 */
export function tarjetaVaciaHtml(p: ProductoVivo, tc: TipoCambio, orden: number): string {
  return `<a class="pcard pcard-vacia" href="/producto/${p.slug}" ${atributosDeTarjeta(p, precioPublico(p, tc), orden)} data-fuera tabindex="-1" aria-hidden="true"></a>`;
}

export function tarjetaHtml(p: ProductoVivo, tc: TipoCambio, orden = 0, colores: ColorHermano[] = []): string {
  const precio = precioPublico(p, tc);
  const href = `/producto/${p.slug}`;
  const img = fotoDeTarjeta(p);
  const spec = lineaSpec(p);

  const imagen = img
    ? `<img width="${img.ancho}" height="${img.alto}" srcset="${srcsetCdn(img.url, img.ancho)}" sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 34vw" loading="lazy" decoding="async" src="${cdn(img.url, 640)}" alt="${esc(img.alt)}">`
    : imgRespaldo(p, ' loading="lazy"');

  const { nombre, serie } = nombreYSerie(p.titulo);
  const stock = etiquetaDisponibilidad(p);
  const pct = porcentajeDescuento(precio);

  // Solo lo que decide una compra, en este orden (Carla, 2026-10-06): marca ·
  // línea con el modelo a la derecha (2026-10-29; el renglón va aunque no haya
  // línea, para que los nombres alineen entre tarjetas) · disponibilidad · nombre ·
  // precio final y tachado. La foto ocupa todo el recuadro (2026-10-08):
  // disponibilidad y corazón van en el renglón superior del cuerpo; sobre la
  // foto solo el % de descuento, en la esquina derecha (2026-10-29).
  return `<a class="pcard" href="${href}" ${atributosDeTarjeta(p, precio, orden)}>
  <div class="imgw cutout">${imagen}${pct ? `<span class="pcard-desc figures">−${pct}%</span>` : ""}</div>
  <div class="body">
    <div class="pcard-top">${stock}<span class="pcard-acc">${botonAgregarTarjeta(p, precio, img)}<button class="wl-heart" type="button" data-wl-id="${esc(p.sku)}" data-wl-brand="${esc(p.marca)}" data-wl-name="${esc(p.titulo)}" data-wl-spec="${esc(spec.join(" · "))}" data-wl-price="${esc(textoPrecio(precio))}" data-wl-img="${img ? esc(cdn(img.url, 400)) : ""}" data-wl-href="${href}" data-wl-tipo="${esc(p.tipo)}" data-wl-vid="${esc(p.variantId.split("/").pop() ?? "")}" data-wl-stock="${p.enStock ? 1 : 0}" data-wl-was="${precio.tachado ? esc(`$${dinero(precio.tachado)} ${precio.moneda}`) : ""}" data-wl-mxn="${precio.mxnEquivalente ?? precio.venta}" data-tip="Agregar a mi Wishlist" aria-label="Guardar en wishlist" aria-pressed="false">${CORAZON}</button></span></div>
    <div class="pcard-head"><span class="brand">${esc(p.marca)}</span><div class="pcard-linea"><span class="pcard-serie">${esc(serie ?? "")}</span><span class="pcard-sku figures" title="${esc(p.sku)}">${esc(p.sku)}</span></div></div>
    <h3 class="pcard-name">${esc(nombre)}</h3>
    ${colores.length > 1 ? coloresTarjetaHtml(colores) : coloresVarianteTarjetaHtml(p, tc)}
    ${precioTarjeta(precio)}
  </div>
</a>`;
}

/** Círculo del tono junto a cada casilla del grupo Color (lib/coloresModelo.ts). */
function circuloFiltro(clave: string, texto: string): string {
  const fondo = clave === "color" || clave === "panel" ? muestraFiltroColor(texto) : null;
  return fondo ? `<span class="fcolor" aria-hidden="true" style="--tono:${fondo}"></span>` : "";
}

/* ---------- Colores en la tarjeta ------------------------------------------ */

/**
 * Círculos de color en la tarjeta (Carla, 2026-11-03; probado en la tarja Blanco
 * Ikon 402525 y llevado a todas las marcas): toda pieza con grupo "colores" en
 * data/sugerencias-marca.json. Cada color sigue siendo su propia tarjeta y su
 * círculo va marcado. Al pasar el cursor por otro círculo la foto cambia a ese
 * color; al hacer clic la tarjeta se queda con ese color (foto, modelo, precio y
 * enlace a su ficha). Lo hace public/catalogo.js con la tarjeta hermana de la
 * misma rejilla (data-sku). Cómo sumar una marca: docs/COLORES-POR-MARCA.md.
 */
const MAX_COLORES_TARJETA = 5;

/** Círculos de cada tarjeta de la rejilla, con los hermanos que vienen en el mismo listado. */
function coloresDeRejilla(productos: ProductoVivo[]): Map<string, ColorHermano[]> {
  const porSku = new Map(productos.map((p) => [p.sku, p]));
  const comoColor = (x: ProductoVivo) => ({ sku: x.sku, slug: x.slug, titulo: x.titulo, acabado: x.filtros.color?.[0] ?? x.filtros.panel?.[0] });
  const mapa = new Map<string, ColorHermano[]>();
  for (const p of productos) {
    const otros = otrosColores(p.sku);
    if (!otros.length) continue;
    const hermanos = otros.flatMap((s) => {
      const h = porSku.get(s);
      return h ? [comoColor(h)] : [];
    });
    const colores = coloresDeModelo(comoColor(p), hermanos);
    if (colores.length > 1) mapa.set(p.sku, colores);
  }
  return mapa;
}

/**
 * Todos los círculos en el orden fijo del modelo y "+N" (Carla, 2026-11-03: los
 * que quepan en el ancho de la tarjeta). El HTML deja ver 5, el de la tarjeta
 * siempre entre ellos; public/catalogo.js mide la fila y enseña los que caben.
 */
function coloresTarjetaHtml(colores: ColorHermano[]): string {
  if (colores.length < 2) return "";
  let vista = colores.slice(0, MAX_COLORES_TARJETA);
  const actual = colores.find((c) => c.actual);
  if (actual && !vista.includes(actual)) vista = [...vista.slice(0, MAX_COLORES_TARJETA - 1), actual];
  const resto = colores.length - vista.length;
  const circulos = colores
    .map((c) =>
      // Con teclado: Tab llega a cada círculo y Enter/Espacio aplica el color (catalogo.js).
      `<span class="pcard-color${c.actual ? " is-active" : ""}" role="radio" tabindex="0" aria-checked="${c.actual}" data-color-sku="${esc(c.sku)}" data-tip="${esc(c.nombre)}" aria-label="${esc(c.nombre)}" style="--tono:${c.fondo}"${vista.includes(c) ? "" : " hidden"}></span>`,
    )
    .join("");
  return `<div class="pcard-colores" role="radiogroup" aria-label="Color · ${colores.length} opciones">${circulos}<span class="pcard-colores-mas" aria-hidden="true"${resto ? "" : " hidden"}>+${resto}</span></div>`;
}

/**
 * Círculos de las VARIANTES de color (Alfresco: Acero · Standard Color por tono ·
 * Custom Color; Carla, 2026-11-09: las tarjetas con sus círculos de color en
 * todas las rutas). A diferencia de los colores-producto (cada uno su tarjeta),
 * aquí es UN producto: el círculo no cambia la foto (no hay foto por tono);
 * cambia el precio de la tarjeta (los <template> de abajo), la variante que
 * agregan el "+" y el corazón, y el enlace a la ficha, que abre con ese color
 * elegido (?color=<SKU>&tono=<nombre>). Lo hace public/catalogo.js.
 */
const FONDO_ACERO = "linear-gradient(135deg, #f4f4f2 0%, #c9cac7 45%, #eeeeec 60%, #a9aaa7 100%)";
const FONDO_CUSTOM = "conic-gradient(#F7B401, #FF4B18, #C61D34, #6C4675, #002C75, #85C3BE, #F7B401)";
const FONDO_ESTANDAR = "conic-gradient(#9B2322, #002C75, #85C3BE, #F7B401, #9B2322)";

function coloresVarianteTarjetaHtml(p: ProductoVivo, tc: TipoCambio): string {
  if (p.colores.length < 2) return "";
  const tonos = TONOS_ESTANDAR[p.marca] ?? [];
  type Op = { i: number; c: ProductoVivo["colores"][number]; nombre: string; tono: string; fondo: string; precio: PrecioPublico };
  const ops: Op[] = [];
  p.colores.forEach((c, i) => {
    const precio = precioPublico({ ...p, ...c }, tc);
    if (/^standard/i.test(c.nombre) && tonos.length) {
      for (const t of tonos) ops.push({ i, c, nombre: `Standard Color · ${t.nombre}`, tono: t.nombre, fondo: t.hex, precio });
    } else {
      const fondo = /^standard/i.test(c.nombre) ? FONDO_ESTANDAR : /^custom/i.test(c.nombre) ? FONDO_CUSTOM : FONDO_ACERO;
      ops.push({ i, c, nombre: c.nombre, tono: "", fondo, precio });
    }
  });
  const vista = MAX_COLORES_TARJETA;
  const resto = Math.max(0, ops.length - vista);
  const circulos = ops
    .map((o, k) => {
      const was = o.precio.tachado ? `$${dinero(o.precio.tachado)} ${o.precio.moneda}` : "";
      return `<span class="pcard-color${k === 0 ? " is-active" : ""}" role="radio" tabindex="0" aria-checked="${k === 0}" data-var="${o.i}" data-var-sku="${esc(o.c.sku)}" data-var-vid="${esc(o.c.variantId.split("/").pop() ?? "")}" data-var-tono="${esc(o.tono)}" data-var-nombre="${esc(o.nombre)}" data-var-mxn="${o.c.mxn}" data-var-usd="${esc(textoPrecio(o.precio))}" data-var-was="${esc(was)}" data-var-mxn-pub="${o.precio.mxnEquivalente ?? o.precio.venta}" data-tip="${esc(o.nombre)}" aria-label="${esc(o.nombre)}" style="--tono:${o.fondo}"${k < vista ? "" : " hidden"}></span>`;
    })
    .join("");
  const precios = p.colores
    .map((c, i) => `<template data-var-precio="${i}">${precioTarjeta(precioPublico({ ...p, ...c }, tc))}</template>`)
    .join("");
  return `<div class="pcard-colores" role="radiogroup" aria-label="Color · ${ops.length} opciones">${circulos}<span class="pcard-colores-mas" aria-hidden="true"${resto ? "" : " hidden"}>+${resto}</span></div>${precios}`;
}

/** % de descuento entre el tachado y el precio final (entero); 0 si no hay. */
function porcentajeDescuento(precio: PrecioPublico): number {
  if (!precio.tachado || precio.tachado <= precio.venta) return 0;
  return Math.round((1 - precio.venta / precio.tachado) * 100);
}

/** Descuento normal de la web de la marca (data/descuentos-marca.json); sin dato, 10 %. */
function descuentoNormal(vendor: string): number {
  const tabla = (descuentosMarca as { descuentos: Record<string, number> }).descuentos;
  const n = normMarca(vendor);
  type MarcaMin = { slug: string; nombre: string };
  const crudo = marcasJson as unknown as MarcaMin[] | { marcas: MarcaMin[] };
  const lista: MarcaMin[] = Array.isArray(crudo) ? crudo : (crudo.marcas ?? []);
  const slug = lista.find((x) => normMarca(x.nombre) === n || normMarca(x.slug) === n)?.slug;
  return (slug ? tabla[slug] : undefined) ?? 10;
}

/**
 * Pieza de /ofertas (Carla, 2026-11-02): en stock y con un descuento MAYOR al
 * normal de su marca. El stock al precio de siempre no es oferta.
 */
export function esOferta(p: ProductoVivo, tc: TipoCambio): boolean {
  return p.enStock && porcentajeDescuento(precioPublico(p, tc)) > descuentoNormal(p.marca);
}

/**
 * "+" de la tarjeta (Carla, 2026-10-23): agrega una pieza a Mi proyecto sin
 * entrar a la ficha; el texto "Agregar a Mi Proyecto" sale al pasar el cursor
 * (.pcard-add::after). Lo atiende el mismo .cart-add de CarritoProvider.
 */
function botonAgregarTarjeta(p: ProductoVivo, precio: PrecioPublico, img: ProductoVivo["imagenes"][number] | undefined): string {
  return `<button class="cart-add pcard-add" type="button" data-tip="Agregar a Mi Proyecto" aria-label="Agregar a Mi Proyecto" data-cart-sku="${esc(p.sku)}" data-cart-vid="${esc(p.variantId.split("/").pop() ?? "")}" data-cart-name="${esc(p.titulo)}" data-cart-brand="${esc(p.marca)}" data-cart-spec="${esc(lineaSpec(p).join(" · "))}" data-cart-mxn="${p.mxn}" data-cart-usd="${esc(textoPrecio(precio))}" data-cart-img="${img ? esc(cdn(img.url, 400)) : ""}" data-cart-href="/producto/${p.slug}">${MAS}</button>`;
}

/** Orden por defecto: equipos antes que accesorios; dentro, de mayor a menor precio. */
function ordenar(productos: ProductoVivo[], tc: TipoCambio): ProductoVivo[] {
  const peso = (p: ProductoVivo) => (esAccesorio(p) ? 1 : 0);
  return [...productos].sort((a, b) => {
    const d = peso(a) - peso(b);
    if (d) return d;
    const pa = precioPublico(a, tc);
    const pb = precioPublico(b, tc);
    return (pb.mxnEquivalente ?? pb.venta) - (pa.mxnEquivalente ?? pa.venta);
  });
}

/** Piezas por página de los listados (Carla, 2026-11-04: 50 por defecto; selector 50 · 100 · 200). */
export const POR_PAGINA = 50;

/**
 * Rejilla de tarjetas (sin tarjeta de lead: Carla la quitó el 2026-10-09).
 *
 * Con `lista` (la ruta del listado, p. ej. "/productos/cocina-y-bar"): solo las
 * primeras POR_PAGINA van completas y el resto como tarjetas vacías. Antes se
 * mandaban todas: Cocina y Bar pesaba 18.6 MB con 1,863 tarjetas. La ruta viaja
 * en `data-cat-lista` para que public/catalogo.js pida a /api/tarjetas las de
 * la página que se ve. Sin `lista` (/ofertas, que pagina a su manera) van todas.
 */
export function rejillaHtml(productos: ProductoVivo[], tc: TipoCambio, opciones: { lista?: string } = {}): string {
  const colores = coloresDeRejilla(productos);
  const { lista } = opciones;
  const piezas = ordenar(productos, tc).map((p, i) =>
    lista && i >= POR_PAGINA ? tarjetaVaciaHtml(p, tc, i) : tarjetaHtml(p, tc, i, colores.get(p.sku)),
  );
  if (lista) piezas.unshift(`<span hidden data-cat-lista="${esc(lista)}"></span>`);
  piezas.push(
    `<p class="plp-aviso" data-cat-vacio hidden style="grid-column:1/-1">Aún no hay piezas publicadas con esa combinación. <a class="arrow-link" href="/contacto">Pregúntanos por ellas <span class="ln"></span><span class="ar">→</span></a></p>`,
  );
  return piezas.join("\n");
}

/**
 * Tarjetas completas de unas piezas de un listado, para /api/tarjetas: el mismo
 * orden (data-orden) y los mismos círculos de color que si la página las hubiera
 * pintado. Las piezas que no están en el listado no se devuelven.
 */
export function tarjetasDeListado(productos: ProductoVivo[], tc: TipoCambio, skus: string[]): Record<string, string> {
  const pedidas = new Set(skus);
  const colores = coloresDeRejilla(productos);
  const out: Record<string, string> = {};
  ordenar(productos, tc).forEach((p, i) => {
    if (pedidas.has(p.sku)) out[p.sku] = tarjetaHtml(p, tc, i, colores.get(p.sku));
  });
  return out;
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


/** Cortes fijos de los rangos de precio; de 50 000 en adelante van cada `paso`. */
const CORTES_PRECIO = [4500, 15000, 30000, 50000];
const PASO_PRECIO = 50000;
/** Paso de los rangos en la página general de Cocina y Bar (Carla, 2026-11-03). */
export const PASO_PRECIO_MACRO = 100000;

/**
 * Rangos de precio FIJOS (Carla, 2026-11-03; antes eran proporcionales):
 * Hasta $4,500 · $4,500–$15,000 · $15,000–$30,000 · $30,000–$50,000 y de ahí
 * cada $50,000 (cada $100,000 en la página general de Cocina y Bar) hasta el
 * producto más caro, redondeado hacia arriba al siguiente
 * corte. Los rangos son [lo, hi) y solo se enseñan los que tienen piezas, para
 * que una página con una pieza de $685,000 no liste diez rangos vacíos. Los
 * precios son los de Shopify en pesos con IVA (los de dólares a su equivalente
 * del día).
 */
export function rangosPrecio(precios: number[], paso = PASO_PRECIO): { lo: number; hi: number }[] {
  const v = precios.filter((n) => n > 0);
  if (v.length < 2) return [];
  const max = Math.max(...v);
  const cortes = [0, ...CORTES_PRECIO];
  while (cortes[cortes.length - 1] <= max) cortes.push(cortes[cortes.length - 1] + paso);
  const rangos: { lo: number; hi: number }[] = [];
  for (let i = 0; i < cortes.length - 1; i++) {
    const lo = cortes[i];
    const hi = cortes[i + 1];
    if (lo > max) break;
    if (v.some((x) => x >= lo && x < hi)) rangos.push({ lo, hi });
  }
  return rangos.length > 1 ? rangos : [];
}

interface OpcionesPanel {
  /** Tipo de cambio del día, para el tope del grupo Precio. */
  tc?: TipoCambio;
  /** Incluir el grupo "Tipo" (páginas de Subcategoría 1 con varios tipos). */
  conTipo?: boolean;
  /** Tipos del riel de la página, en su orden (también los que aún no tienen piezas). */
  tiposRiel?: { slug: string; nombre: string }[];
  /**
   * Tipos del mosaico de la PLP (subcat.3), con el nombre de su eje tal como
   * aparece en la tabla de filtros ("Tipo de instalación", "Diseño", "Tipo de
   * funcionamiento"). Cada uno se vuelve una casilla de SU grupo con
   * `data-tipo` = slug — aunque aún no haya piezas con ese valor —, para que
   * elegir un tipo vacío dé "0 piezas" y nunca deje el catálogo sin filtrar.
   * Solo esas casillas llevan `data-tipo`: un mismo slug en otro grupo
   * ("Profesional" en Instalación y en Diseño) no se marca por error.
   */
  mosaico?: { eje: string; slug: string; nombre: string; valor?: string }[];
  /** Grupo "Subcategoría" (Refrigeración / Cocción…): paneles que cruzan varias (marca, macro). */
  conCategoria?: boolean;
  /** Omitir el grupo "Marca": en la página de una marca todas las piezas son de ella. */
  sinMarca?: boolean;
  /**
   * Tipos de producto cuya tabla de filtros se pinta AUNQUE no haya piezas
   * (Carla, 2026-10-13: la especificación se ve antes de cargar el catálogo).
   * Se suman a los tipos presentes en `productos`.
   */
  tipos?: string[];
  /** Paso de los rangos de precio desde $50,000 (por defecto 50 000). */
  pasoPrecio?: number;
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
  { tc, conTipo = false, tiposRiel = [], mosaico = [], conCategoria = false, sinMarca = false, tipos = [], pasoPrecio }: OpcionesPanel = {},
): string {
  tcPanel = tc ?? null;
  // Filtros aplicados, arriba del todo (como "Ahora comprando por" de Artexa):
  // catalogo.js lo llena con un chip por valor y "Eliminar todo".
  const grupos: string[] = [
    `<div class="fchips fchips--panel" data-cat-chips hidden></div>
<div class="fhead"><h6>Filtros</h6></div>`,
  ];

  if (conCategoria) {
    // Una casilla por Subcategoría 1 presente, en el orden de TIPOS_WEB.
    const cuenta = new Map<string, { nombre: string; n: number; orden: number }>();
    const sumar = (nombre: string, n: number) => {
      const k = slugValor(nombre);
      const c = cuenta.get(k) ?? {
        nombre,
        n: 0,
        orden: Math.max(0, TIPOS_WEB.findIndex((t) => t.sub1.nombre === nombre)),
      };
      c.n += n;
      cuenta.set(k, c);
    };
    // Subcategorías de los tipos pedidos (con 0 si aún no hay piezas); los
    // tipos que cuelgan directo de la macro (Exterior → Hieleras) no son una.
    for (const tipo of tipos) {
      const tw = tipoWeb(tipo);
      if (tw && tw.sub1.ruta !== tw.macro.ruta) sumar(tw.sub1.nombre, 0);
    }
    for (const p of productos) sumar(subcategoriaDe(p), 1);
    if (cuenta.size > 1) {
      const etiquetas = [...cuenta]
        .sort((a, b) => ordenValores(a[1].nombre, b[1].nombre))
        .map(
          ([k, c]) =>
            `<label><input type="checkbox" data-fk="categoria" value="${esc(k)}"> <span class="flbl">${esc(c.nombre)}</span> <span class="count figures">${c.n}</span></label>`,
        )
        .join("");
      grupos.push(grupoHtml("Subcategoría", "categoria", etiquetas, false));
    }
  }

  if (conTipo) {
    const cuenta = new Map<string, { nombre: string; n: number }>();
    for (const t of tiposRiel) cuenta.set(t.slug, { nombre: t.nombre, n: 0 });
    for (const p of productos) {
      const pieza = tipoDePieza(p);
      const slug = pieza.slug ?? slugValor(p.tipo);
      const c = cuenta.get(slug) ?? { nombre: pieza.nombre ?? p.tipo, n: 0 };
      c.n++;
      cuenta.set(slug, c);
    }
    const etiquetas = [...cuenta]
      .sort((a, b) => ordenValores(a[1].nombre, b[1].nombre))
      .map(
        ([slug, c]) =>
          `<label data-tipo="${esc(slug)}"><input type="checkbox" data-fk="tipo-web" value="${esc(slug)}"> <span class="flbl">${esc(c.nombre)}</span> <span class="count figures">${c.n}</span></label>`,
      )
      .join("");
    grupos.push(grupoHtml("Tipo de producto", "tipo-web", etiquetas, false));
  }

  // Paquetes (Carla, 2026-11-09): dos o más aparatos que se venden juntos,
  // marcados en Shopify con `filtros.paquete`. Cada uno con lo que le
  // corresponde: "Paquete" (parrilla + campana) o "Combo" (pareja lavadora +
  // secadora, refrigerador + congelador). El grupo no está en la tabla de ningún
  // tipo: sale solo en los listados que traen al menos uno, con una casilla por
  // valor presente. Los juegos de accesorios (desagüe, jaladeras) no lo llevan.
  const porPaquete = new Map<string, { texto: string; n: number }>();
  for (const p of productos) {
    for (const v of p.filtros.paquete ?? []) {
      const c = porPaquete.get(slugValor(v)) ?? { texto: v, n: 0 };
      c.n++;
      porPaquete.set(slugValor(v), c);
    }
  }
  if (porPaquete.size) {
    const etiquetas = [...porPaquete]
      .sort((a, b) => ordenValores(a[1].texto, b[1].texto))
      .map(
        ([k, c]) =>
          `<label><input type="checkbox" data-fk="paquete" value="${esc(k)}"> <span class="flbl">${esc(c.texto)}</span> <span class="count figures">${c.n}</span></label>`,
      )
      .join("");
    grupos.push(grupoHtml("Paquetes", "paquete", etiquetas, false));
  }

  // Altitud (Carla, 2026-11-10, carga Sub-Zero): refrigeración con puerta de
  // vidrio para instalar a más de 1,524 m s. n. m. (CDMX, Querétaro…), marcada
  // con `filtros.altitud = Alta altitud`. Como Paquetes, sale solo en los
  // listados que traen al menos una; las demás piezas no llevan valor.
  const porAltitud = new Map<string, { texto: string; n: number }>();
  for (const p of productos) {
    for (const v of p.filtros.altitud ?? []) {
      const c = porAltitud.get(slugValor(v)) ?? { texto: v, n: 0 };
      c.n++;
      porAltitud.set(slugValor(v), c);
    }
  }
  if (porAltitud.size) {
    const etiquetas = [...porAltitud]
      .map(
        ([k, c]) =>
          `<label><input type="checkbox" data-fk="altitud" value="${esc(k)}"> <span class="flbl">${esc(c.texto)}</span> <span class="count figures">${c.n}</span></label>`,
      )
      .join("");
    grupos.push(grupoHtml("Altitud", "altitud", etiquetas, false));
  }

  // Unión ordenada de los filtros de cada tipo presente (tabla de filtros v2).
  const defs: DefFiltro[] = [];
  for (const tipo of new Set([...tipos, ...productos.map((p) => p.tipo)])) {
    for (const d of DEFS[tipo] ?? []) {
      const previo = defs.find((x) => x.clave === d.clave);
      if (!previo) defs.push({ ...d, valores: [...(d.valores ?? [])] });
      // Mismo filtro en varios tipos (Acabado en tarjas y monomandos): unión de valores.
      else for (const v of d.valores ?? []) if (!previo.valores!.includes(v)) previo.valores!.push(v);
    }
  }
  if (!defs.length) defs.push({ nombre: "Marca", clave: "marca" });

  // Se muestran TODOS los filtros de la tabla de la subcategoría (Carla,
  // 2026-10-07), aunque las piezas publicadas aún no traigan ese dato: el grupo
  // sale plegado con la nota "Sin opciones por ahora" y se llena solo cuando
  // Shopify tenga valores.
  for (const d of defs) {
    if (d.clave === "compatible") continue;
    if (d.clave === "marca" && sinMarca) continue;
    if (d.clave === "precio") {
      const precios = productos.map((p) => precioRefMxn(p)).filter((n) => n > 0);
      // Sin piezas aún, el slider se enseña con un tope de referencia (la
      // especificación se ve completa); se recalcula solo al llegar el catálogo.
      const max = precios.length ? Math.ceil(Math.max(0, ...precios) / 1000) * 1000 : 250000;
      // Rangos proporcionales como casillas (suman entre sí) + el slider de siempre.
      const rangosHtml = rangosPrecio(precios, pasoPrecio)
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
    // Conteo por slug (es lo que compara catalogo.js), con el texto de Shopify.
    const cuenta = new Map<string, { texto: string; n: number; tipo: string | null }>();
    const delMosaico = mosaico.filter((m) => m.eje === d.nombre);
    // Los tipos del mosaico van primero y en su orden, con o sin piezas. La
    // casilla vale el slug del VALOR de la tabla (lo que trae la tarjeta) y lleva
    // `data-tipo` = slug del tile, por si no coinciden (minisplit-frio → "Solo frío").
    const claveMosaico = (m: { slug: string; valor?: string }) => (m.valor ? slugValor(m.valor) : m.slug);
    for (const m of delMosaico) cuenta.set(claveMosaico(m), { texto: m.nombre, n: 0, tipo: m.slug });
    // Después, la lista cerrada de la tabla de filtros en su orden (con 0 si
    // ninguna pieza la trae): el panel enseña la especificación completa.
    const cerrados = d.valores ?? [];
    for (const v of cerrados) if (!cuenta.has(slugValor(v))) cuenta.set(slugValor(v), { texto: v, n: 0, tipo: null });
    const conDatos = new Set<string>();
    for (const p of productos) {
      const valores = d.clave === "marca" ? [p.marca] : p.filtros[d.clave] ?? [];
      for (const v of valores) {
        const k = slugValor(v);
        const c = cuenta.get(k) ?? { texto: v, n: 0, tipo: null };
        // El texto de Shopify manda cuando la pieza trae el valor.
        if (!conDatos.has(k)) c.texto = v;
        conDatos.add(k);
        c.n++;
        cuenta.set(k, c);
      }
    }
    if (!cuenta.size) {
      grupos.push(
        grupoHtml(d.nombre, d.clave, `<p class="fnote fnote--tight">Sin opciones por ahora.</p>`, false),
      );
      continue;
    }
    // Orden: siempre de menor a mayor y de la A a la Z (Carla, 2026-11-02),
    // sin importar si el valor viene del mosaico, de la tabla o de Shopify.
    // Color y Acabado (Carla, 2026-11-03): un valor sin piezas no se enseña hasta
    // que alguna lo traiga; el resto de los grupos sigue con la lista completa.
    const ocultarVacios = d.clave === "color" || d.clave === "acabado";
    const etiquetas = [...cuenta]
      .filter(([, c]) => !ocultarVacios || c.n > 0 || c.tipo)
      .sort((a, b) => ordenValores(a[1].texto, b[1].texto))
      .map(
        ([k, c]) =>
          `<label${c.tipo ? ` data-tipo="${esc(c.tipo)}"` : ""}><input type="checkbox" data-fk="${esc(d.clave)}" value="${esc(k)}"> ${circuloFiltro(d.clave, c.texto)}<span class="flbl">${esc(c.texto)}</span> <span class="count figures">${c.n}</span></label>`,
      )
      .join("");
    // Sin ningún color o acabado con piezas, el grupo entero espera a que lleguen.
    if (ocultarVacios && !etiquetas) continue;
    // Marca (Carla, 2026-10-08): caja "Busca por marca" y solo las marcas que
    // aplican con los demás filtros (catalogo.js oculta las que darían 0).
    const buscador =
      d.clave === "marca"
        ? `<label class="fbuscar"><span class="sr-only">Busca por marca</span><input type="search" placeholder="Busca por marca" autocomplete="off" data-fbuscar></label>`
        : "";
    grupos.push(grupoHtml(d.nombre, d.clave, buscador + etiquetas, grupos.length - 1 < GRUPOS_ABIERTOS, d.clave === "marca"));
  }

  // Red de seguridad: un eje del mosaico que no casa con ningún filtro de la
  // tabla dejaría sus tipos sin casilla y, al elegirlos, el catálogo completo a
  // la vista. Se les da un grupo propio sin datos en las tarjetas (→ 0 piezas)
  // y se avisa en el log para corregir el nombre del eje.
  const huerfanos = mosaico.filter((m) => !defs.some((d) => d.nombre === m.eje));
  for (const eje of new Set(huerfanos.map((m) => m.eje))) {
    console.warn(`[catalogo] El eje "${eje}" del mosaico no existe en data/filtros-web.json`);
    const etiquetas = huerfanos
      .filter((m) => m.eje === eje)
      .map(
        (m) =>
          `<label data-tipo="${esc(m.slug)}"><input type="checkbox" data-fk="mosaico-${esc(slugValor(eje))}" value="${esc(m.slug)}"> <span class="flbl">${esc(m.nombre)}</span> <span class="count figures">0</span></label>`,
      )
      .join("");
    grupos.push(grupoHtml(eje, `mosaico-${slugValor(eje)}`, etiquetas, false));
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
  const agregar = `<button class="btn btn-primary cart-add" type="button" data-cart-sku="${esc(p.sku)}" data-cart-vid="${esc(numericId)}" data-cart-tono="" data-cart-name="${esc(p.titulo)}" data-cart-brand="${esc(p.marca)}" data-cart-spec="${esc(lineaSpec(p).join(" · "))}" data-cart-mxn="${p.mxn}" data-cart-usd="${esc(textoPrecio(precio))}" data-cart-img="${p.imagenes[0] ? esc(cdn(p.imagenes[0].url, 400)) : IMAGEN_RESPALDO.url}" data-cart-href="/producto/${p.slug}">Agregar a Mi Proyecto</button>`;
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

/* ---------- Opciones de color --------------------------------------------- */

function notaColor(nombre: string, tono?: Tono): string {
  if (tono) {
    return `Standard Color · ${tono.nombre}. No hay foto por tono: el tono queda anotado en tu pedido y tu asesor lo confirma contigo.`;
  }
  if (/^standard/i.test(nombre)) {
    return "Standard Color: uno de los colores estándar de la marca. Tu asesor confirma el tono contigo.";
  }
  if (/^custom/i.test(nombre)) {
    // Adaptación del texto de Alfresco (Color Options), Carla 2026-10-29.
    return "Custom Color: elige entre los diez colores estándar o lleva tu cocina exterior a otro nivel con la colección RAL Classic, con 216 colores para tu jardín. Tu asesor confirma el tono y el tiempo de entrega.";
  }
  return `${nombre}: el acabado original de la pieza.`;
}

/**
 * Precio + selector de color de la ficha (Carla, 2026-10-28). Solo cambia el
 * precio: no hay fotos por color. Acero con su degradado; "Standard Color" se
 * abre en un círculo por cada tono de la marca (lib/coloresMarca.ts), todos al
 * precio de esa variante; "Custom Color" queda como círculo CC. public/catalogo.js
 * cambia el precio visible, la variante y el tono (`data-cart-tono`) que se
 * agregan a Mi Proyecto.
 */
function precioYColorHtml(p: ProductoVivo, precio: PrecioPublico, tc: TipoCambio): string {
  if (p.colores.length < 2) return precioFichaHtml(precio, tc);
  const opciones = p.colores.map((c) => ({ ...c, precio: precioPublico({ ...p, ...c }, tc) }));
  const precios = opciones
    .map((o, i) => `<div class="pdp-precio-color" data-color-precio="${i}"${i ? " hidden" : ""}>${precioFichaHtml(o.precio, tc)}</div>`)
    .join("");
  const tonos = TONOS_ESTANDAR[p.marca] ?? [];
  const boton = (o: (typeof opciones)[number], i: number, clase: string, contenido: string, tono?: Tono) => {
    const nombre = tono ? `Standard Color · ${tono.nombre}` : o.nombre;
    return `<button type="button" role="radio" aria-checked="${i === 0}" class="pdp-swatch ${clase}${i === 0 ? " is-active" : ""}" data-color="${i}" data-sku="${esc(o.sku)}" data-vid="${esc(o.variantId.split("/").pop() ?? "")}" data-tono="${tono ? esc(tono.nombre) : ""}" data-nombre="${esc(nombre)}" data-nota="${esc(notaColor(o.nombre, tono))}" data-mxn="${o.mxn}" data-usd="${esc(textoPrecio(o.precio))}" data-was="${o.precio.tachado ? esc(`$${dinero(o.precio.tachado)} ${o.precio.moneda}`) : ""}" data-mxn-pub="${o.precio.mxnEquivalente ?? o.precio.venta}" aria-label="${esc(nombre)}" title="${esc(tono ? tono.nombre : o.nombre)}"${tono ? ` style="--tono:${tono.hex}"` : ""}>${contenido}</button>`;
  };
  const botones = opciones
    .map((o, i) => {
      if (/^standard/i.test(o.nombre) && tonos.length) {
        return tonos.map((t) => boton(o, i, "is-tono", "", t)).join("");
      }
      if (/^standard/i.test(o.nombre)) return boton(o, i, "is-ini", `<span aria-hidden="true">SC</span>`);
      if (/^custom/i.test(o.nombre)) return boton(o, i, "is-ini", `<span aria-hidden="true">CC</span>`);
      return boton(o, i, "is-acero", "");
    })
    .join("");
  return `${precios}
      <div class="pdp-color" role="radiogroup" aria-label="Color">
        <div class="pdp-color-head"><span class="pdp-color-lbl">Color</span><span class="pdp-color-val" data-color-nombre>${esc(opciones[0].nombre)}</span></div>
        <div class="pdp-color-opts">${botones}</div>
        <p class="pdp-color-nota" data-color-nota>${esc(notaColor(opciones[0].nombre))}</p>
      </div>`;
}

/**
 * El mismo modelo en otros colores, cada uno producto propio (Carla, 2026-11-03):
 * un círculo por color que lleva a la ficha de ese color. Va donde el selector de
 * variantes de Alfresco y con su misma forma.
 */
function coloresModeloHtml(colores: ColorHermano[]): string {
  if (colores.length < 2) return "";
  const actual = colores.find((c) => c.actual)!;
  const circulos = colores
    .map((c) =>
      c.actual
        ? `<span class="pdp-swatch is-tono is-active" role="radio" aria-checked="true" aria-label="${esc(c.nombre)}" title="${esc(c.nombre)}" style="--tono:${c.fondo}"></span>`
        : `<a class="pdp-swatch is-tono" role="radio" aria-checked="false" href="/producto/${esc(c.slug)}" aria-label="${esc(c.nombre)} · modelo ${esc(c.sku)}" title="${esc(c.nombre)}" style="--tono:${c.fondo}"></a>`,
    )
    .join("");
  return `<div class="pdp-color pdp-color--modelos" role="radiogroup" aria-label="Color">
        <div class="pdp-color-head"><span class="pdp-color-lbl">Color</span><span class="pdp-color-val">${esc(actual.nombre)}</span></div>
        <div class="pdp-color-opts">${circulos}</div>
      </div>`;
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
  altura_ada: "Altura",
  altura: "Altura",
  profundidad: "Profundidad",
  panel: "Panel",
  color: "Color",
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
  drenaje: "Bomba",
  tipo: "Tipo",
  compatible: "Compatible con",
  tipo_gas: "Tipo de gas",
  quemadores: "Número de quemadores",
  acabado_quemador: "Acabado del quemador",
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

/**
 * Pestaña "Descripción" de la ficha: el párrafo de entrada a la
 * izquierda y las viñetas a la derecha, en dos columnas.
 */
function descripcionHtml(p: ProductoVivo): string {
  const html = p.descripcionHtml
    ? htmlSeguro(p.descripcionHtml)
    : p.descripcion
      ? `<p>${esc(p.descripcion).replace(/\n+/g, "</p><p>")}</p>`
      : "";
  if (!html) return "";
  const listas = html.match(/<(ul|ol)>[\s\S]*?<\/\1>/g) ?? [];
  const intro = listas.reduce((resto, l) => resto.replace(l, ""), html);
  return `<div class="pdp-desc2${listas.length ? "" : " is-sola"}">
          <div class="pdp-desc2-intro"><div class="eyebrow">Descripción</div><h2 class="pdp-desc2-t">${esc(nombreYSerie(p.titulo).nombre)}</h2>${intro}</div>
          ${listas.length ? `<div class="pdp-desc2-lista">${listas.join("")}</div>` : ""}
        </div>`;
}

/**
 * Pestañas de la ficha, a todo lo ancho bajo la foto y la compra (Carla,
 * 2026-10-30): Descripción · Características · Dimensiones (en recuadros) ·
 * Especificaciones técnicas (fichas técnicas).
 */
function pestanasHtml(p: ProductoVivo, spec: string): string {
  const filas = (lista: { nombre: string; valor: string }[]) =>
    lista
      .map(
        (d) =>
          `<div class="spec-row"><span class="spec-label">${esc(d.nombre)}</span><span class="spec-value figures">${esc(d.valor)}</span></div>`,
      )
      .join("\n");
  // Cada medida en su recuadro; "83 3/4" (212.7 cm)" → cifra grande + cm abajo.
  const recuadros = (lista: { nombre: string; valor: string }[]) =>
    `<div class="pdp-medidas">${lista
      .map((d) => {
        const m = d.valor.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
        return `<div class="pdp-medida"><span class="pdp-medida-k">${esc(d.nombre)}</span><span class="pdp-medida-v figures">${esc(m ? m[1] : d.valor)}</span>${m ? `<span class="pdp-medida-m figures">${esc(m[2])}</span>` : ""}</div>`;
      })
      .join("")}</div>`;
  // Solo las medidas DEL PRODUCTO (alto, ancho, profundidad, peso; Carla,
  // 2026-10-13). Nicho, corte, cable… pasan a Características.
  const { producto: medidas } = clasificarDimensiones(p.dimensiones);
  const dimProducto = medidas.length
    ? `<h6 class="pdp-tab-sub">Dimensiones del producto</h6>${recuadros(medidas)}`
    : "";
  const dimEmpaque = p.empaque.length
    ? `<h6 class="pdp-tab-sub">Dimensiones del empaque</h6>${recuadros(p.empaque)}`
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
    ? `<h6 class="pdp-tab-sub">Fichas técnicas</h6><div class="pdp-docs">${docs.join("")}</div>`
    : `<p class="pdp-tab-aviso">Para más información sobre las especificaciones técnicas de este producto, favor de contactar a tu asesor de ventas.</p>`;

  const descripcion = descripcionHtml(p);
  const tabs: [string, string, string][] = [
    ...(descripcion ? [["descripcion", "Descripción", descripcion] as [string, string, string]] : []),
    [
      "caracteristicas",
      "Características",
      // Las medidas de nicho / instalación NO se pintan en texto (Carla,
      // 2026-10-13): para eso están las fichas técnicas.
      `<h6 class="pdp-tab-sub">Características</h6><div class="spec">${spec}</div>`,
    ],
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

/**
 * Ficha de producto con el formato único del catálogo vivo. En Newsreader solo
 * van el título y la línea/serie: el gancho (`homea.lead`) ya no se pinta en la
 * ficha (Carla, 2026-10-12) y queda solo como descripción para buscadores.
 */
export function fichaHtml(
  p: ProductoVivo,
  tc: TipoCambio,
  relacionados: Relacionados,
  coloresModelo: ColorHermano[] = [],
): string {
  const precio = precioPublico(p, tc);
  const decision = decisionDeCompra(p, precio);
  const tw = tipoWeb(p.tipo);
  const href = `/producto/${p.slug}`;
  const [principal, ...resto] = p.imagenes;
  // La miga lleva al tile del riel de la pieza (accesorios, empotrable / de piso…).
  const migaTipo = tileDePieza(p);

  const migas = [
    `<a href="/" style="color:var(--fg-muted);border-bottom:none">Inicio</a>`,
    ...(tw && migaTipo
      ? [
          `<a href="${tw.macro.ruta}" style="color:var(--fg-muted);border-bottom:none">${esc(tw.macro.nombre)}</a>`,
          // Tipos que cuelgan directo de la macro (Exterior → Hieleras): sin sub1.
          ...(tw.sub1.ruta === tw.macro.ruta
            ? []
            : [`<a href="${tw.sub1.ruta}" style="color:var(--fg-muted);border-bottom:none">${esc(tw.sub1.nombre)}</a>`]),
          // Subcategorías de un solo tipo (Trituradores): el tile es la misma
          // página, así que no se repite (Carla, 2026-10-12: la miga no repite).
          ...(migaTipo.ruta === tw.sub1.ruta && migaTipo.nombre === tw.sub1.nombre
            ? []
            : [`<a href="${migaTipo.ruta}" style="color:var(--fg-muted);border-bottom:none">${esc(migaTipo.nombre)}</a>`]),
        ]
      : []),
    `<span class="figures">${esc(p.marca)} <span class="es-modelo">${esc(p.sku)}</span></span>`,
  ].join('<span class="sep" aria-hidden="true" style="color:var(--fg-muted);padding:0 .7em">›</span>');

  const logo = logoDeMarca(p.marca);
  const cabecera = logo
    ? `<img class="pdp-logo${logo.sinFondo ? " is-sin-fondo" : ""}" data-marca="${esc(logo.slug)}" src="${esc(logo.ruta)}" alt="${esc(p.marca)}" loading="eager" decoding="async">`
    : `<div class="eyebrow">${esc(p.marca)}</div>`;
  const etiquetaStock = etiquetaDisponibilidad(p, "pdp-tag");

  const imagenPrincipal = principal
    ? `<img id="pdp-img" width="${principal.ancho}" height="${principal.alto}" srcset="${srcsetCdn(principal.url, principal.ancho)}" sizes="(max-width: 700px) 100vw, 50vw" fetchpriority="high" decoding="async" src="${cdn(principal.url, 960)}" alt="${esc(principal.alt)}">`
    : imgRespaldo(p, ' id="pdp-img" fetchpriority="high"');

  // Flechas sutiles a los costados de la foto grande (Carla, 2026-10-13):
  // recorren las miniaturas; public/catalogo.js las maneja.
  // Van FUERA de la foto (hermanas de .main dentro de .pdp-stage) y son
  // chevrones lineales, sin curva.
  const chevron = (dir: "prev" | "next") =>
    `<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="${dir === "prev" ? "15 4 7 12 15 20" : "9 4 17 12 9 20"}"/></svg>`;
  const flechasGaleria =
    principal && resto.length
      ? `<button type="button" class="pdp-nav pdp-prev" data-pdp-prev aria-label="Imagen anterior">${chevron("prev")}</button><button type="button" class="pdp-nav pdp-next" data-pdp-next aria-label="Imagen siguiente">${chevron("next")}</button>`
      : "";

  // Se ven 5 miniaturas; si hay más, la quinta lleva "+N" y abre la galería ampliada.
  const fotos = [principal, ...resto];
  const masFotos = fotos.length > 5 ? fotos.length - 4 : 0;
  const miniaturas = principal && resto.length
    ? `<div class="pdp-thumbs" role="list">${fotos
        .map(
          (im, i) =>
            `<button type="button" class="pdp-thumb${i === 0 ? " is-active" : ""}" role="listitem" data-src="${esc(cdn(im.url, 960))}" data-srcset="${esc(srcsetCdn(im.url, im.ancho))}" data-alt="${esc(im.alt)}"${masFotos && i === 4 ? ` data-pdp-mas="+${masFotos}" aria-label="Ver las ${masFotos} imágenes restantes"` : ` aria-label="Ver imagen ${i + 1}"`}><img src="${esc(cdn(im.url, 160))}" alt="" loading="lazy" decoding="async"></button>`,
        )
        .join("")}</div>`
    : "";
  const ampliar = `<button type="button" class="pdp-ampliar" data-pdp-zoom aria-label="Ampliar imagen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5M4 4l6 6M20 4l-6 6M4 20l6-6M20 20l-6-6"/></svg></button>`;

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

  // El modelo va en la fuente de precios y modelos (HK Grotesk, .es-modelo).
  const spec = filas
    .map(
      ([k, v]) =>
        `<div class="spec-row"><span class="spec-label">${esc(k)}</span><span class="spec-value figures${k === "Modelo" ? " es-modelo" : ""}">${esc(v)}</span></div>`,
    )
    .join("\n        ");

  // Sugerencias de compra del catálogo; si no hay, similares del mismo tipo.
  const sugerencias = relacionados.modo === "sugerencias";
  // Mismas tarjetas que en el catálogo, con sus círculos de color (2026-11-05). La
  // pieza de la ficha cuenta como hermana: su color también sale en los círculos.
  const coloresRelacionados = coloresDeRejilla([p, ...relacionados.productos]);
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
${relacionados.productos.map((r, i) => tarjetaHtml(r, tc, i, coloresRelacionados.get(r.sku))).join("\n")}
  </div>
</div></section>`
    : "";

  // Corazón de wishlist a la derecha del logo, a la altura de la marca
  // (Carla, 2026-10-23); antes iba sobre la foto.
  const corazonFicha = `<button class="wl-heart pdp-wl" type="button" data-wl-id="${esc(p.sku)}" data-wl-brand="${esc(p.marca)}" data-wl-name="${esc(p.titulo)}" data-wl-spec="${esc(lineaSpec(p).join(" · "))}" data-wl-price="${esc(textoPrecio(precio))}" data-wl-img="${principal ? esc(cdn(principal.url, 400)) : ""}" data-wl-href="${href}" data-wl-tipo="${esc(p.tipo)}" data-wl-vid="${esc(p.variantId.split("/").pop() ?? "")}" data-wl-stock="${p.enStock ? 1 : 0}" data-wl-was="${precio.tachado ? esc(`$${dinero(precio.tachado)} ${precio.moneda}`) : ""}" data-wl-mxn="${precio.mxnEquivalente ?? precio.venta}" data-tip="Agregar a mi Wishlist" aria-label="Guardar en wishlist" aria-pressed="false">${CORAZON}</button>`;

  const { serie } = nombreYSerie(p.titulo);
  // Ficha (mockup "Ficha de producto — primera pantalla", Carla 2026-10-30):
  // foto, modelo, precio y "Agregar a mi proyecto" caben en la primera pantalla;
  // la disponibilidad va junto al corazón y las pestañas, a todo lo ancho debajo.
  return `<section class="sec tight pdp-sec--v2" style="padding-top:16px"><div class="container">
<div class="crumbs" style="font-size:12.5px;color:var(--fg-muted);margin-bottom:16px">${migas}</div>

<div class="pdp pdp--v2">
  <div class="gallery">
    <div class="gallery-sticky">
    <div class="pdp-stage"><div class="main pdp-cutout" data-pdp-zoom role="button" tabindex="0" aria-label="Ampliar imagen">${imagenPrincipal}</div>${flechasGaleria}${ampliar}</div>
    ${miniaturas}
    </div>
  </div>
  <div class="info">
    <div class="pdp-cabecera">${cabecera}<span class="pdp-cab-acc">${etiquetaStock}${corazonFicha}</span></div>
    <span class="rule-gold"></span>
    <div class="pdp-titulo"><h1>${tituloH1(p.titulo)}</h1></div>
    <p class="pdp-modelo">Modelo: <span class="figures">${esc(p.sku)}</span>${serie ? `<span class="pdp-modelo-sep" aria-hidden="true">|</span><span class="pdp-modelo-serie">${esc(serie)}</span>` : ""}</p>
    ${precioYColorHtml(p, precio, tc)}
    ${p.colores.length < 2 ? coloresModeloHtml(coloresModelo) : ""}

    ${ctaHtml(p, decision, precio)}
  </div>
</div>
<div class="pdp-tabs-v2">${pestanasHtml(p, spec)}</div>
</div></section>

${relacionadosHtml}`;
}
