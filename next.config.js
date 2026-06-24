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
    return [
      // { source: "/old-path", destination: "/guias/...", permanent: true },
    ];
  },
};

module.exports = nextConfig;
