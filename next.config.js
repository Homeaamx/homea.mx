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
    // Familia "agua" (docs/PLAN-REDIRECTS-MIGRACION.md §5.b): la taxonomía separó
    // purificadores/filtros · monomandos de agua filtrada · despachadores de garrafón,
    // que en OXATIS vivían mezclados. 301 explícito (Next emite 308 con permanent).
    // Nota: el destino de despachadores apunta a la macro mientras Electrodomésticos
    // menores no tenga páginas de subcat.1 (evita 404).
    const oxatisAgua = {
      "/filtros-de-agua-c102x3166686": "/productos/cocina-y-bar/filtros-y-purificadores-de-agua",
      "/dispensadores-de-agua-c102x2874855": "/productos/cocina-y-bar/filtros-y-purificadores-de-agua",
      "/despachadores-de-agua-garrafon-c102x3177457": "/productos/electrodomesticos-menores",
      "/monomando-para-filtro-de-agua-c106x4342728":
        "/productos/cocina-y-bar/tarjas-y-griferia?tipo=monomandos-de-agua-filtrada",
    };

    return [
      ...Object.entries(legacyHtml).map(([source, destination]) => ({
        source,
        destination,
        permanent: true,
      })),
      ...Object.entries(oxatisAgua).map(([source, destination]) => ({
        source,
        destination,
        statusCode: 301,
      })),
      // El resto del mapa OXATIS 1:1 (docs/PLAN-REDIRECTS-MIGRACION.md) se añade en Fase 4.
    ];
  },
};

module.exports = nextConfig;
