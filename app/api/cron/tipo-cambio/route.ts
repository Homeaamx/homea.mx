// Cron diario del tipo de cambio.
//
// Banxico determina el FIX alrededor del mediodía y lo publica ese mismo día
// hábil. Este endpoint corre después (ver `vercel.json`), invalida el tag del
// Data Cache y vuelve a consultar para dejar el valor nuevo ya caliente: así el
// primer visitante de la tarde no paga la espera de la consulta.
//
// Sin este cron el sitio igual se actualizaría —la consulta tiene `revalidate`
// de un día— pero lo haría a la hora en que cayera la primera visita, que puede
// ser antes de que Banxico publique. Con el cron, el sitio cambia de precio a
// una hora conocida, que es lo que un vendedor necesita para saber qué número
// está viendo su cliente.

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { TAG_TIPO_CAMBIO, obtenerTipoCambio } from "@/lib/tipoCambio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron firma sus llamadas con `Authorization: Bearer $CRON_SECRET`.
 * Sin secreto configurado, el endpoint queda cerrado: es preferible un cron que
 * falle ruidosamente a un endpoint abierto que cualquiera pueda estar golpeando.
 */
function autorizado(request: Request): boolean {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return false;
  return request.headers.get("authorization") === `Bearer ${secreto}`;
}

export async function GET(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Next 16 pide el perfil de caché como segundo argumento; "max" marca como
  // vencido todo lo etiquetado, que es justo lo que se busca al publicar el FIX.
  revalidateTag(TAG_TIPO_CAMBIO, "max");
  const tc = await obtenerTipoCambio();

  // La fuente viaja en la respuesta a propósito: en el log de Vercel se ve de un
  // vistazo si el sitio lleva días sirviendo el valor de respaldo porque el
  // token de Banxico caducó.
  if (tc.fuente === "respaldo") {
    console.error("[tipo-cambio] Sin dato de Banxico: el sitio usa el valor de respaldo.");
  }

  return NextResponse.json({
    actualizado: new Date().toISOString(),
    valor: tc.valor,
    fix: tc.fix,
    fecha: tc.fecha,
    fuente: tc.fuente,
  });
}
