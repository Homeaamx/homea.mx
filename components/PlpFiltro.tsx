"use client";

// PlpFiltro — estado del filtro ?f= del PLP de tipo, resuelto EN EL CLIENTE.
//
// La página se sirve pre-generada (SSG): el servidor no lee searchParams — si lo
// hiciera, Next la volvería dinámica y perdería el HTML estático (TTFB y SEO,
// regla de oro del proyecto). Este componente aplica el estado visual del filtro
// después de hidratar, con el mismo patrón de JS delegado que tipos.js usa en el
// riel de subcat.1: los tiles son <a> planas, el clic hace pushState y aquí se
// sincronizan las clases. El pushState nativo NO despierta a useSearchParams
// (verificado en 14.2.5). Al APLICAR un tipo la página baja sola al catálogo
// filtrado; al QUITARLO se queda donde está (Carla, 2026-10-09).
//
// Sin JS los enlaces navegan normal (página estática con el mosaico completo):
// el filtro visual es mejora progresiva, nunca contenido.

import { useEffect } from "react";

declare global {
  interface Window {
    /** Scroll lento compartido (public/tipos.js): mismo recorrido que el riel de subcat.1. */
    __homeaScrollA?: (el: Element, aire?: number) => void;
  }
}

interface Props {
  /** Ruta del PLP (los tiles enlazan a `<base>?f=<slug>`). */
  base: string;
  /** slug → nombre visible, para la etiqueta "tipo: X" del toolbar. */
  tipos: Record<string, string>;
}

export default function PlpFiltro({ base, tipos }: Props) {
  useEffect(() => {
    const leerF = () =>
      new URLSearchParams(window.location.search).get("f");

    const sync = (f: string | null) => {
      // Tiles del mosaico: marcado + href de toggle (clic en el activo lo quita).
      document
        .querySelectorAll<HTMLAnchorElement>(".tpg-card[data-f]")
        .forEach((a) => {
          const es = a.dataset.f === f;
          a.classList.toggle("is-active", es);
          if (es) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
          a.setAttribute("href", es ? base : `${base}?f=${a.dataset.f}`);
          const quitar = a.querySelector(".tpg-quitar");
          if (quitar) {
            quitar.classList.toggle("es-hueco", !es);
            if (es) quitar.removeAttribute("aria-hidden");
            else quitar.setAttribute("aria-hidden", "true");
          }
        });
      // Checkbox correspondiente del aside de filtros.
      document
        .querySelectorAll<HTMLLabelElement>(".filters label[data-tipo]")
        .forEach((l) => {
          const input = l.querySelector<HTMLInputElement>(
            'input[type="checkbox"]',
          );
          if (input) input.checked = l.dataset.tipo === f;
        });
      // Etiqueta "· tipo: X" del toolbar.
      // Con catálogo vivo los chips de catalogo.js ya dicen el tipo activo.
      const label = document.getElementById("plp-tipo-activo");
      if (label && !document.querySelector("[data-cat-card]"))
        label.textContent = f && tipos[f] ? ` · tipo: ${tipos[f]}` : "";
      // Catálogo vivo: las casillas se marcaron a mano (sin "change"), así que se
      // avisa a public/catalogo.js para que vuelva a filtrar las tarjetas.
      document.dispatchEvent(new Event("catalogo:aplicar"));
    };

    // Al aplicar un tipo, el catálogo filtrado queda fuera de pantalla: la
    // página baja sola, lenta (no un salto) para que se vea que la tarjeta quedó
    // marcada arriba. Mismo recorrido que el riel de subcat.1 (tipos.js, nav
    // sticky descontado); si tipos.js aún no cargó, el scroll nativo sirve de red.
    let t: ReturnType<typeof setTimeout> | undefined;
    const bajarAlCatalogo = () => {
      const el = document.getElementById("catalogo");
      if (!el) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      clearTimeout(t);
      // Respiro breve para alcanzar a ver la tarjeta marcada antes de bajar.
      t = setTimeout(() => {
        if (window.__homeaScrollA && !reduce) window.__homeaScrollA(el, 8);
        else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }, 260);
    };

    const onClick = (e: MouseEvent) => {
      // Respetar aperturas en pestaña nueva / clics modificados.
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const card = (e.target as Element).closest<HTMLAnchorElement>(
        ".tpg-card[data-f]",
      );
      if (!card) return;
      e.preventDefault();
      const f = card.dataset.f === leerF() ? null : card.dataset.f!;
      window.history.pushState(null, "", f ? `${base}?f=${f}` : base);
      sync(f);
      // Quitar el filtro no mueve la página: el usuario se queda donde está.
      if (f) bajarAlCatalogo();
    };

    const onPop = () => sync(leerF());

    sync(leerF());
    // Fase de captura: PreviewRouter también escucha clics en <a> internas (en
    // burbuja) y, si llega primero, hace router.push → la página se vuelve a
    // renderizar como si recargara. Aquí se gana el turno y se previene el
    // default, que es la señal que PreviewRouter respeta para dejar pasar.
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, [base, tipos]);

  return null;
}
