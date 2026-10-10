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
//
// Además (Carla, 2026-10-10): con el TC nuevo reescribe en Shopify los pesos de
// toda pieza en dólares (lib/shopify/repreciar.ts). Así el carrito de un cliente
// —que Shopify suma en pesos— se actualiza al tipo de cambio del día, igual que
// la página Mi proyecto, la pre-cotización y el checkout.
// `?simular=1` informa cuántos productos cambiarían sin escribir nada.

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { TAG_CATALOGO } from "@/lib/shopify/catalogoVivo";
import { repreciarUsd } from "@/lib/shopify/repreciar";
import { TAG_TIPO_CAMBIO, obtenerTipoCambio } from "@/lib/tipoCambio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** La operación masiva de precios puede tardar: se le da el máximo de Vercel. */
export const maxDuration = 300;

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

  const simular = new URL(request.url).searchParams.get("simular") === "1";
  const precios = await repreciarUsd(tc, { aplicar: !simular });
  if (!precios.ok) console.error(`[tipo-cambio] Precios en dólares sin actualizar: ${precios.motivo}`);
  // Las tarjetas y fichas leen el catálogo con caché de 1 h: se invalida para
  // que el monto de compra (regla de $100k) y los pesos salgan ya con el TC nuevo.
  if (!simular && precios.porCambiar > 0) revalidateTag(TAG_CATALOGO, "max");

  return NextResponse.json({
    actualizado: new Date().toISOString(),
    valor: tc.valor,
    fix: tc.fix,
    fecha: tc.fecha,
    fuente: tc.fuente,
    precios,
  });
}
