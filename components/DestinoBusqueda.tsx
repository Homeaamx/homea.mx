"use client";

// DestinoBusqueda — lleva al usuario a la tarjeta que encontró el buscador de
// Guías (GuiaSearch, Carla 2026-10-20). Lee el hash al llegar a la página:
//   #ficha-<slug> / #tipo-<slug>  → centra la tarjeta y la resalta un momento
//   #detalle-<slug>               → además abre su ficha extendida (FichaModal)
// `irADestino` también se usa desde el buscador cuando el destino está en la
// misma página (tarjetas de la portada).

import { useEffect } from "react";

const RESALTE_MS = 2400;

export function irADestino(hash: string): boolean {
  const m = /^#(ficha|detalle|tipo)-(.+)$/.exec(hash);
  if (!m) return false;
  const id = m[1] === "tipo" ? `tipo-${m[2]}` : `ficha-${m[2]}`;
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  el.classList.add("is-destino");
  window.setTimeout(() => el.classList.remove("is-destino"), RESALTE_MS);
  // FichaModal escucha el clic de la tarjeta y abre la descripción extendida.
  if (m[1] === "detalle") window.setTimeout(() => el.click(), 650);
  return true;
}

export default function DestinoBusqueda() {
  useEffect(() => {
    const ir = () => {
      // Espera a que la página termine de pintar (ilustraciones y fotos).
      window.setTimeout(() => irADestino(window.location.hash), 200);
    };
    ir();
    window.addEventListener("hashchange", ir);
    return () => window.removeEventListener("hashchange", ir);
  }, []);
  return null;
}
