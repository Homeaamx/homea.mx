// buscar.ts — buscador de la lupa contra el catálogo PUBLICADO en Shopify.
//
// Sustituye al índice local (data/catalogo-index.json) como fuente del
// overlay: cada tecla consulta `search` de la Storefront API (canal Headless),
// así que aparece exactamente lo que está activo en Shopify — sin regenerar
// ningún índice al cargar una marca nueva. El contrato de salida
// (`ResultadoBusqueda`, `Pagina`) es el mismo que consumía el overlay, por lo que
// components/BuscadorOverlay.tsx no cambia.
//
// Plan B: si falta el token (entorno local sin .env) se usa el índice del CSV,
// como antes; si Shopify falla por red o token, se responde vacío (nunca
// productos en borrador ni precios viejos).

import "server-only";

import {
  buscar as buscarIndice,
  sugerir as sugerirIndice,
  POR_PAGINA,
  type Pagina,
  type ResultadoBusqueda,
} from "@/lib/catalogo";
import { buscarDestinos, coincide, esDeGuias, palabrasDe, type Destino } from "@/lib/buscarDestinos";
import { indiceGuias } from "@/lib/guiasIndice";
import { todasLasMarcas } from "@/lib/marcas";
import { obtenerTipoCambio, type TipoCambio } from "@/lib/tipoCambio";

import { buscarVivo, precioPublico, type ProductoVivo } from "./catalogoVivo";
import { ErrorShopify } from "./cliente";
import { esAccesorio } from "./coleccionesWeb";
import { esImagenTecnica, nombreYSerie } from "./htmlCatalogo";

/** Se traen de una vez hasta 6 páginas: el overlay pagina en memoria. */
const MAX_RESULTADOS = POR_PAGINA * 6;

export interface RespuestaBusqueda extends Pagina {
  /** SOLO el tramo que falta para completar lo tecleado ("gagg" → "enau"). */
  sugerencia: string | null;
  porPagina: number;
  /** Categorías, tipos y marcas que responden a la búsqueda (van arriba de las piezas). */
  destinos: Destino[];
}

const vacia = (destinos: Destino[] = []): RespuestaBusqueda => ({
  resultados: [],
  total: 0,
  pagina: 1,
  paginas: 1,
  porPagina: POR_PAGINA,
  sugerencia: null,
  destinos,
});

/**
 * Solo las piezas que de verdad responden a lo tecleado: título, marca, SKU,
 * tipo o valores de filtro. Shopify devuelve parecidos sin relación ("maytag"
 * → piezas Gaggenau); esos se descartan (Carla, 2026-10-21).
 */
function pertinentes(productos: ProductoVivo[], consulta: string): ProductoVivo[] {
  const tokens = palabrasDe(consulta);
  if (!tokens.length) return [];
  return productos.filter((p) =>
    coincide(tokens, [p.titulo, p.marca, p.sku, p.tipo, ...Object.values(p.filtros).flat()].join(" ")),
  );
}

const dinero = (n: number) =>
  new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

