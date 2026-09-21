import type { MetadataRoute } from "next";
import { allGuiasUrls } from "@/lib/guias";
import { listasPublicadas, rutaListaPrecios } from "@/lib/listasPrecios";
import { rutaMarca, todasLasMarcas } from "@/lib/marcas";
import { categoriaSlugs, subcategoriaParams } from "@/lib/preview";
import { absUrl } from "@/lib/site";

// Páginas de marketing (front-end propio). Las de Guías y las de categoría se agregan
// dinámicamente. NO hay índice /productos: se navega directo a cada macrocategoría.
const MARKETING_PATHS = [
  "/",
  "/marcas",
  "/producto",
  "/proyectos",
  "/nosotros",
  "/contacto",
  "/herramientas",
  "/ofertas",
  "/garantias-instalacion",
];

// Sitemap propio (regla de oro SEO). Incluye marketing + categorías + todas las Guías.
export default function sitemap(): MetadataRoute.Sitemap {
  const marketing = MARKETING_PATHS.map((path) => ({
    url: absUrl(path),
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));

  const categorias = categoriaSlugs().map((slug) => ({
    url: absUrl(`/productos/${slug}`),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const subcategorias = subcategoriaParams().map(
    ({ categoria, subcategoria }) => ({
      url: absUrl(`/productos/${categoria}/${subcategoria}`),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })
  );

  const guias = allGuiasUrls().map((path) => ({
    url: absUrl(path),
    changeFrequency: "weekly" as const,
    priority: path === "/guias" ? 0.8 : 0.6,
  }));

  // PDFs de listas de precios en su URL permanente (sirve la edición vigente).
  const listas = listasPublicadas().map((d) => ({
    url: absUrl(rutaListaPrecios(d)),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // Una página por marca (/marcas/<slug>): el 11% de los clics de búsqueda
  // traen el nombre de una marca, así que son entradas propias del sitemap.
  const marcas = todasLasMarcas().map((m) => ({
    url: absUrl(rutaMarca(m)),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...marketing, ...categorias, ...subcategorias, ...guias, ...marcas, ...listas];
}
