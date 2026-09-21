"use server";

// Server actions del carrito.
//
// Tres decisiones de arquitectura que conviene no "mejorar" sin leer esto:
//
// 1. **`cookies()` se toca SOLO aquí.** Leer la cookie durante el render de una
//    página volvería dinámico todo el árbol de rutas y las fichas de producto
//    dejarían de ser estáticas/ISR — justo lo que la regla de oro de SEO
//    (CLAUDE.md §6) no permite. Estas acciones corren en POST, fuera del render.
//
// 2. **Nada de `revalidatePath` / `revalidateTag`.** Cambiar un carrito no cambia
//    el contenido de ninguna página; revalidar tiraría la caché ISR de una página
//    compartida por culpa de un visitante. La acción devuelve el carrito completo
//    y el estado de React se encarga del resto.
//
// 3. **El carrito se crea tarde.** Un visitante que solo mira no genera carrito en
//    Shopify ni cookie: `obtenerCarrito()` sin cookie devuelve el carrito vacío sin
//    salir a la red. `cartCreate` ocurre en la primera alta exitosa.

import { CHECKOUT_ABIERTO } from "@/lib/flags";
import { productoPorSku } from "@/lib/catalogo";
import { veredictoDeCompra, whatsappDeCotizacion } from "@/lib/reglas/compra";
import { ErrorShopify } from "@/lib/shopify/cliente";
import {
  CarritoCaducado,
  agregarLinea,
  buscarVariante,
  cambiarCantidadLinea,
  crearCarrito,
  leerCarrito,
  quitarLinea,
} from "@/lib/shopify/carrito";
import { guardarIdCarrito, leerIdCarrito, olvidarCarrito } from "@/lib/shopify/galleta";
import {
  SIMULACION_PERMITIDA,
  agregarSimulado,
  cambiarCantidadSimulada,
  leerSimulado,
  quitarSimulado,
} from "@/lib/shopify/simulado";
import { CARRITO_VACIO, type Carrito, type ResultadoCarrito } from "@/lib/shopify/tipos";
import { whatsappHref } from "@/lib/whatsapp";

/** Mensajes de la degradación: siempre explican QUÉ pasa y ofrecen salida. */
const SIN_SHOPIFY =
  "El carrito en línea no está disponible en este momento. Te atendemos por WhatsApp.";

/**
 * El checkout solo se ofrece cuando la tienda ya no tiene contraseña. Comprobado:
 * con el candado puesto, el `checkoutUrl` responde 302 → /password, así que
 * mostrarlo activo sería mandar al cliente a un callejón sin salida.
 */
function aplicarEstadoCheckout(carrito: Carrito): Carrito {
  if (carrito.simulado || carrito.lineas.length === 0) return carrito;
  if (CHECKOUT_ABIERTO) return carrito;
  return { ...carrito, bloqueo: carrito.bloqueo ?? "tienda-con-password" };
}

/** Plan B único para todos los fallos de Shopify. */
async function degradar(error: unknown): Promise<ResultadoCarrito> {
  if (!(error instanceof ErrorShopify) && !(error instanceof CarritoCaducado)) throw error;

  const detalle = error instanceof ErrorShopify ? `${error.clase}: ${error.message}` : error.message;

  if (SIMULACION_PERMITIDA) {
    // En desarrollo se sigue trabajando con el carrito simulado, pero el aviso
    // deja clarísimo que NO se está hablando con Shopify.
    console.warn(`[carrito] Shopify no disponible (${detalle}) — carrito simulado.`);
    return {
      carrito: await leerSimulado(),
      aviso: { tipo: "info", mensaje: `Carrito simulado · Shopify no disponible (${detalle})` },
    };
  }

  console.error(`[carrito] Shopify no disponible (${detalle}).`);
  return {
    carrito: CARRITO_VACIO,
    aviso: { tipo: "error", mensaje: SIN_SHOPIFY, whatsapp: whatsappHref() },
  };
}

export async function obtenerCarrito(): Promise<ResultadoCarrito> {
  const id = await leerIdCarrito();
  if (!id) {
    // Sin cookie no hay nada que consultar. En desarrollo puede haber carrito
    // simulado, que vive en su propia cookie.
    if (SIMULACION_PERMITIDA) {
      const simulado = await leerSimulado();
      if (simulado.lineas.length) return { carrito: simulado };
    }
    return { carrito: CARRITO_VACIO };
  }

  try {
    return { carrito: aplicarEstadoCheckout(await leerCarrito(id)) };
  } catch (error) {
    if (error instanceof CarritoCaducado) {
      await olvidarCarrito();
      return { carrito: CARRITO_VACIO };
    }
    return degradar(error);
  }
}

