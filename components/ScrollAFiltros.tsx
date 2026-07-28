"use client";

// ScrollAFiltros — al elegir un tipo del mosaico (subcat.3), la página baja sola
// al catálogo ya filtrado. Sin esto el usuario hace clic y "no pasa nada"
// visible: el filtro se aplica más abajo, fuera de pantalla.
//
// El desplazamiento es suave y lento a propósito (no un salto): el usuario tiene
// que ver que el mosaico se quedó marcado arriba y que el catálogo cambió abajo.
// Con `prefers-reduced-motion` salta sin animación.

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ScrollAFiltros({ destino }: { destino: string }) {
  const f = useSearchParams().get("f");

  useEffect(() => {
    if (!f) return;
    // Cada clic en el mosaico navega a ?f=… y REMONTA este componente, así que
    // no sirve una guarda de "primer montaje": se desplaza siempre que llegue
    // con filtro, venga de un clic o de un enlace compartido.
    const el = document.getElementById(destino);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Pequeño respiro para que el usuario alcance a ver la tarjeta marcada
    // antes de que la página baje.
    const t = setTimeout(() => {
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }, 260);
    return () => clearTimeout(t);
  }, [f, destino]);

  return null;
}
