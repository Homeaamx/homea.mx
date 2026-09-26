// /api/lead — el correo que deja el visitante en Contacto entra a la lista.
//
// Única puerta entre el formulario y donde vivan los contactos. Hoy es Shopify
// (ver lib/shopify/admin.ts: la lista ya está pagada y Shopify Messaging la
// manda). Cuando HOMEA se mude al CRM definitivo, **solo cambia este archivo**:
// el formulario seguirá publicando aquí igual.
//
// Regla de oro: capturar un correo no puede romper nada. El cliente dispara esto
// y sigue derecho a WhatsApp sin esperar la respuesta, así que cualquier fallo
// (sin token, Shopify caído, correo inválido) se traga aquí y se responde 200
// con el detalle. Lo que no se hace jamás es devolver un error que le estorbe al
// visitante.

import { NextResponse } from "next/server";

import { guardarContacto, HAY_ADMIN } from "@/lib/shopify/admin";

export const runtime = "nodejs";
// Escribe en Shopify: nunca se cachea ni se prerenderiza.
export const dynamic = "force-dynamic";

/** Suficiente para descartar basura sin pelearse con los correos raros válidos. */
const CORREO = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
/** Tope de tamaño: un formulario legítimo no manda más que esto. */
const MAX = 600;

function texto(valor: unknown, limite = 120): string {
  return typeof valor === "string" ? valor.trim().slice(0, limite) : "";
}

export async function POST(request: Request) {
  let cuerpo: Record<string, unknown>;
  try {
    const crudo = await request.text();
    if (crudo.length > MAX) return NextResponse.json({ ok: false, motivo: "payload" });
    cuerpo = JSON.parse(crudo) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, motivo: "json" });
  }

  const correo = texto(cuerpo.correo).toLowerCase();
  if (!CORREO.test(correo)) return NextResponse.json({ ok: false, motivo: "correo" });

  // Sin token configurado no se pierde el dato en silencio: queda en el log del
  // servidor para que se pueda rescatar a mano mientras se termina de conectar.
  if (!HAY_ADMIN) {
    console.warn(`[lead] sin Admin API — correo recibido y NO guardado: ${correo}`);
    return NextResponse.json({ ok: false, motivo: "sin-configurar" });
  }

  const resultado = await guardarContacto({
    correo,
    nombre: texto(cuerpo.nombre) || undefined,
    ciudad: texto(cuerpo.ciudad, 60) || undefined,
    consiente: cuerpo.consiente === true,
    // De dónde salió: sirve para segmentar la campaña y para medir qué página trae lista.
    etiquetas: ["homea.mx", texto(cuerpo.origen, 40) || "contacto"],
  });

  return NextResponse.json(resultado);
}
