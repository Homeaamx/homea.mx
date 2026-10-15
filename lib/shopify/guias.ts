// guias.ts — los artículos de Guías viven en el blog "Guías" de Shopify.
//
// Carla escribe y publica en el admin (Contenido → Entradas de blog → blog
// "Guías") y el sitio los pinta en /guias con el diseño de HOMEA. Cada entrada
// se acomoda sola por sus ETIQUETAS (se escriben normal, con acentos):
//
//   • Subcategoría o macro donde vive:  "Refrigeración", "Asadores & Hornos",
//     "Lavandería", "Baños"…  (las de Cocina y Bar y Exterior van por
//     subcategoría; las demás macros, por macro).
//   • Tipo de guía (opcional; si falta, "Guía de compra"): "Top picks",
//     "Cómo elegir", "Comparativa", "Mantenimiento", "Tendencias", "Reseña".
//
// Ruta resultante: /guias/{macro}/{subcategoría}/{tipo}/{handle} o, en las
// macros sin subcategorías de guías, /guias/{macro}/{tipo}/{handle}. El handle
// es el "identificador de URL" de la entrada en Shopify.
//
// Solo las entradas PUBLICADAS llegan por Storefront API: una entrada oculta no
// aparece en el sitio. En desarrollo (`next dev`) se suman además las guías
// semilla de GUIAS/semilla-shopify/ que aún no estén publicadas, para revisar el
// diseño sin publicar nada; en producción nunca.

import "server-only";

import { readFileSync } from "fs";
import { join } from "path";

import taxonomiaData from "@/GUIAS/taxonomia-guias.json";
import type { Macrocategoria, Subcategoria1, TaxonomiaGuias } from "@/types/guias";

import { ErrorShopify, HAY_TOKEN, shopifyFetch } from "./cliente";

// Se lee el JSON directo (no "@/lib/guias") para no crear una importación circular.
const taxonomia = taxonomiaData as unknown as TaxonomiaGuias;

/** Handle del blog en Shopify. */
export const BLOG_GUIAS = "guias";

/** Tag del Data Cache: /api/revalidar-guias lo invalida al publicar. */
export const TAG_GUIAS = "guias";

