// /api/buscar?q=… — autocompletado del buscador de la lupa.
//
// Server-side a propósito: el índice completo (305 productos hoy, ~25k tras la
// migración) nunca viaja al navegador. Cada tecla trae como mucho 8 filas ya
// formateadas.

import { NextResponse } from "next/server";

import { buscar, sugerir, POR_PAGINA } from "@/lib/catalogo";

export const runtime = "nodejs";
// El índice es estático entre builds; se cachea en el edge por 5 min.
export const revalidate = 300;

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q") ?? "";
  const { resultados, total, pagina, paginas } = buscar(q, Number(params.get("p") ?? 1));

  return NextResponse.json(
    // `sugerencia` es SOLO el tramo que falta ("gagg" → "enau"): el cliente
    // pinta el ghost concatenando, sin tener que recortar nada.
    // `porPagina` viaja al cliente para que pueda rellenar la última página con
    // huecos y el panel no cambie de alto al paginar. No se importa la constante
    // en el componente: `lib/catalogo` arrastra el índice completo al bundle.
    { q, total, pagina, paginas, porPagina: POR_PAGINA, resultados, sugerencia: sugerir(q) },
    {
      // max-age=0 → el navegador revalida siempre (si no, se queda con
      // resultados viejos tras regenerar el índice); s-maxage → el CDN sí cachea.
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
      },
    },
  );
}
