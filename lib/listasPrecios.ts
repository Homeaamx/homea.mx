// Listas de precios por marca. Se muestran en la página de cada marca
// (/marcas/<slug>); el listado general de /marcas se quitó (Carla, 2026-10-16).
//
// Fuente: data/listas-precios.json (una entrada por lista, no por año). Cada lista
// con PDF enlaza a su URL permanente /listas-de-precios/<slug>.pdf, que sirve la
// edición vigente (rewrite en next.config.js).

import listas from "@/data/listas-precios.json";

export interface ListaPrecios {
  slug: string;
  titulo: string;
  vigencia: string | null;
  url: string | null;
}

interface Marca {
  marca: string;
  documentos: ListaPrecios[];
}

/** URL permanente de una lista en el sitio (no cambia entre ediciones). */
export const rutaListaPrecios = (d: Pick<ListaPrecios, "slug">) => `/listas-de-precios/${d.slug}.pdf`;

/** Listas que ya tienen PDF publicado (para el sitemap). */
export function listasPublicadas(): ListaPrecios[] {
  return (listas.marcas as Marca[]).flatMap((m) => m.documentos).filter((d) => d.url);
}

/** Una lista por su slug — lo que guarda `listas[]` de cada marca en data/marcas.json. */
export function listaPorSlug(slug: string): ListaPrecios | undefined {
  return (listas.marcas as Marca[]).flatMap((m) => m.documentos).find((d) => d.slug === slug);
}
