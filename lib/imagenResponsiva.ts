// Imágenes responsivas para los <img> que renderiza React.
//
// El markup del preview lleva el srcset escrito por scripts/responsive-images.mjs,
// pero las páginas y componentes de React construyen sus <img> en tiempo de
// render. Sin srcset un móvil se descarga la variante de 2000 px para pintarla a
// 375: en el PLP de refrigeradores eran ~340 KB de imágenes.
//
// El manifiesto lo genera el mismo script; si una imagen no está (por ser
// pequeña o recién añadida) se devuelve undefined y el <img> queda como estaba.

import variantes from "@/data/variantes-imagenes.json";

const MAPA = variantes as Record<string, number[]>;

/** Rejilla del sitio: una columna en móvil, dos en tableta, tres en escritorio. */
export const SIZES_REJILLA = "(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 34vw";
/** Mosaico de tipos: el marco mide 150 px de alto y la foto va contenida
 *  dentro, así que nunca necesita más de ~300 px de ancho real. */
export const SIZES_TILE = "(max-width: 700px) 45vw, 300px";
/** Imágenes a sangre completa (heros de sección). */
export const SIZES_SANGRE = "100vw";

/** srcset con los anchos disponibles, o undefined si no hay variantes. */
export function srcSet(src: string): string | undefined {
  const anchos = MAPA[src];
  if (!anchos || anchos.length < 2) return undefined;
  const base = src.replace(/\.webp$/i, "");
  const mayor = Math.max(...anchos);
  return anchos
    .map((w) => `${w === mayor ? src : `${base}-${w}.webp`} ${w}w`)
    .join(", ");
}
