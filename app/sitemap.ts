import type { MetadataRoute } from "next";
import { allGuiasUrls } from "@/lib/guias";
import { absUrl } from "@/lib/site";

// Sitemap propio (regla de oro SEO). Incluye home + todas las rutas de Guías.
export default function sitemap(): MetadataRoute.Sitemap {
  const guias = allGuiasUrls().map((path) => ({
    url: absUrl(path),
    changeFrequency: "weekly" as const,
    priority: path === "/guias/" ? 0.8 : 0.6,
  }));

  return [
    { url: absUrl("/"), changeFrequency: "weekly", priority: 1 },
    ...guias,
  ];
}
