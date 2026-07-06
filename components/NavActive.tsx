"use client";

// NavActive — marca el enlace de la nav (HTML inyectado) según la ruta actual.
// El header es markup estático del preview; este componente sólo alterna .is-active.
//
// Dos enlaces pueden compartir ruta (p. ej. Productos y Ofertas → /productos), así
// que la ruta por sí sola no basta para decidir cuál subrayar. Regla:
//   • Si el usuario pulsó un enlace de la nav, gana ESE enlace (aunque comparta
//     ruta con otro) — así "Ofertas" no se enciende al pulsar "Productos".
//   • En carga directa / breadcrumb / recarga, se enciende el PRIMER enlace que
//     casa con la ruta (nunca dos a la vez).

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const NAV_SELECTOR = ".site-nav .nav-links a, .site-nav .nav-right a";

function navLinks(): HTMLAnchorElement[] {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>(NAV_SELECTOR));
}

/** Enlace interno de sección (no ancla, ni externo, ni la home "/"). */
function sectionHref(a: HTMLAnchorElement): string | null {
  const href = a.getAttribute("href") || "";
  if (!href.startsWith("/") || href === "/") return null;
  return href;
}

function setActive(active: HTMLAnchorElement | null) {
  navLinks().forEach((a) => a.classList.toggle("is-active", a === active));
}

export default function NavActive() {
  const pathname = usePathname() || "/";
  const clickedRef = useRef<HTMLAnchorElement | null>(null);

  // Recordar (y subrayar de inmediato) el enlace pulsado. En captura, para correr
  // antes de que el router navegue. La marca inmediata cubre además el clic a la
  // MISMA ruta (donde el efecto de pathname no vuelve a ejecutarse).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.(NAV_SELECTOR) as HTMLAnchorElement | null;
      if (!a || !sectionHref(a)) return;
      clickedRef.current = a;
      setActive(a);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    const links = navLinks();
    const matches = (a: HTMLAnchorElement) => {
      const href = sectionHref(a);
      if (!href) return false;
      const base = href.replace(/\/$/, "");
      return base !== "" && pathname.startsWith(base);
    };

    const clicked = clickedRef.current;
    if (clicked && links.includes(clicked) && matches(clicked)) {
      // Navegación desde la nav: gana el enlace pulsado, aunque comparta ruta.
      setActive(clicked);
    } else {
      // Carga directa / breadcrumb: primer enlace que casa (uno solo).
      clickedRef.current = null;
      setActive(links.find(matches) || null);
    }
  }, [pathname]);

  return null;
}
