// /api/buscar?q=… — autocompletado del buscador de la lupa.
//
// Server-side a propósito: la consulta va a la Storefront API de Shopify
// (lib/shopify/buscar.ts) y el navegador recibe como mucho 8 filas ya
// formateadas por página. Solo aparece lo PUBLICADO en el canal Headless: una
// marca nueva en Shopify se busca al instante, sin regenerar ningún índice.

import { NextResponse } from "next/server";

import { buscarCatalogo } from "@/lib/shopify/buscar";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q") ?? "";
  const respuesta = await buscarCatalogo(q, Number(params.get("p") ?? 1));

  return NextResponse.json(
    // `sugerencia` es SOLO el tramo que falta ("gagg" → "enau"): el cliente
    // pinta el ghost concatenando, sin tener que recortar nada.
    // `porPagina` viaja al cliente para que pueda rellenar la última página con
    // huecos y el panel no cambie de alto al paginar.
    { q, ...respuesta },
    {
      // max-age=0 → el navegador revalida siempre; s-maxage → el CDN sí cachea
      // 5 min (la consulta a Shopify también vive 5 min en el Data Cache).
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
      },
    },
  );
}
