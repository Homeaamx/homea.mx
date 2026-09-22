// Nombre SEO de la foto de una marca (tile y hero de /marcas/<slug>).
//
// Plantilla: <slug-marca>-<tipo de producto>.webp, con el tipo sacado del H1 del
// hero (data/marcas-hero.json) sin el nombre de la marca:
//   "Cocina Wolf"                → wolf-cocina.webp
//   "Tarjas y grifería Blanco"   → blanco-tarjas-y-griferia.webp
//   "Asadores Sedona by Lynx"    → sedona-by-lynx-asadores.webp
// Minúsculas, guiones, sin acentos (docs/ESTRATEGIA-IMAGENES.md §3). Empieza por
// el slug para que cada archivo se reconozca a simple vista y no choque con otra
// marca. Lo usan scripts/build-marcas.mjs (para encontrar la foto) y el script
// que renombra/comprime las fotos.

export const slugificar = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** "wolf-cocina" a partir del slug, el nombre de la marca y el H1 del hero. */
export function nombreSeoMarca(slug, nombre, titulo) {
  let tipo = slugificar(titulo ?? "");
  for (const quitar of [slugificar(nombre), slug]) {
    tipo = tipo.replace(new RegExp(`(^|-)${quitar}(-|$)`), "-");
  }
  tipo = tipo.replace(/(^-+|-+$)/g, "").replace(/-y$/, "");
  return tipo ? `${slug}-${tipo}` : slug;
}
