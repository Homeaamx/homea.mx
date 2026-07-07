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
import { useEffect, useRef } from "react";

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

export default function PreviewRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useRef(false);

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

  // Auto-recuperación: si el contenido de <main> se re-monta (Fast Refresh en dev,
  // o cualquier reemplazo del subárbol), los observers de reveal de v2.js quedan
  // sobre nodos viejos y las secciones nunca aparecen al hacer scroll. Re-ligar.
  // Sólo escucha el reemplazo de los hijos DIRECTOS de <main> (no interacciones
  // internas), y bindPage es idempotente (aborta el contexto previo). Inerte en prod.
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    let raf = 0;
    const obs = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => window.__homeaInitPage?.());
    });
    obs.observe(main, { childList: true });
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
