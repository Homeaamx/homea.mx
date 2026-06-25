/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Imágenes de producto vendrán del CDN de Shopify (Fase PLP). Editoriales: locales.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
  // Redirects 301 del mapa de migración OXATIS → Next.
  // Nota SEO (CLAUDE.md §3): Next emite 308 con permanent:true; Google trata 301≈308.
  // El mapa real se cargará en la fase de migración; aquí queda el hook listo.
  async redirects() {
    // Red de seguridad: los nombres de archivo .html del preview/legacy → ruta limpia.
    // Evita 404 en marcadores viejos, enlaces indexados y CTAs cuyo destino aún
    // se sirve desde JSON inline (#hero-data) sin reescritura (p. ej. botón "Agendar
    // asesoría" → contacto.html). Debe reflejar el LINK_MAP de lib/preview.ts.
    const legacyHtml = {
      "/home.html": "/",
      "/marcas.html": "/marcas",
      "/coleccion.html": "/productos",
      "/ofertas.html": "/productos",
      "/producto.html": "/producto",
      "/b2b.html": "/proyectos",
      "/nosotros.html": "/nosotros",
      "/contacto.html": "/contacto",
      "/herramientas.html": "/herramientas",
      "/garantias-instalacion.html": "/garantias-instalacion",
      "/guias.html": "/guias/",
    };
    return [
      ...Object.entries(legacyHtml).map(([source, destination]) => ({
        source,
        destination,
        permanent: true,
      })),
      // El mapa OXATIS 1:1 (docs/PLAN-REDIRECTS-MIGRACION.md) se añade en Fase 4.
    ];
  },
};

module.exports = nextConfig;
