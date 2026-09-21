// URL permanente de cada lista de precios: /listas-de-precios/<slug>.pdf.
//
// Sirve el PDF vigente de Shopify Files bajo homea.mx (el posicionamiento se queda
// en el dominio y la URL nunca cambia entre ediciones). Una edición nueva solo
// cambia 'url' en data/listas-precios.json y se hace deploy. Las URLs viejas de
// OXATIS llegan aquí con 301 desde proxy.ts (scripts/build-redirects.mjs).
//
// Es un route handler y no un rewrite de next.config.js a propósito: el rewrite
// arrastra el Cache-Control de Shopify (1 año), y en una URL fija eso dejaría la
// edición vieja en el navegador. Aquí la caché la decidimos nosotros.

import listas from "@/data/listas-precios.json";
import type { ListaPrecios } from "@/lib/listasPrecios";

const documentos = (listas.marcas as { documentos: ListaPrecios[] }[]).flatMap((m) => m.documentos);

// Navegador: 1 h. CDN de Vercel: 1 día (y cada deploy la purga, así que una
// edición nueva se ve al publicar).
const CACHE = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

export async function GET(request: Request, { params }: { params: Promise<{ archivo: string }> }) {
  const { archivo } = await params;
  const slug = archivo.toLowerCase().replace(/\.pdf$/, "");
  const doc = archivo.toLowerCase().endsWith(".pdf") ? documentos.find((d) => d.slug === slug) : undefined;
  if (!doc) return new Response("No encontrado", { status: 404 });

  // Lista sin PDF todavía: temporal (302), el PDF llegará.
  if (!doc.url) return Response.redirect(new URL("/marcas#listas-de-precios", request.url), 302);

  const upstream = await fetch(doc.url, { cache: "no-store" });
  // Si Shopify falla, mejor mandar al archivo que dar error.
  if (!upstream.ok || !upstream.body) return Response.redirect(doc.url, 302);

  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Cache-Control": CACHE,
    "Content-Disposition": `inline; filename="lista-precios-${doc.slug}.pdf"`,
  });
  // fetch descomprime: el largo solo vale si el origen no venía comprimido.
  const largo = upstream.headers.get("content-length");
  if (largo && !upstream.headers.get("content-encoding")) headers.set("Content-Length", largo);
  // Se transmite en streaming (los PDFs llegan a ~19 MB).
  return new Response(upstream.body, { status: 200, headers });
}
