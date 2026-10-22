"use client";

// AnimarAlDesplazar — en pantallas táctiles (sin hover) las ilustraciones de
// Guías se animan al desplazarse (Carla, 2026-10-21): la tarjeta más cercana al
// centro de la pantalla pasa a su estado encendido/abierto (`.is-abierto`, la
// misma clase que usa la vista derecha del modal) y, al pasar a la siguiente,
// la anterior se apaga. En escritorio no hace nada: ahí manda el hover.

import { useEffect } from "react";

/** Una tarjeta debe verse al menos así de alta (fracción de su alto) para animarse. */
const VISIBLE = 0.55;
/** Revisión del desplazamiento como máximo cada tantos ms (temporizador, no
 *  requestAnimationFrame: así también corre en vistas previas en segundo plano). */
const PAUSA = 90;

export default function AnimarAlDesplazar() {
  useEffect(() => {
    const tactil = window.matchMedia("(hover: none)");
    let espera: ReturnType<typeof setTimeout> | undefined;
    let activa: Element | null = null;

    const elegir = () => {
      espera = undefined;
      if (!tactil.matches) return;
      const centro = window.innerHeight * 0.45;
      let mejor: Element | null = null;
      let distancia = Infinity;
      for (const card of document.querySelectorAll(".tfk-card--ilus")) {
        const r = card.querySelector(".tfk-ilus")?.getBoundingClientRect() ?? card.getBoundingClientRect();
        const visible = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
        if (visible < r.height * VISIBLE) continue;
        const d = Math.abs((r.top + r.bottom) / 2 - centro);
        if (d < distancia) {
          distancia = d;
          mejor = card;
        }
      }
      if (mejor === activa) return;
      activa?.classList.remove("is-abierto");
      mejor?.classList.add("is-abierto");
      activa = mejor;
    };
    const pedir = () => {
      if (!espera) espera = setTimeout(elegir, PAUSA);
    };
    // Al volver a escritorio (o rotar a un modo con hover) se apaga todo.
    const cambio = () => {
      if (tactil.matches) return pedir();
      activa?.classList.remove("is-abierto");
      activa = null;
    };

    pedir();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    tactil.addEventListener("change", cambio);
    return () => {
      clearTimeout(espera);
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
      tactil.removeEventListener("change", cambio);
      activa?.classList.remove("is-abierto");
    };
  }, []);
  return null;
}
