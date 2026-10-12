// /api/cotizacion — guarda la pre-cotización del modal de "Mi proyecto" como
// pedido borrador de Shopify (lib/cotizacionServidor.ts) y devuelve su folio y su
// liga corta /c/<ref>. El navegador la usa para el PDF y para el WhatsApp.
//
// Público por necesidad (lo llama el visitante): por eso se acota todo —
// tamaño del cuerpo, campos, número de piezas— y hay un freno por IP para que
// nadie llene Shopify de borradores. Si algo falla responde ok:false y el modal
// manda la liga sin guardar (/cotizacion?p=…): el cliente nunca se queda atorado.

import { NextResponse } from "next/server";

import { datosDeQuery, parsearPartidas } from "@/lib/cotizacion";
import { guardarPreCotizacion } from "@/lib/cotizacionServidor";
import { HAY_ADMIN } from "@/lib/shopify/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = 4000;

/** Freno por IP: 8 envíos cada 10 minutos por instancia (suficiente para un cliente que corrige datos). */
const VENTANA_MS = 10 * 60 * 1000;
const TOPE = 8;
const envios = new Map<string, number[]>();
function frenado(ip: string): boolean {
  const ahora = Date.now();
  const recientes = (envios.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  recientes.push(ahora);
  envios.set(ip, recientes);
  if (envios.size > 5000) envios.clear();
  return recientes.length > TOPE;
}

export async function POST(request: Request) {
  if (!HAY_ADMIN) return NextResponse.json({ ok: false, motivo: "sin-configurar" });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (frenado(ip)) return NextResponse.json({ ok: false, motivo: "frenado" }, { status: 429 });

  let cuerpo: Record<string, unknown>;
  try {
    const crudo = await request.text();
    if (crudo.length > MAX) return NextResponse.json({ ok: false, motivo: "payload" }, { status: 413 });
    cuerpo = JSON.parse(crudo) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, motivo: "json" }, { status: 400 });
  }

  const refs = parsearPartidas(typeof cuerpo.p === "string" ? cuerpo.p : "");
  const d = (cuerpo.datos ?? {}) as Record<string, unknown>;
  const campo = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");
  const datos = datosDeQuery((k) =>
    ({ n: campo("nombre"), t: campo("telefono"), c: campo("ciudad"), z: campo("cp"), e: campo("correo"), y: campo("proyecto") })[k],
  );
  if (!refs.length || !datos.nombre || !datos.telefono) {
    return NextResponse.json({ ok: false, motivo: "incompleta" }, { status: 400 });
  }

  const anterior = typeof cuerpo.ref === "string" ? cuerpo.ref.slice(0, 40) : undefined;
  const hecha = await guardarPreCotizacion(refs, datos, anterior);
  if (!hecha) return NextResponse.json({ ok: false, motivo: "shopify" }, { status: 502 });

  const url = `${new URL(request.url).origin}/c/${hecha.ref}`;
  return NextResponse.json({ ok: true, ...hecha, url });
}
