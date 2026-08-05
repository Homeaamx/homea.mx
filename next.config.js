/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // El layout y varias páginas leen preview/*.html con readFileSync en tiempo de
  // ejecución (lib/preview.ts). El file tracing de Next no sigue rutas dinámicas,
  // así que sin esto las funciones en Vercel no incluyen esos archivos y cualquier
  // render en vivo (PLP [tipo], revalidación ISR) truena con ENOENT → error 500.
  experimental: {
    outputFileTracingIncludes: {
      "/**": ["./preview/*.html"],
    },
  },
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
    // Tier 1–2 de GSC (docs/PLAN-REDIRECTS-MIGRACION.md §5) + categorías ≥20 clics
    // de las familias que YA tienen página nueva (refrigeradores / parrillas /
    // campanas y sus padres). Los ?f= usan los slugs reales de la taxonomía
    // (GUIAS/taxonomia-guias.json). Los destinos a subcat.1 o macro son
    // provisionales-válidos: se afinan cuando exista el PLP específico (Fase 4),
    // pero nunca generan 404. Las fichas de producto (c2x…) van en el mapa 1:1
    // de Fase 4 cuando existan las PDP.
    const R = "/productos/cocina-y-bar/refrigeracion/refrigeradores";
    const P = "/productos/cocina-y-bar/coccion/parrillas";
    const C = "/productos/cocina-y-bar/coccion/campanas";
    const oxatisTier12 = {
      // — Refrigeración (PLP con filtro exacto)
      "/refrigeradores-pareja-panelables-c102x3177452": `${R}?f=parejas`,
      "/refrigeradores-de-piso-counter-depth-c102x4335296": `${R}?f=counter-depth`,
      "/refrigeradores-de-empotrar-columnas-clasicas-c102x3177451": `${R}?f=columna`,
      "/refrigeradores-de-empotrar-bottom-mount-c102x3177351": `${R}?f=bottom-mount`,
      "/refrigeradores-de-empotrar-con-puerta-de-cristal-c102x3177454": `${R}?f=glass-door`,
      "/refrigeradores-de-empotrar-duplex-c102x3177341": `${R}?f=duplex-side-by-side`,
      "/refrigeradores-de-piso-duplex-c102x3177342": `${R}?f=duplex-side-by-side`,
      "/refrigeradores-de-piso-french-door-5-puertas-c102x4335297": `${R}?f=5-puertas`,
      "/refrigeradores-de-piso-bottom-freezer-c102x3177353": `${R}?f=bottom-mount`,
      "/solo-refrigerador-para-parejas-acero-inoxidable-c102x3966615": `${R}?f=parejas`,
      "/solo-refrigerador-para-parejas-panelable-c102x3966616": `${R}?f=parejas`,
      // — Refrigeración (sin PLP propio todavía → subcat.1)
      "/cajones-refrigerantes-c102x2875111": "/productos/cocina-y-bar/refrigeracion",
      "/cavas-de-vino-refrigeradores-de-bebidas-c102x3177318": "/productos/cocina-y-bar/refrigeracion",
      "/cavas-de-vino-empotrable-under-counter-c102x4334855": "/productos/cocina-y-bar/refrigeracion",
      "/fabricas-de-hielos-c102x3177330": "/productos/cocina-y-bar/refrigeracion",
      // — Parrillas
      "/parrillas-c102x3175068": P,
      "/parrillas-induccion-bajo-cubierta-invisibles-c102x4409646": `${P}?f=invisible`,
      "/parrillas-modulares-teppanyaki-c102x4335559": `${P}?f=modulares`,
      "/parrillas-modulares-1-quemador-a-gas-c102x4335561": `${P}?f=modulares`,
      "/parrillas-modulares-asador-c102x4335558": `${P}?f=modulares`,
      "/parrillas-profesionales-de-48-c102x3180140": `${P}?f=profesional`,
      "/parrillas-profesionales2-c102x3180105": `${P}?f=profesional`,
      "/parrillas-a-gas-de-submontar-c102x4335566": `${P}?f=submontar`,
      "/parrillas-electricas-de-induccion-36-c102x3186022": `${P}?f=induccion`,
      "/parrillas-a-gas-36-c102x3185077": `${P}?f=gas`,
      "/parrillas-electricas-vitroceramica-36-c102x3186018": `${P}?f=vitroceramica`,
      // — Campanas
      "/campanas-downdraft-c102x2875092": `${C}?f=retractiles`,
      "/campana-de-isla-de-cilindrica-o-cuadrada-c102x4358860": `${C}?f=cilindrica-o-cuadrada`,
      "/campanas-integradas-a-parrilla-c102x4335270": `${C}?f=induccion-con-sistema-de-extraccion`,
      "/campanas-para-revestir-c102x4335271": `${C}?f=para-revestir`,
      "/campanas-decorativas-c102x3173897": `${C}?f=decorativas`,
      "/campanas-de-isla-gran-formato-c102x4335273": `${C}?f=gran-formato`,
      "/campanas-empotrables-c102x2874926": `${C}?f=tipo-inserto`,
      "/motor-para-campana-c102x3173988": C,
      // — Asadores (subcat.1 de Exterior ya existe)
      "/asadores-de-gas-de-empotrar-c102x3527945": "/productos/exterior/asadores-y-hornos",
      "/asadores-grills-c102x3180308": "/productos/exterior/asadores-y-hornos",
      "/asadores-de-carbon-c102x3322265": "/productos/exterior/asadores-y-hornos",
      "/asadores-de-gas-c102x3322263": "/productos/exterior/asadores-y-hornos",
      "/asadores-de-gas-con-carrito-c102x3527944": "/productos/exterior/asadores-y-hornos",
      "/asadores-mixtos-gas-carbon-c102x3322266": "/productos/exterior/asadores-y-hornos",
      // — Tarjas (subcat.1)
      "/tarjas-fregaderos-sinks-c102x3171127": "/productos/cocina-y-bar/tarjas-y-griferia",
      "/tarja-de-sobreponer-c102x3171128": "/productos/cocina-y-bar/tarjas-y-griferia",
      "/tarjas-con-accesorios-c102x3171132": "/productos/cocina-y-bar/tarjas-y-griferia",
      "/tarja-de-submontar-para-bar-o-isla-c102x3171129": "/productos/cocina-y-bar/tarjas-y-griferia",
      "/tarja-de-submontar-1-tina-c102x4342245": "/productos/cocina-y-bar/tarjas-y-griferia",
      // — Estufas y cocción (PLP de estufas pendiente → subcat.1 Cocción)
      "/estufas-profesionales-de-48-c102x3179414": "/productos/cocina-y-bar/coccion",
      "/estufas-profesionales-de-60-c102x3179415": "/productos/cocina-y-bar/coccion",
      "/estufas-profesionales-de-36-c102x3179413": "/productos/cocina-y-bar/coccion",
      "/estufas-profesionales-de-30-c102x3179412": "/productos/cocina-y-bar/coccion",
      "/estufas-de-empotrar-tipo-cassette-80-cm-c102x3163668": "/productos/cocina-y-bar/coccion",
      "/estufas-de-empotrar-tipo-cassette-51-cm-c102x3163665": "/productos/cocina-y-bar/coccion",
      "/estufas-de-empotrar-slide-in-a-gas-c102x3158483": "/productos/cocina-y-bar/coccion",
      "/estufas-de-piso-de-36-c102x3894371": "/productos/cocina-y-bar/coccion",
      "/productos-mas-vendidos-estufas-c102x4332585": "/productos/cocina-y-bar/coccion",
      "/microndas-con-campana-bajo-mueble-c102x3176670": "/productos/cocina-y-bar/coccion",
      // — Líneas fuera de la taxonomía nueva → macro más cercana
      "/pasto-artificial-c102x2874966": "/productos/exterior",
      "/muebles-de-jardin-c102x2874839": "/productos/exterior",
      "/plantas-artificiales-c102x2875026": "/productos/exterior",
    };
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
      ...Object.entries(oxatisTier12).map(([source, destination]) => ({
        source,
        destination,
        statusCode: 301,
      })),
      // Página OXATIS "Solicita la instalación" (PBCPPlayer con query string →
      // regla con `has`; ver gotcha en docs/PLAN-REDIRECTS-MIGRACION.md §3).
      // Su contenido vive resumido en /garantias-instalacion#requisitos-instalacion.
      {
        source: "/PBCPPlayer.asp",
        has: [{ type: "query", key: "ID", value: "2437566" }],
        destination: "/garantias-instalacion",
        statusCode: 301,
      },
      // El resto del mapa OXATIS 1:1 (docs/PLAN-REDIRECTS-MIGRACION.md) se añade en Fase 4.
    ];
  },
};

module.exports = nextConfig;