/** Minúsculas y sin acentos PRESERVANDO longitud (se corta por índice). */
function plano(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Miniatura del CDN de Shopify al tamaño que pinta el overlay (62 px, 2x). */
function miniatura(p: ProductoVivo): string | null {
  const img = p.imagenes.find((im) => !esImagenTecnica(im)) ?? p.imagenes[0];
  if (!img) return null;
  return `${img.url}${img.url.includes("?") ? "&" : "?"}width=160`;
}

function resultado(p: ProductoVivo, tc: TipoCambio): ResultadoBusqueda {
  const precio = precioPublico(p, tc);
  const { nombre, serie } = nombreYSerie(p.titulo);
  return {
    sku: p.sku,
    nombre,
    marca: p.marca,
    serie,
    imagen: miniatura(p),
    // Toda pieza publicada tiene ficha (app/producto/[slug], ISR bajo demanda).
    ficha: `/producto/${p.slug}`,
    precio: dinero(precio.venta),
    moneda: precio.moneda,
  };
}

/**
 * Shopify ya ordena por relevancia; aquí solo se corrige lo que un vendedor
 * esperaría: el SKU exacto manda ("BOP250612" es ESE modelo), luego los que
 * empiezan por lo tecleado, y los accesorios después de los equipos cuando el
 * título del equipo empieza igual ("horno" → hornos antes que charolas para hornos).
 */
function nivel(p: ProductoVivo, q: string): number {
  const sku = plano(p.sku);
  const nombre = plano(nombreYSerie(p.titulo).nombre);
  if (sku === q) return 0;
  if (sku.startsWith(q)) return 1;
  if (nombre.startsWith(q)) return 2;
  return esAccesorio(p) ? 4 : 3;
}

function ordenar(productos: ProductoVivo[], consulta: string): ProductoVivo[] {
  const q = plano(consulta.trim());
  return productos
    .map((p, i) => ({ p, i, n: nivel(p, q) }))
    .sort((a, b) => a.n - b.n || a.i - b.i)
    .map((x) => x.p);
}

/* ---------- Autocompletado en línea (ghost text) ------------------------- */

const STOPWORDS = new Set(["de", "del", "con", "y", "o", "a", "en", "para", "la", "el", "los", "las", "por", "sin"]);
const MAX_PALABRAS = 4;

/**
 * Misma idea que el diccionario de scripts/build-search-index.mjs, pero
 * calculado al vuelo sobre los resultados de ESTA consulta: marcas, SKUs y
 * n-gramas desde el inicio del nombre ("Refrigerador Empotrable con…"). Como
 * `search` ya completa la última palabra (`prefix: LAST`), los resultados de
 * "refri" son refrigeradores y la frase que los abre completa lo tecleado.
 */
function sugerirDe(consulta: string, productos: ProductoVivo[]): string | null {
  const escrito = consulta.trimStart();
  if (escrito.trim().length < 2 || !productos.length) return null;
  const clave = plano(escrito);

  const frases = new Map<string, { t: string; p: number }>();
  const sumar = (frase: string, peso: number) => {
    const limpia = frase.trim().replace(/\s+/g, " ");
    if (limpia.length < 3) return;
    const k = plano(limpia);
    const previo = frases.get(k);
    if (previo) previo.p += peso;
    else frases.set(k, { t: limpia, p: peso });
  };
  const vocab = new Map<string, { t: string; p: number }>();

  for (const p of productos) {
    const peso = esAccesorio(p) ? 1 : 4;
    sumar(p.marca, 3);
    sumar(p.sku, 1);
    const { nombre } = nombreYSerie(p.titulo);
    const palabras = nombre.split(/\s+/).filter(Boolean);
    for (let n = 1; n <= Math.min(MAX_PALABRAS, palabras.length); n++) {
      // Una sugerencia no debe terminar en preposición: "horno de" no ayuda.
      if (STOPWORDS.has(plano(palabras[n - 1]))) continue;
      sumar(palabras.slice(0, n).join(" "), peso);
    }
    for (const palabra of nombre.split(/[^\p{L}\p{N}]+/u)) {
      if (palabra.length < 4 || STOPWORDS.has(plano(palabra))) continue;
      const k = plano(palabra);
      const previo = vocab.get(k);
      if (previo) previo.p += peso;
      else vocab.set(k, { t: palabra, p: peso });
    }
  }

  const mejor = (
    candidatos: Map<string, { t: string; p: number }>,
    prefijo: string,
    largo: number,
  ): string | null => {
    const lista = [...candidatos.entries()]
      .filter(([k]) => k.startsWith(prefijo) && k.length > largo)
      .sort((a, b) => b[1].p - a[1].p || a[0].length - b[0].length);
    return lista.length ? lista[0][1].t.slice(largo) : null;
  };

  // 1. Frase completa del catálogo ("refri" → "gerador").
  const frase = mejor(frases, clave, escrito.length);
  if (frase) return frase;

  // 2. Última palabra suelta ("horno de va" → "por"): el título real es
  //    "Horno Combi-Vapor", así que como frase nunca empataría.
  const corte = escrito.lastIndexOf(" ");
  if (corte < 0) return null;
  const ultima = escrito.slice(corte + 1);
  if (ultima.length < 2) return null;
  return mejor(vocab, plano(ultima), ultima.length);
}

/** "gagg" → "Gaggenau": la marca del sitio cuyo nombre empieza por lo tecleado. */
function marcaDesdePrefijo(q: string): string | null {
  const clave = plano(q);
  if (clave.length < 2) return null;
  const marca = todasLasMarcas().find(
    (m) => plano(m.nombre).startsWith(clave) && plano(m.nombre) !== clave,
  );
  return marca ? marca.nombre : null;
}

/* ---------- Respaldo: Guías ---------------------------------------------- */

const MAX_GUIAS = 6;

/**
 * La tienda manda (Carla, 2026-10-21): solo cuando ninguna pieza ni categoría
 * de la tienda responde se busca en el contenido de Guías — guías del blog,
 * tipos y fichas con su texto ("decibeles" → Guía de lavavajillas).
 */
async function conRespaldoGuias(q: string, destinos: Destino[], hayPiezas: boolean): Promise<Destino[]> {
  if (hayPiezas || destinos.some((d) => !esDeGuias(d))) return destinos;
  const tokens = palabrasDe(q);
  if (!tokens.length) return destinos;
  let indice;
  try {
    indice = await indiceGuias();
  } catch {
    return destinos;
  }
  const vistos = new Set(destinos.map((d) => d.href));
  const guias = indice
    .filter((e) => !vistos.has(e.href) && coincide(tokens, `${e.titulo} ${e.visible} ${e.extendido}`))
    // Primero lo que responde en el título, luego en el texto visible.
    .map((e, i) => ({ e, i, nivel: coincide(tokens, e.titulo) ? 0 : coincide(tokens, e.visible) ? 1 : 2 }))
    .sort((a, b) => a.nivel - b.nivel || a.i - b.i)
    .slice(0, Math.max(0, MAX_GUIAS - destinos.length))
    .map(({ e }) => ({
      clase: e.extendido.length > 2000 ? "Guía" : "Guías",
      titulo: e.titulo,
      detalle: e.tag,
      href: e.hrefDetalle && !coincide(tokens, `${e.titulo} ${e.visible}`) ? e.hrefDetalle : e.href,
    }));
  return [...destinos, ...guias];
}

/* ---------- Entrada ------------------------------------------------------- */

export async function buscarCatalogo(consulta: string, pagina = 1): Promise<RespuestaBusqueda> {
  const q = consulta.trim();
  if (q.length < 2) return vacia();
  const destinos = buscarDestinos(q);

  try {
    let [{ total, productos }, tc] = await Promise.all([
      buscarVivo(q, MAX_RESULTADOS),
      obtenerTipoCambio(),
    ]);
    // `prefix: LAST` completa títulos, no marcas: "gagg" da 0. Si lo tecleado es
    // el inicio de una marca del sitio, se busca la marca completa y el ghost
    // propone el resto del nombre.
    productos = pertinentes(productos, q);
    total = productos.length;
    let marcaCompletada: string | null = null;
    if (!productos.length) {
      const marca = marcaDesdePrefijo(q);
      if (marca) {
        const r = await buscarVivo(marca, MAX_RESULTADOS);
        const piezas = pertinentes(r.productos, marca);
        // Solo si la marca ya tiene piezas: un ghost hacia 0 resultados no ayuda.
        if (piezas.length) {
          productos = piezas;
          total = piezas.length;
          marcaCompletada = marca;
        }
      }
    }
    const ordenados = ordenar(productos, q);
    const paginas = Math.max(1, Math.ceil(ordenados.length / POR_PAGINA));
    const actual = Math.min(Math.max(1, Math.trunc(pagina) || 1), paginas);
    const desde = (actual - 1) * POR_PAGINA;
    return {
      total,
      pagina: actual,
      paginas,
      porPagina: POR_PAGINA,
      resultados: ordenados.slice(desde, desde + POR_PAGINA).map((p) => resultado(p, tc)),
      sugerencia: marcaCompletada
        ? marcaCompletada.slice(consulta.trimStart().length) || null
        : sugerirDe(consulta, ordenados),
      destinos: await conRespaldoGuias(q, destinos, ordenados.length > 0),
    };
  } catch (error) {
    if (error instanceof ErrorShopify && error.clase === "sin-configurar") {
      // Sin token (desarrollo sin .env.local): el índice del CSV, como antes.
      const r = buscarIndice(q, pagina);
      return {
        ...r,
        porPagina: POR_PAGINA,
        sugerencia: sugerirIndice(consulta),
        destinos: await conRespaldoGuias(q, destinos, r.total > 0),
      };
    }
    console.warn(`[buscar] Shopify no contestó la búsqueda "${q}":`, (error as Error).message);
    return vacia(await conRespaldoGuias(q, destinos, false));
  }
}