export async function agregarAlCarrito(
  idVariante: string,
  sku: string,
  cantidad = 1,
): Promise<ResultadoCarrito> {
  const enIndice = productoPorSku(sku);

  try {
    const variante = await buscarVariante(idVariante, sku);

    if (!variante) {
      // Estado esperado mientras el catálogo siga en borrador: la Storefront API
      // no ve los productos en draft ni los no publicados al canal.
      return {
        carrito: (await obtenerCarrito()).carrito,
        aviso: {
          tipo: "error",
          mensaje: "Este modelo aún no está publicado para compra en línea.",
          whatsapp: whatsappDeCotizacion(sku),
        },
      };
    }

    // La regla de moneda se evalúa con los datos de Shopify, no con los del HTML.
    const veredicto = veredictoDeCompra(sku, {
      moneda: variante.price.currencyCode,
      tags: variante.product.tags,
    });
    if (!veredicto.compra) {
      return {
        carrito: (await obtenerCarrito()).carrito,
        aviso: { tipo: "info", mensaje: veredicto.mensaje },
        redireccion: whatsappDeCotizacion(sku),
      };
    }

    if (!variante.availableForSale) {
      return {
        carrito: (await obtenerCarrito()).carrito,
        aviso: {
          tipo: "info",
          mensaje: "Bajo pedido · te confirma existencia un especialista.",
          whatsapp: whatsappDeCotizacion(sku),
        },
      };
    }

    const id = await leerIdCarrito();
    let carrito: Carrito;
    if (id) {
      try {
        carrito = await agregarLinea(id, variante.id, cantidad);
      } catch (error) {
        if (!(error instanceof CarritoCaducado)) throw error;
        // Carrito purgado por Shopify: se crea uno nuevo y se reintenta UNA vez.
        await olvidarCarrito();
        carrito = await crearCarrito(variante.id, cantidad);
      }
    } else {
      carrito = await crearCarrito(variante.id, cantidad);
    }

    if (carrito.id) await guardarIdCarrito(carrito.id);
    return { carrito: aplicarEstadoCheckout(carrito) };
  } catch (error) {
    // Antes de degradar, la regla de moneda se aplica igual con el índice local:
    // que Shopify esté caído no puede convertir un producto en dólares en
    // comprable.
    const veredicto = veredictoDeCompra(sku, { moneda: enIndice?.moneda ?? "MXN" });
    if (!veredicto.compra) {
      return {
        carrito: (await degradar(error)).carrito,
        aviso: { tipo: "info", mensaje: veredicto.mensaje },
        redireccion: whatsappDeCotizacion(sku),
      };
    }
    if (SIMULACION_PERMITIDA && (error instanceof ErrorShopify || error instanceof CarritoCaducado)) {
      const detalle = error instanceof ErrorShopify ? error.clase : "carrito-caducado";
      console.warn(`[carrito] alta simulada (${detalle}).`);
      return {
        carrito: await agregarSimulado(sku, cantidad),
        aviso: { tipo: "info", mensaje: `Carrito simulado · Shopify no disponible (${detalle})` },
      };
    }
    return degradar(error);
  }
}

export async function cambiarCantidad(
  idLinea: string,
  cantidad: number,
): Promise<ResultadoCarrito> {
  if (cantidad < 1) return quitarDelCarrito(idLinea);

  const id = await leerIdCarrito();
  if (!id) {
    if (SIMULACION_PERMITIDA) return { carrito: await cambiarCantidadSimulada(idLinea, cantidad) };
    return { carrito: CARRITO_VACIO };
  }

  try {
    return { carrito: aplicarEstadoCheckout(await cambiarCantidadLinea(id, idLinea, cantidad)) };
  } catch (error) {
    return degradar(error);
  }
}

export async function quitarDelCarrito(idLinea: string): Promise<ResultadoCarrito> {
  const id = await leerIdCarrito();
  if (!id) {
    if (SIMULACION_PERMITIDA) return { carrito: await quitarSimulado(idLinea) };
    return { carrito: CARRITO_VACIO };
  }

  try {
    return { carrito: aplicarEstadoCheckout(await quitarLinea(id, idLinea)) };
  } catch (error) {
    return degradar(error);
  }
}
