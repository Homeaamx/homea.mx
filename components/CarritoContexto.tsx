"use client";

// CarritoContexto — lo que el resto del árbol puede saber y hacer con "Mi
// proyecto". Vive aparte de CarritoProvider para que los componentes que el
// proveedor renderiza (cajón, cierre, modal) puedan usar el contexto sin un
// import circular. `useCarrito()` devuelve null fuera del proveedor, que
// envuelve <main> en app/layout.tsx.

import { createContext, useContext } from "react";

import type { Aviso, Carrito, LineaCarrito } from "@/lib/shopify/tipos";

/** Lo que el resto del árbol puede saber y hacer con "Mi proyecto" (p. ej. la página /mi-proyecto). */
export interface CarritoContexto {
  carrito: Carrito;
  aviso?: Aviso;
  /** Hay una operación en vuelo contra Shopify. */
  ocupado: boolean;
  /** Ya llegó la primera respuesta del servidor (antes, el carrito vacío es solo el valor inicial). */
  cargado: boolean;
  abrir: () => void;
  cerrar: () => void;
  /** Cierra el cajón y abre la pre-cotización al centro de la página. */
  abrirCotizacion: () => void;
  cambiar: (linea: LineaCarrito, cantidad: number) => void;
  quitar: (linea: LineaCarrito) => void;
}

export const Contexto = createContext<CarritoContexto | null>(null);

/** El carrito compartido; `null` fuera del proveedor (nunca debería pasar: envuelve <main>). */
export function useCarrito(): CarritoContexto | null {
  return useContext(Contexto);
}


