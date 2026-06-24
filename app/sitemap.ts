import type { MetadataRoute } from "next";
import { allGuiasUrls } from "@/lib/guias";
import { absUrl } from "@/lib/site";

// Páginas de marketing (front-end propio). Las de Guías se agregan dinámicamente.
const MARKETING_PATHS = [
  "/",
  "/marcas",
  "/productos",
  "/producto",
  "/proyectos",
  "/nosotros",
  "/contacto",
  "/herramientas",
  "/garantias-instalacion",
];

// Sitemap propio (regla de oro SEO). Incluye marketing + todas las rutas de Guías.
export default function sitemap(): MetadataRoute.Sitemap {
  const marketing = MARKETING_PATHS.map((path) => ({
    url: absUrl(path),
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));

  const guias = allGuiasUrls().map((path) => ({
    url: absUrl(path),
    changeFrequency: "weekly" as const,
    priority: path === "/guias/" ? 0.8 : 0.6,
  }));

  return [...marketing, ...guias];
}
