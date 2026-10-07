// compra.ts — cómo se cierra "Mi proyecto": pago en Shopify o cotización.
//
// Regla vigente (Carla, 2026-10-06), en lib/reglas/reglaMarca.ts: por pieza,
// (1) en stock → se compra; (2) marca "solo cotizar" → se cotiza; (3) más de
// $100,000 MXN con IVA → se cotiza; (4) lo demás → se compra. TODA pieza entra
// al proyecto; es al cerrar cuando se decide: si todas se compran, el proyecto
// va al checkout de Shopify; si alguna se cotiza, el proyecto completo se manda
// al vendedor por WhatsApp (PLAN-DE-FASES §4.5, "carrito mixto").
//
// IMPORTANTE: la regla se evalúa en el SERVIDOR (lib/shopify/normalizar.ts, con
// los datos de Shopify) y el checkout solo se entrega al navegador cuando el
// proyecto es `checkout`. El HTML de las fichas es estático y puede quedarse con
// un botón viejo; la garantía es que el servidor nunca suelta un `checkoutUrl`
// para un proyecto que se cotiza.
//
// Lo que ya NO existe: la excepción de los 5 Gaggenau del piloto (Gaggenau es
// "solo cotizar") y el tag `comprable-online`.

import { COMPRA_DIRECTA_ACTIVA } from "@/lib/flags";
import { productoPorSku } from "@/lib/catalogo";
import type { Carrito } from "@/lib/shopify/tipos";
import { whatsappHref } from "@/lib/whatsapp";

/**
 * Última palabra del servidor sobre el proyecto: con la compra en línea apagada
 * todo se cotiza, y un proyecto que se cotiza viaja SIN checkoutUrl.
 */
export function cerrarProyecto(carrito: Carrito): Carrito {
  const modo = COMPRA_DIRECTA_ACTIVA ? carrito.modo : "cotizacion";
  return {
    ...carrito,
    modo,
    checkoutUrl: modo === "checkout" ? carrito.checkoutUrl : null,
  };
}

/** Mensaje de WhatsApp con el modelo ya escrito, para la caída a cotización. */
export function whatsappDeCotizacion(sku: string): string {
  const p = productoPorSku(sku);
  const descripcion = p ? `el ${p.marca} ${p.nombre} (modelo ${p.sku})` : `el modelo ${sku}`;
  return whatsappHref(`¡Hola! Me interesa ${descripcion}. ¿Me pueden cotizar?`);
}