export interface ImagenGuia {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

/** Una guía ya ubicada en la taxonomía. */
export interface GuiaPublicada {
  handle: string;
  titulo: string;
  tipo: string;
  ruta: string;
  resumen: string;
  /** Cuerpo HTML limpio (sin <h1>, sin estilos del editor). */
  html: string;
  imagen: ImagenGuia | null;
  publicada: string;
  seo: { titulo: string; descripcion: string };
  autor: string | null;
  macro: Macrocategoria;
  sub1?: Subcategoria1;
  /** true = viene de la semilla local (solo en desarrollo). */
  borrador?: boolean;
}

const CONSULTA = /* GraphQL */ `
  query guias($blog: String!) @inContext(country: MX, language: ES) {
    blog(handle: $blog) {
      articles(first: 250, sortKey: PUBLISHED_AT, reverse: true) {
        nodes {
          handle
          title
          excerpt
          contentHtml
          publishedAt
          tags
          image { url altText width height }
          seo { title description }
          authorV2 { name }
        }
      }
    }
  }
`;

interface ArticuloShopify {
  handle: string;
  title: string;
  excerpt: string | null;
  contentHtml: string;
  publishedAt: string;
  tags: string[];
  image: { url: string; altText: string | null; width?: number; height?: number } | null;
  seo: { title: string | null; description: string | null } | null;
  authorV2: { name: string } | null;
}

interface Respuesta {
  blog: { articles: { nodes: ArticuloShopify[] } } | null;
}

// ---------------------------------------------------------------------------
// Etiquetas → lugar en la taxonomía.
// ---------------------------------------------------------------------------

/** "Asadores & Hornos" → "asadores-y-hornos"; "Guía de compra" → "guia-de-compra". */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface Ubicacion {
  macro: Macrocategoria;
  sub1?: Subcategoria1;
  tipo: string;
}

/** Dónde vive una entrada según sus etiquetas; `null` si no encaja en ninguna. */
export function ubicar(etiquetas: string[]): Ubicacion | null {
  const tags = new Set(etiquetas.map(normalizar));
  const coincide = (slug: string, nombre: string) => tags.has(slug) || tags.has(normalizar(nombre));

  const tipo =
    taxonomia.tiposDeGuia.find((t) => coincide(t.slug, t.nombre))?.slug ?? "guia-de-compra";

  // 1) Subcategoría de guías (ramas de 3 niveles: Cocina y Bar, Exterior).
  for (const macro of taxonomia.macrocategorias) {
    for (const sub1 of macro.subcategorias1 ?? []) {
      if (!sub1.esLeaf && coincide(sub1.slug, sub1.nombre)) return { macro, sub1, tipo };
    }
  }
  // 2) Macro cuyas guías viven en la macro (ramas de 2 niveles).
  for (const macro of taxonomia.macrocategorias) {
    if (macro.nivelGuias === "macrocategoria" && coincide(macro.slug, macro.nombre)) {
      return { macro, tipo };
    }
  }
  return null;
}

function rutaDe({ macro, sub1, tipo }: Ubicacion, handle: string): string {
  const base = sub1?.rutaGuias ?? macro.ruta;
  return `${base.replace(/\/$/, "")}/${tipo}/${handle}`;
}

// ---------------------------------------------------------------------------
// Limpieza del HTML del editor de Shopify.
// ---------------------------------------------------------------------------

/** Atributos que se conservan por etiqueta; todo lo demás se quita. */
const ATRIBUTOS: Record<string, string[]> = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height"],
  th: ["colspan", "rowspan", "scope"],
  td: ["colspan", "rowspan"],
};

function limpiarHtml(html: string): string {
  let limpio = html
    .replace(/<(script|style|iframe|object|embed)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(\w+)(\s[^>]*?)?(\/?)>/g, (_m, tag: string, attrs = "", cierre: string) => {
      const permitidos = ATRIBUTOS[tag.toLowerCase()];
      if (!permitidos || !attrs) return `<${tag}${cierre}>`;
      const conservados: string[] = [];
      for (const [, nombre, valor] of attrs.matchAll(/([\w-]+)\s*=\s*"([^"]*)"/g)) {
        if (!permitidos.includes(nombre.toLowerCase())) continue;
        if (/^\s*javascript:/i.test(valor)) continue;
        conservados.push(`${nombre}="${valor}"`);
      }
      return `<${tag}${conservados.length ? " " + conservados.join(" ") : ""}${cierre}>`;
    })
    .replace(/<\/?span>/gi, "")
    .replace(/<h1>[\s\S]*?<\/h1>/gi, "");

  // Imágenes del cuerpo: diferidas.
  limpio = limpio.replace(/<img (?![^>]*loading=)/g, '<img loading="lazy" decoding="async" ');
  // Enlaces a otros sitios: pestaña nueva.
  limpio = limpio.replace(/<a href="(https?:\/\/(?!(?:www\.)?homea\.mx)[^"]+)"(?![^>]*target=)/g, '<a href="$1" target="_blank" rel="noopener"');
  return limpio.trim();
}

