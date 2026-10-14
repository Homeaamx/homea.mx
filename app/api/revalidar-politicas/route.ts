// Refresca al momento las páginas legales después de editar una política en
// Shopify (Configuración → Políticas). Sin esto el sitio tarda hasta un día en
// mostrar el cambio: Términos, Aviso de privacidad, Aviso legal y Devoluciones
// se guardan en caché 24 h (lib/shopify/politicas.ts, tag "politicas").
//
// Uso: GET /api/revalidar-politicas con `Authorization: Bearer $CRON_SECRET`
// (el mismo secreto del cron del tipo de cambio).

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function autorizado(request: Request): boolean {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return false;
  return request.headers.get("authorization") === `Bearer ${secreto}`;
}

export async function GET(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  // expire: 0 → la siguiente visita ya no recibe el texto viejo.
  revalidateTag("politicas", { expire: 0 });
  return NextResponse.json({ ok: true, revalidado: "politicas" });
}
