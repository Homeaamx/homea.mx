"use client";

// CarritoProvider — el puente entre el HTML estático del preview y "Mi proyecto"
// (el carrito de Shopify). Sustituye por completo a `public/cart.js`.
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

import {
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import {
  agregarAlCarrito,
  cambiarCantidad,
  obtenerCarrito,
  quitarDelCarrito,
} from "@/app/acciones/carrito";
import { CARRITO_VACIO, type Aviso, type Carrito, type LineaCarrito } from "@/lib/shopify/tipos";

import { Contexto, type CarritoContexto } from "./CarritoContexto";
import CarritoDrawer from "./CarritoDrawer";
import PreCotizacionModal from "./PreCotizacionModal";

/** Cuánto hay que sostener el cursor sobre "Mi proyecto" para que se abra el cajón (Carla: 0,5 s). */
const HOVER_ABRIR_MS = 500;

/** Llave del carrito viejo en localStorage; se limpia una vez tras la migración. */
const LLAVE_LEGADA = "homea:cart:v1";

export default function CarritoProvider({ children }: { children?: ReactNode }) {
  const [montado, setMontado] = useState(false);
  const [cargado, setCargado] = useState(false);
  const [carrito, setCarrito] = useState<Carrito>(CARRITO_VACIO);
  const [aviso, setAviso] = useState<Aviso | undefined>();
  const [abierto, setAbierto] = useState(false);
  // Pre-cotización abierta al centro (cierra el cajón): Carla, 2026-10-08.
  const [cotizando, setCotizando] = useState(false);
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
  /** Hasta cuándo se ignora el hover del botón del nav (tras un clic que navega). */
  const silencioHover = useRef(0);
  /** Temporizador del hover pendiente: el clic lo cancela (si no, abriría el cajón ya navegado). */
  const esperaHover = useRef(0);

  const aplicar = useCallback((turno: number, resultado: Awaited<ReturnType<typeof obtenerCarrito>>) => {
    if (turno !== secuencia.current) return;
    setCarrito(resultado.carrito);
    setAviso(resultado.aviso);
    setCargado(true);
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
    (vid: string, sku: string, cantidad = 1) => {
      const turno = ++secuencia.current;
      setAviso(undefined);
      setAbierto(true);
      iniciar(async () => aplicar(turno, await agregarAlCarrito(vid, sku, cantidad)));
    },
    [aplicar],
  );

  /** Varias piezas de golpe (la wishlist completa): una tras otra, en orden. */
  const agregarVarias = useCallback(
    (items: { vid: string; sku: string }[]) => {
      if (!items.length) return;
      const turno = ++secuencia.current;
      setAviso(undefined);
      setAbierto(true);
      iniciar(async () => {
        let resultado: Awaited<ReturnType<typeof agregarAlCarrito>> | null = null;
        for (const it of items) {
          if (!it.vid && !it.sku) continue;
          resultado = await agregarAlCarrito(it.vid, it.sku, 1);
        }
        if (resultado) aplicar(turno, resultado);
      });
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
        // Selector de unidades junto al botón (ficha): si no hay, una pieza.
        const campo = alta.closest(".pdp-cta")?.querySelector<HTMLInputElement>("[data-cart-qty]");
        const cantidad = Math.min(99, Math.max(1, Number.parseInt(campo?.value ?? "1", 10) || 1));
        if (vid || sku) agregar(vid, sku, cantidad);
        return;
      }

      const todas = destino.closest<HTMLElement>(".cart-add-all");
      if (todas) {
        ev.preventDefault();
        try {
          const items = JSON.parse(todas.getAttribute("data-cart-items") ?? "[]") as { vid?: string; sku?: string }[];
          agregarVarias(items.map((it) => ({ vid: String(it.vid ?? ""), sku: String(it.sku ?? "") })));
        } catch {
          /* atributo malformado: no hay nada que agregar. */
        }
        return;
      }

      // El botón del nav lleva a /mi-proyecto (navega PreviewRouter): se cierra
      // el cajón por si el hover ya lo había abierto, y se calla el hover un
      // momento: al re-inyectarse el nav bajo el cursor quieto, el navegador
      // dispara mouseover sin que el usuario se haya movido.
      if (destino.closest(".cart-open")) {
        window.clearTimeout(esperaHover.current);
        esperaHover.current = 0;
        setAbierto(false);
        silencioHover.current = Date.now() + 2000;
      }
    }

    // Fase de captura para adelantarse a <PreviewRouter>, que intercepta clics en
    // enlaces internos. No se hace `stopPropagation()` a propósito: con
    // `preventDefault()` basta, y así siguen vivos los listeners de analítica.
    document.addEventListener("click", alHacerClic, true);
    return () => document.removeEventListener("click", alHacerClic, true);
  }, [agregar, agregarVarias]);

  /* ---------- Sostener el cursor 0,5 s sobre "Mi proyecto" abre el cajón ---------- */
  useEffect(() => {
    // Solo con cursor fino: en táctil no existe el hover y el botón navega.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    function alEntrar(ev: MouseEvent) {
      const destino = ev.target;
      if (!(destino instanceof Element) || !destino.closest(".cart-open") || esperaHover.current) return;
      // Ni recién navegado, ni en la propia página del proyecto.
      if (Date.now() < silencioHover.current || window.location.pathname === "/mi-proyecto") return;
      esperaHover.current = window.setTimeout(() => {
        esperaHover.current = 0;
        setAbierto(true);
      }, HOVER_ABRIR_MS);
    }
    function alSalir(ev: MouseEvent) {
      const destino = ev.target;
      if (!(destino instanceof Element) || !destino.closest(".cart-open")) return;
      const hacia = ev.relatedTarget;
      if (hacia instanceof Element && hacia.closest(".cart-open")) return;
      window.clearTimeout(esperaHover.current);
      esperaHover.current = 0;
    }
    document.addEventListener("mouseover", alEntrar);
    document.addEventListener("mouseout", alSalir);
    return () => {
      window.clearTimeout(esperaHover.current);
      document.removeEventListener("mouseover", alEntrar);
      document.removeEventListener("mouseout", alSalir);
    };
  }, []);

  /* ---------- Esc cierra ---------- */
  useEffect(() => {
    if (!abierto && !cotizando) return;
    function alTeclear(ev: KeyboardEvent) {
      if (ev.key !== "Escape") return;
      setAbierto(false);
      setCotizando(false);
    }
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto, cotizando]);

  /* ---------- Bloqueo del scroll ---------- */
  useEffect(() => {
    document.documentElement.classList.toggle("wl-lock", abierto || cotizando);
    return () => document.documentElement.classList.remove("wl-lock");
  }, [abierto, cotizando]);

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

  const valor = useMemo<CarritoContexto>(
    () => ({
      carrito: carritoVista,
      aviso,
      ocupado: pendiente,
      cargado,
      abrir: () => setAbierto(true),
      cerrar: () => setAbierto(false),
      abrirCotizacion: () => {
        setAbierto(false);
        setCotizando(true);
      },
      cambiar,
      quitar,
    }),
    [carritoVista, aviso, pendiente, cargado, cambiar, quitar],
  );

  return (
    <Contexto.Provider value={valor}>
      {children}
      {montado
        ? createPortal(
            <>
              <CarritoDrawer
                carrito={carritoVista}
                aviso={aviso}
                abierto={abierto}
                ocupado={pendiente}
                onCerrar={() => setAbierto(false)}
                onCantidad={cambiar}
                onQuitar={quitar}
              />
              {cotizando ? (
                <PreCotizacionModal carrito={carritoVista} onCerrar={() => setCotizando(false)} />
              ) : null}
            </>,
            document.body,
          )
        : null}
    </Contexto.Provider>
  );
}
