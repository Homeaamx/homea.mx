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
function guardarScroll() {
  try { sessionStorage.setItem(claveScroll(), String(Math.round(window.scrollY))); } catch {}
}
function restaurarScroll(): boolean {
  let y: number | null = null;
  try {
    const v = sessionStorage.getItem(claveScroll());
    y = v === null ? null : Number(v);
  } catch {}
  if (y === null || !Number.isFinite(y)) return false;
  const ir = () => window.scrollTo({ top: y!, behavior: "instant" });
  ir();
  // Segundo intento por si algo terminó de crecer tras el primer pintado.
  window.setTimeout(ir, 80);
  return true;
}

export default function PreviewRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useRef(false);
  const porHistorial = useRef(false);

  // Restauración propia: el navegador restauraba antes de que Next pintara la
  // página de regreso (y con scroll-behavior: smooth, animado).
  useEffect(() => {
    window.history.scrollRestoration = "manual";
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav && (nav.type === "reload" || nav.type === "back_forward")) restaurarScroll();
    let t = 0;
    const onPop = () => {
      porHistorial.current = true;
      window.clearTimeout(t);
      t = window.setTimeout(() => { porHistorial.current = false; }, 1500);
    };
    // También se guarda al desplazarse: cubre navegaciones que no pasan por el
    // clic de aquí (buscador, carrito, <Link> de React). La llave se toma en el
    // momento del scroll, no al escribir, para no mezclar páginas.
    let pendiente: [string, number] | null = null;
    let tg = 0;
    const onScroll = () => {
      pendiente = [claveScroll(), Math.round(window.scrollY)];
      if (tg) return;
      tg = window.setTimeout(() => {
        tg = 0;
        if (!pendiente) return;
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

  useLayoutEffect(() => {
    if (!porHistorial.current) return;
    porHistorial.current = false;
    restaurarScroll();
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
      raf = requestAnimationFrame(() => window.__homeaInitPage?.());
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
