// galleta.ts — la cookie donde vive el identificador del carrito.
//
// httpOnly a propósito: el carrito dejó de ser un objeto de localStorage que el
// navegador podía editar a su antojo (así funcionaba `public/cart.js`). Ahora el
// navegador solo carga una llave opaca y el contenido —precios, existencias,
// totales— lo dicta Shopify.
//
// Ojo: `cookies()` SOLO puede llamarse dentro de un server action o un route
// handler. Llamarlo al renderizar volvería dinámicas las páginas estáticas de
// producto (ver comentario en app/acciones/carrito.ts).

import "server-only";
import { cookies } from "next/headers";

const NOMBRE = "homea_carrito";
/** Shopify purga los carritos inactivos a los ~10 días; no prometer más. */
const DIAS = 10;

const opciones = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * DIAS,
};

export async function leerIdCarrito(): Promise<string | null> {
  return (await cookies()).get(NOMBRE)?.value ?? null;
}

export async function guardarIdCarrito(id: string): Promise<void> {
  // Se guarda el id COMPLETO y tal cual: los carritos modernos llevan un sufijo
  // `?key=…` que forma parte de la llave. Recortarlo invalida el carrito.
  (await cookies()).set(NOMBRE, id, opciones);
}

export async function olvidarCarrito(): Promise<void> {
  (await cookies()).delete(NOMBRE);
}
