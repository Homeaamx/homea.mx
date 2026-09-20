// compra.ts — la regla de negocio que decide si algo se COMPRA o se COTIZA.
//
// PLAN-DE-FASES §4.5: en MXN y ticket bajo, compra directa; en USD, siempre con un
// ejecutivo (él confirma tipo de cambio y descuento). Los 5 Gaggenau del piloto son
// la excepción explícita y aprobada, para poder probar el checkout completo.
//
// IMPORTANTE: esta regla se evalúa en el SERVIDOR, dentro del server action, no solo
// al pintar el botón. El HTML de las fichas es estático y puede quedarse con un
// "Agregar al carrito" viejo; la única garantía de que un producto en dólares no
// llegue al checkout es que el servidor se niegue a meterlo al carrito.

import { COMPRA_DIRECTA_ACTIVA, SKUS_PILOTO_COMPRABLES, TAG_COMPRABLE } from "@/lib/flags";
import { productoPorSku } from "@/lib/catalogo";
import { whatsappHref } from "@/lib/whatsapp";

export interface Comprable {
  /** Moneda declarada por el catálogo para este producto. */
  moneda: string;
  /** Tags de Shopify del producto (vacío si aún no vive en Shopify). */
  tags?: string[];
}

export type Veredicto =
  | { compra: true }
  | { compra: false; motivo: "usd-con-ejecutivo" | "compra-apagada"; mensaje: string };

const esPiloto = (sku: string) =>
  (SKUS_PILOTO_COMPRABLES as readonly string[]).includes(sku.trim().toUpperCase());

/** ¿Este SKU se puede agregar al carrito, o hay que mandarlo a cotizar? */
export function veredictoDeCompra(sku: string, producto: Comprable): Veredicto {
  if (!COMPRA_DIRECTA_ACTIVA) {
    return {
      compra: false,
      motivo: "compra-apagada",
      mensaje: "La compra en línea está en preparación. Te cotizamos por WhatsApp.",
    };
  }

  // El tag de Shopify es la regla definitiva cuando el catálogo esté migrado;
  // la lista de SKUs del piloto es el puente mientras tanto.
  const marcadoComprable = producto.tags?.some(
    (t) => t.trim().toLowerCase() === TAG_COMPRABLE,
  );
  if (marcadoComprable || esPiloto(sku)) return { compra: true };

  if (producto.moneda === "USD") {
    return {
      compra: false,
      motivo: "usd-con-ejecutivo",
      mensaje:
        "Este producto se cotiza en dólares (USD). El tipo de cambio y el descuento los confirma tu ejecutivo de ventas.",
    };
  }

  return { compra: true };
}

/** Mensaje de WhatsApp con el modelo ya escrito, para la caída a cotización. */
export function whatsappDeCotizacion(sku: string): string {
  const p = productoPorSku(sku);
  const descripcion = p ? `el ${p.marca} ${p.nombre} (modelo ${p.sku})` : `el modelo ${sku}`;
  return whatsappHref(`¡Hola! Me interesa ${descripcion}. ¿Me pueden cotizar?`);
}
