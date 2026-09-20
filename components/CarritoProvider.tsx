"use client";

// CarritoProvider — el puente entre el HTML estático del preview y el carrito de
// Shopify. Sustituye por completo a `public/cart.js`.
//
// El nav y las fichas de producto se inyectan como HTML crudo
// (`dangerouslySetInnerHTML` en app/layout.tsx y components/MarketingPage.tsx),
// así que sus botones NO son React y no se les puede poner un onClick. La salida
// es la misma que ya usa `BuscadorOverlay` con la lupa del nav: un listener
// delegado en `document`. Es el patrón del proyecto, no un truco nuevo.
//
// Del botón solo se leen los identificadores (`data-cart-vid`, `data-cart-sku`) y
// un par de datos cosméticos para la fila optimista. **El precio jamás sale del
// HTML**: lo dice Shopify. Ese era el defecto de fondo del carrito anterior.

import { useCallback, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";

import {
  agregarAlCarrito,
  cambiarCantidad,
  obtenerCarrito,
  quitarDelCarrito,
} from "@/app/acciones/carrito";
import { CARRITO_VACIO, type Aviso, type Carrito, type LineaCarrito } from "@/lib/shopify/tipos";

import CarritoDrawer from "./CarritoDrawer";

/** Llave del carrito viejo en localStorage; se limpia una vez tras la migración. */
const LLAVE_LEGADA = "homea:cart:v1";

export default function CarritoProvider() {
  const [montado, setMontado] = useState(false);
  const [carrito, setCarrito] = useState<Carrito>(CARRITO_VACIO);
  const [aviso, setAviso] = useState<Aviso | undefined>();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();

  // El optimismo cubre SOLO la cantidad y el badge: son datos sin dinero de por
  // medio. El subtotal se queda con el valor anterior atenuado hasta que Shopify
  // conteste — inventar un total en el navegador es justo lo que se vino a quitar.
  const [carritoVista, aplicarOptimista] = useOptimistic(
    carrito,
    (actual: Carrito, cambio: { id: string; cantidad: number }): Carrito => {
      const lineas = actual.lineas
        .map((l) => (l.id === cambio.id ? { ...l, cantidad: cambio.cantidad } : l))
        .filter((l) => l.cantidad > 0);
      return {
        ...actual,
        lineas,
        cantidadTotal: lineas.reduce((n, l) => n + l.cantidad, 0),
      };
    },
  );

  /** Descarta respuestas de acciones que ya quedaron obsoletas (clic repetido en +). */
  const secuencia = useRef(0);

  const aplicar = useCallback((turno: number, resultado: Awaited<ReturnType<typeof obtenerCarrito>>) => {
    if (turno !== secuencia.current) return;
    setCarrito(resultado.carrito);
    setAviso(resultado.aviso);
    if (resultado.redireccion) window.open(resultado.redireccion, "_blank", "noopener");
  }, []);

  /* ---------- Montaje: hidratación y limpieza del carrito viejo ---------- */
  useEffect(() => {
    setMontado(true);
    try {
      // Quien ya tenía carrito de localStorage arrastraría un fantasma que no
      // puede ver ni pagar: se borra una sola vez.
      localStorage.removeItem(LLAVE_LEGADA);
    } catch {
      /* modo privado o storage bloqueado: da igual, era solo limpieza. */
    }

    const turno = ++secuencia.current;
    obtenerCarrito().then((r) => aplicar(turno, r));
  }, [aplicar]);

  /* ---------- Acciones ---------- */
  const agregar = useCallback(
    (vid: string, sku: string) => {
      const turno = ++secuencia.current;
      setAviso(undefined);
      setAbierto(true);
      iniciar(async () => aplicar(turno, await agregarAlCarrito(vid, sku, 1)));
    },
    [aplicar],
  );

  const cambiar = useCallback(
    (linea: LineaCarrito, cantidad: number) => {
      const turno = ++secuencia.current;
      iniciar(async () => {
        aplicarOptimista({ id: linea.id, cantidad });
        aplicar(turno, await cambiarCantidad(linea.id, cantidad));
      });
    },
    [aplicar, aplicarOptimista],
  );

  const quitar = useCallback(
    (linea: LineaCarrito) => {
      const turno = ++secuencia.current;
      iniciar(async () => {
        aplicarOptimista({ id: linea.id, cantidad: 0 });
        aplicar(turno, await quitarDelCarrito(linea.id));
      });
    },
    [aplicar, aplicarOptimista],
  );

  /* ---------- Disparadores dentro del HTML inyectado ---------- */
  useEffect(() => {
    function alHacerClic(ev: MouseEvent) {
      const destino = ev.target;
      if (!(destino instanceof Element)) return;

      const alta = destino.closest<HTMLElement>(".cart-add");
      if (alta) {
        ev.preventDefault();
        const vid = alta.getAttribute("data-cart-vid") ?? "";
        const sku = alta.getAttribute("data-cart-sku") ?? "";
        if (vid || sku) agregar(vid, sku);
        return;
      }

      if (destino.closest(".cart-open")) {
        ev.preventDefault();
        setAbierto(true);
      }
    }

    // Fase de captura para adelantarse a <PreviewRouter>, que intercepta clics en
    // enlaces internos. No se hace `stopPropagation()` a propósito: con
    // `preventDefault()` basta, y así siguen vivos los listeners de analítica.
    document.addEventListener("click", alHacerClic, true);
    return () => document.removeEventListener("click", alHacerClic, true);
  }, [agregar]);

  /* ---------- Esc cierra ---------- */
  useEffect(() => {
    if (!abierto) return;
    function alTeclear(ev: KeyboardEvent) {
      if (ev.key === "Escape") setAbierto(false);
    }
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  /* ---------- Bloqueo del scroll ---------- */
  useEffect(() => {
    document.documentElement.classList.toggle("wl-lock", abierto);
    return () => document.documentElement.classList.remove("wl-lock");
  }, [abierto]);

  /* ---------- Badge del nav (vive fuera de React) ---------- */
  useEffect(() => {
    const n = carritoVista.cantidadTotal;

    function pintar() {
      document.querySelectorAll<HTMLElement>(".cart-count").forEach((b) => {
        const texto = String(n);
        // Escrituras condicionadas: escribir siempre despertaría al observador.
        if (b.textContent !== texto) b.textContent = texto;
        if (b.hidden !== (n === 0)) b.hidden = n === 0;
      });
      document.querySelectorAll(".nav-ic.cart-open").forEach((a) => {
        a.classList.toggle("has-items", n > 0);
      });
    }

    pintar();

    // El nav se re-inyecta como HTML al navegar, y con él nace un badge en cero.
    // Se observa SOLO la raíz del chrome y sin `subtree`: escribir dentro de un
    // span anidado no puede volver a disparar el observador, así que no existe el
    // bucle de re-render que el carrito anterior tenía que amortiguar.
    const chrome = document.querySelector(".site-chrome");
    if (!chrome) return;
    const observador = new MutationObserver(pintar);
    observador.observe(chrome, { childList: true });
    return () => observador.disconnect();
  }, [carritoVista.cantidadTotal]);

  if (!montado) return null;

  return createPortal(
    <CarritoDrawer
      carrito={carritoVista}
      aviso={aviso}
      abierto={abierto}
      ocupado={pendiente}
      onCerrar={() => setAbierto(false)}
      onCantidad={cambiar}
      onQuitar={quitar}
    />,
    document.body,
  );
}
