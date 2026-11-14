"use client";

// PreviewRouter — navegación tipo SPA para el sitio (sin recargar la página).
//
// El markup proviene del preview estático (enlaces <a> planos inyectados vía
// dangerouslySetInnerHTML), así que por defecto cada clic haría una recarga
// completa. Este componente:
//   1. Intercepta los clics en enlaces internos ("/...") y navega con el router
//      de Next (transición cliente, sin flash ni recompilación visible en dev).
//   2. Prefetch al pasar el cursor para que la transición sea instantánea.
//   3. Tras cada navegación, re-inicializa las interacciones del preview
//      (window.__homeaInitPage de v2.js) porque el contenido de <main> se
//      reemplaza y sus listeners/animaciones deben volver a ligarse.

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

declare global {
  interface Window {
    __homeaInitPage?: () => void;
  }
}

/** ¿El enlace es interno y navegable con el router (no externo, hash, descarga…)? */
function internalHref(a: HTMLAnchorElement): string | null {
  const href = a.getAttribute("href");
  if (!href) return null;
  // Externos, esquemas especiales (WhatsApp, mailto, tel), o anclas de la misma página.
  if (/^(https?:|mailto:|tel:|#)/i.test(href)) return null;
  if (!href.startsWith("/")) return null;
  // Respeta target y descargas.
  const target = a.getAttribute("target");
  if (target && target !== "_self") return null;
  if (a.hasAttribute("download")) return null;
  return href;
}

// Posición de scroll por página (pathname + query). Al volver con "atrás" o al
// recargar, la página aparece donde la dejó el usuario, al instante y sin
// animación (Carla, 2026-10-08: nada de bajar despacio hasta el producto).
const CLAVE_SCROLL = "homea:scroll:";
function claveScroll(): string {
  return CLAVE_SCROLL + window.location.pathname + window.location.search;
}
function rutaActual(): string {
  return window.location.pathname + window.location.search;
}

// Mientras se restaura (o entre el "atrás" y el pintado de la página de
// regreso) no se guarda nada: el scroll de ese momento es de la página vieja o
// uno recortado porque la nueva aún no crece, y pisaría la posición buena.
let restaurando = false;
let soltarFijado: (() => void) | null = null;

function guardarScroll() {
  if (restaurando) return;
  try { sessionStorage.setItem(claveScroll(), String(Math.round(window.scrollY))); } catch {}
}

/**
 * Lleva la página a `y` y la SOSTIENE ahí mientras el contenido termina de
 * llegar (filtros y página del catálogo que devuelve catalogo.js, tarjetas de
 * /api/tarjetas, imágenes): un solo scrollTo se quedaba corto —la página aún
 * medía menos y el navegador lo recortaba— o se lo llevaba un crecimiento
 * posterior. Se suelta cuando la altura lleva un rato quieta con la vista en
 * su lugar, a los 4 s como tope, o en cuanto el usuario toca, rueda o teclea.
 */
function fijarScroll(y: number) {
  soltarFijado?.();
  restaurando = true;
  const html = document.documentElement;
  const ir = () => {
    if (Math.abs(window.scrollY - y) > 0.5) window.scrollTo({ top: y, behavior: "instant" });
  };
  const t0 = performance.now();
  let alto = html.scrollHeight;
  let cambio = t0;
  let tm = 0;
  // ResizeObserver corrige en el mismo cuadro en que la página crece (antes de
  // pintarse: sin parpadeo); el temporizador es la red cuando no hay cuadros
  // (pestaña en segundo plano) y el que decide cuándo soltar. Sin rAF: en una
  // pestaña oculta no corre y la posición se quedaba "agarrada" sin guardar.
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => ir()) : null;
  const gestos = ["wheel", "touchstart", "keydown", "mousedown"] as const;
  const soltar = () => {
    window.clearTimeout(tm);
    ro?.disconnect();
    gestos.forEach((g) => window.removeEventListener(g, soltar, true));
    restaurando = false;
    soltarFijado = null;
  };
  const paso = () => {
    const ahora = performance.now();
    if (html.scrollHeight !== alto) { alto = html.scrollHeight; cambio = ahora; }
    ir();
    const enSuLugar = Math.abs(window.scrollY - y) <= 1;
    if ((enSuLugar && ahora - cambio > 500 && ahora - t0 > 700) || ahora - t0 > 4000) { soltar(); return; }
    tm = window.setTimeout(paso, 16);
  };
  gestos.forEach((g) => window.addEventListener(g, soltar, { capture: true, passive: true }));
  soltarFijado = soltar;
  ro?.observe(document.body);
  ir();
  tm = window.setTimeout(paso, 16);
}

function restaurarScroll(): boolean {
  let y: number | null = null;
  try {
    const v = sessionStorage.getItem(claveScroll());
    y = v === null ? null : Number(v);
  } catch {}
  if (y === null || !Number.isFinite(y)) return false;
  fijarScroll(y);
  return true;
}

/**
 * URL (ruta + query) de la entrada anterior del historial, si se sabe. Con la
 * Navigation API se lee directo; si no, se recuerda la última navegación hecha
 * desde aquí (se olvida al ir atrás/adelante, porque ya no se sabe cuál es).
 */
let anteriorPropia: string | null = null;
function entradaAnterior(): string | null {
  const nav = (window as unknown as {
    navigation?: { currentEntry?: { index: number } | null; entries?: () => { url: string | null }[] };
  }).navigation;
  try {
    const i = nav?.currentEntry?.index;
    if (nav?.entries && typeof i === "number" && i > 0) {
      const u = nav.entries()[i - 1]?.url;
      if (!u) return null;
      const url = new URL(u);
      return url.origin === window.location.origin ? url.pathname + url.search : null;
    }
    if (nav?.entries) return null;
  } catch {}
  return anteriorPropia;
}

/**
 * ¿El enlace lleva a la página de la que se vino? (migas de la ficha, "Ver
 * marca"…). Entonces se regresa con el historial y no con una navegación nueva:
 * la página vuelve exactamente donde estaba, igual que con el botón atrás. Las
 * migas no traen el ?tipo= que tipos.js deja en la URL del catálogo; ese tipo ya
 * vive en los filtros guardados, así que la misma ruta sin query cuenta.
 */
function esRegreso(href: string): boolean {
  const ant = entradaAnterior();
  if (!ant) return false;
  let destino: URL;
  try { destino = new URL(href, window.location.href); } catch { return false; }
  if (destino.hash) return false;
  const antUrl = new URL(ant, window.location.origin);
  if (destino.pathname !== antUrl.pathname) return false;
  return destino.search === "" || destino.search === antUrl.search;
}

/**
 * Ejecuta el JS inline de la página del preview (MarketingPage lo deja como
 * <script type="text/x-homea-page">): un <script> real por cada placeholder que
 * aún no corrió. Idempotente por nodo: tras navegar, el <main> nuevo trae
 * placeholders nuevos y se ejecutan; los viejos ya se fueron con su DOM.
 */
function ejecutarScriptsDePagina() {
  document
    .querySelectorAll<HTMLScriptElement>('script[type="text/x-homea-page"]:not([data-ran])')
    .forEach((ph) => {
      ph.setAttribute("data-ran", "1");
      const s = document.createElement("script");
      s.textContent = ph.textContent;
      ph.parentNode?.insertBefore(s, ph.nextSibling);
    });
}

export default function PreviewRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useRef(false);
  // URL a la que llevó el último atrás/adelante, hasta que su página se pinte.
  const porHistorial = useRef<string | null>(null);
  // Pathname de la página que está pintada (el de location cambia antes).
  const rutaPintada = useRef<string | null>(null);

  // Restauración propia: el navegador restauraba antes de que Next pintara la
  // página de regreso (y con scroll-behavior: smooth, animado).
  useEffect(() => {
    window.history.scrollRestoration = "manual";
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav && (nav.type === "reload" || nav.type === "back_forward")) restaurarScroll();
    let t = 0;
    const onPop = () => {
      anteriorPropia = null;
      soltarFijado?.();
      const ruta = rutaActual();
      porHistorial.current = ruta;
      // Desde aquí hasta que se pinte la página de regreso, el scroll que se
      // vea es el de la página que se va: no se guarda.
      restaurando = true;
      window.clearTimeout(t);
      // Misma ruta y otra query (p. ej. ?tipo=): no hay cambio de pathname que
      // dispare el layout effect; se restaura tras el re-render.
      if (window.location.pathname === rutaPintada.current) {
        window.setTimeout(() => {
          if (porHistorial.current !== ruta) return;
          porHistorial.current = null;
          if (!restaurarScroll()) restaurando = false;
        }, 80);
      }
      // Red de seguridad: si la página nunca llega, se vuelve a guardar.
      t = window.setTimeout(() => {
        if (porHistorial.current === ruta) { porHistorial.current = null; restaurando = false; }
      }, 15000);
    };
    // También se guarda al desplazarse: cubre navegaciones que no pasan por el
    // clic de aquí (buscador, carrito, <Link> de React). La llave se toma en el
    // momento del scroll, no al escribir, para no mezclar páginas.
    let pendiente: [string, number] | null = null;
    let tg = 0;
    const onScroll = () => {
      if (restaurando) { pendiente = null; return; }
      pendiente = [claveScroll(), Math.round(window.scrollY)];
      if (tg) return;
      tg = window.setTimeout(() => {
        tg = 0;
        if (!pendiente || restaurando) return;
        try { sessionStorage.setItem(pendiente[0], String(pendiente[1])); } catch {}
      }, 120);
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("pagehide", guardarScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("pagehide", guardarScroll);
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(t);
      window.clearTimeout(tg);
    };
  }, []);

  // La página de regreso ya está en el DOM (antes del primer pintado): se
  // coloca en su lugar y se sostiene ahí mientras termina de crecer.
  useLayoutEffect(() => {
    rutaPintada.current = pathname;
    if (!porHistorial.current) return;
    porHistorial.current = null;
    if (!restaurarScroll()) {
      // Entrada sin posición guardada: se dejó sin desplazarse, arriba.
      restaurando = false;
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [pathname]);

  // Interceptar clics y prefetch en hover sobre enlaces internos.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Deja pasar: ya prevenido, botón no-izquierdo, o con modificador (abrir pestaña).
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const el = e.target as Element | null;
      const a = el?.closest?.("a") as HTMLAnchorElement | null;
      if (!a) return;
      const href = internalHref(a);
      if (!href) return;
      e.preventDefault();
      // Cierre garantizado del mega-menú al navegar: no depende de los listeners
      // de v2.js (pueden morir si React reemplaza el nav inyectado).
      document.querySelectorAll(".has-mega.is-open").forEach((w) => w.classList.remove("is-open"));
      guardarScroll();
      // Enlace dentro de la página (migas, marca de la ficha…) hacia la página
      // de la que se vino: se regresa con el historial, a la misma altura. Los
      // del menú, cajón y pie (fuera de <main>) siguen entrando de cero.
      if (a.closest("main") && esRegreso(href)) {
        window.history.back();
        return;
      }
      anteriorPropia = rutaActual();
      router.push(href);
    };

    const onOver = (e: MouseEvent) => {
      const el = e.target as Element | null;
      const a = el?.closest?.("a") as HTMLAnchorElement | null;
      if (!a) return;
      const href = internalHref(a);
      if (href) router.prefetch(href);
    };

    document.addEventListener("click", onClick);
    document.addEventListener("mouseover", onOver);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("mouseover", onOver);
    };
  }, [router]);

  // Re-inicializar interacciones del preview tras cada navegación cliente.
  // En el montaje inicial NO se re-ejecuta: v2.js ya corrió bindPage al cargar.
  useEffect(() => {
    // El JS propio de la página (spotlights del hero, sliders…) corre en cada
    // montaje, incluido el primero.
    ejecutarScriptsDePagina();
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    window.__homeaInitPage?.();
  }, [pathname]);

  // Auto-recuperación: si el contenido de <main> o el cromo del nav se re-montan
  // (Fast Refresh en dev, o React reemplazando el HTML inyectado del layout al
  // navegar), los listeners de v2.js quedan sobre nodos viejos: los reveals no
  // aparecen y el hover del mega-menú muere. Re-ligar. Sólo escucha el reemplazo
  // de los hijos DIRECTOS (no interacciones internas); __homeaInitPage es
  // idempotente (guard por nodo en chrome, abort del contexto previo en página).
  useEffect(() => {
    const main = document.querySelector("main");
    const chrome = document.querySelector(".site-chrome");
    if (!main && !chrome) return;
    let raf = 0;
    const obs = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        ejecutarScriptsDePagina();
        window.__homeaInitPage?.();
      });
    });
    if (main) obs.observe(main, { childList: true });
    if (chrome) obs.observe(chrome, { childList: true });
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