function textoPlano(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function aGuia(a: ArticuloShopify, borrador = false): GuiaPublicada | null {
  const ubicacion = ubicar(a.tags);
  if (!ubicacion) {
    console.warn(`[guias] "${a.title}" no tiene etiqueta de subcategoría o macro válida; no se publica.`);
    return null;
  }
  const html = limpiarHtml(a.contentHtml);
  const resumen = (a.excerpt && textoPlano(a.excerpt)) || textoPlano(html).slice(0, 180);
  return {
    handle: a.handle,
    titulo: a.title,
    tipo: ubicacion.tipo,
    ruta: rutaDe(ubicacion, a.handle),
    resumen,
    html,
    imagen: a.image
      ? { url: a.image.url, alt: a.image.altText ?? a.title, width: a.image.width, height: a.image.height }
      : null,
    publicada: a.publishedAt,
    seo: {
      titulo: a.seo?.title || a.title,
      descripcion: a.seo?.description || resumen,
    },
    autor: a.authorV2?.name ?? null,
    macro: ubicacion.macro,
    sub1: ubicacion.sub1,
    borrador,
  };
}

// ---------------------------------------------------------------------------
// Semilla local (solo desarrollo).
// ---------------------------------------------------------------------------

const DIR_SEMILLA = join(process.cwd(), "GUIAS", "semilla-shopify");

interface EntradaSemilla {
  handle: string;
  titulo: string;
  resumen: string;
  etiquetas: string[];
  seo: { titulo: string; descripcion: string };
  archivo: string;
}

function semilla(): ArticuloShopify[] {
  try {
    const indice = JSON.parse(readFileSync(join(DIR_SEMILLA, "guias.json"), "utf8")) as {
      guias: EntradaSemilla[];
    };
    return indice.guias.map((g) => ({
      handle: g.handle,
      title: g.titulo,
      excerpt: g.resumen,
      contentHtml: readFileSync(join(DIR_SEMILLA, g.archivo), "utf8"),
      publishedAt: new Date().toISOString(),
      tags: g.etiquetas,
      image: null,
      seo: { title: g.seo.titulo, description: g.seo.descripcion },
      authorV2: { name: "HOMEA" },
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// API.
// ---------------------------------------------------------------------------

/** El blog tal cual; `null` si Shopify no respondió (no es lo mismo que vacío). */
async function leerBlog(): Promise<ArticuloShopify[] | null> {
  try {
    const datos = await shopifyFetch<Respuesta>(CONSULTA, {
      variables: { blog: BLOG_GUIAS },
      revalidate: 3600,
      tags: [TAG_GUIAS],
      timeoutMs: 4000,
    });
    return datos.blog?.articles.nodes ?? [];
  } catch (error) {
    if (error instanceof ErrorShopify) {
      if (HAY_TOKEN) console.warn(`[guias] ${error.message}`);
      return null;
    }
    throw error;
  }
}

/**
 * Todas las guías publicadas (más recientes primero). Nunca lanza: si Shopify
 * no responde, el sitio enseña Guías sin artículos en lugar de romperse.
 */
export async function guiasPublicadas(): Promise<GuiaPublicada[]> {
  return (await leerGuias()).guias;
}

async function leerGuias(): Promise<{ guias: GuiaPublicada[]; respondio: boolean }> {
  const nodos = await leerBlog();
  const publicadas = (nodos ?? [])
    .map((a) => aGuia(a))
    .filter((g): g is GuiaPublicada => g !== null);

  const respondio = nodos !== null || !HAY_TOKEN;
  if (process.env.NODE_ENV === "production") return { guias: publicadas, respondio };

  const handles = new Set(publicadas.map((g) => g.handle));
  const borradores = semilla()
    .filter((a) => !handles.has(a.handle))
    .map((a) => aGuia(a, true))
    .filter((g): g is GuiaPublicada => g !== null);
  return { guias: [...publicadas, ...borradores], respondio };
}

/**
 * La guía de una ruta (/guias/…), o `undefined` si no existe. Si Shopify no
 * respondió, lanza en lugar de contestar "no existe": así una caída momentánea
 * no deja la guía en 404 durante una hora en la caché.
 */
export async function guiaPorRuta(ruta: string): Promise<GuiaPublicada | undefined> {
  const limpia = ruta.replace(/\/$/, "");
  const { guias, respondio } = await leerGuias();
  const guia = guias.find((g) => g.ruta === limpia);
  if (!guia && !respondio) throw new Error("Guías: Shopify no respondió; se reintenta en la siguiente visita.");
  return guia;
}
