"use client";

// PlpFiltro — estado del filtro ?f= del PLP de tipo, resuelto EN EL CLIENTE.
//
// La página se sirve pre-generada (SSG): el servidor no lee searchParams — si lo
// hiciera, Next la volvería dinámica y perdería el HTML estático (TTFB y SEO,
// regla de oro del proyecto). Este componente aplica el estado visual del filtro
// después de hidratar, con el mismo patrón de JS delegado que tipos.js usa en el
// riel de subcat.1: los tiles son <a> planas, el clic hace pushState y aquí se
// sincronizan las clases. El pushState nativo NO despierta a useSearchParams
// (verificado en 14.2.5), así que el scroll al catálogo tras el clic también se
// orquesta aquí; ScrollAFiltros queda solo para la carga directa con ?f=.
//
// Sin JS los enlaces navegan normal (página estática con el mosaico completo):
// el filtro visual es mejora progresiva, nunca contenido.

import { useEffect } from "react";

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
      const label = document.getElementById("plp-tipo-activo");
      if (label)
        label.textContent = f && tipos[f] ? ` · tipo: ${tipos[f]}` : "";
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
      // Al aplicar un filtro, bajar al catálogo (mismo respiro y recorrido que
      // ScrollAFiltros: el usuario alcanza a ver la tarjeta marcada primero).
      if (f) {
        const el = document.getElementById("catalogo");
        if (!el) return;
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        setTimeout(() => {
          if (window.__homeaScrollA && !reduce) window.__homeaScrollA(el, 8);
          else
            el.scrollIntoView({
              behavior: reduce ? "auto" : "smooth",
              block: "start",
            });
        }, 260);
      }
    };

    const onPop = () => sync(leerF());

    sync(leerF());
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPop);
    };
  }, [base, tipos]);

  return null;
}
