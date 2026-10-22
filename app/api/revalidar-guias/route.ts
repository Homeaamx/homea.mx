// Refresca al momento Guías después de publicar o editar una entrada en el blog
// "Guías" de Shopify. Sin esto el sitio tarda hasta una hora en mostrarla
// (lib/shopify/guias.ts guarda el blog en caché con el tag "guias").
//
// Uso: GET /api/revalidar-guias con `Authorization: Bearer $CRON_SECRET`
// (el mismo secreto del cron del tipo de cambio).

import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { TAG_GUIAS } from "@/lib/shopify/guias";

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
  // expire: 0 → la siguiente visita ya trae el blog nuevo; las páginas de
  // /guias (hub, índices y artículos) se regeneran con él.
  revalidateTag(TAG_GUIAS, { expire: 0 });
  revalidatePath("/guias", "layout");
  revalidatePath("/api/buscar-guias");
  revalidatePath("/sitemap.xml");
  return NextResponse.json({ ok: true, revalidado: TAG_GUIAS });
}
