"use client";

// EtiquetasSinChoque — red de seguridad para las etiquetas de las ilustraciones
// en escena (IlustracionTipo / IlustracionCoccion, Carla 2026-10-20). Cada
// etiqueta sale de un punto con su línea y el texto se parte según el espacio
// que le queda hasta el borde, así que en tarjetas angostas crece hacia abajo y
// puede chocar con la de al lado. Aquí se mide cada tarjeta y, si dos textos se
// enciman (o uno se sale de la imagen), se separan en vertical con `--dy`
// sin despegarlos de su línea. También esquivan los botones fijos de la
// tarjeta (lupa y "Panelar"). Corre al cargar, al cambiar de tamaño y cuando
// terminan de cargar las fuentes.

import { useEffect } from "react";

const HOLGURA = 4; // px entre dos textos
const BORDE = 2; // px al borde de la imagen

function acomodar(cont: HTMLElement) {
  const tx = [...cont.querySelectorAll<HTMLElement>(".ilus-tag-tx")];
  if (tx.length === 0) return;
  tx.forEach((t) => t.style.setProperty("--dy", "0px"));
  const caja = cont.getBoundingClientRect();
  // La tarjeta puede estar escalada (zoom del hover): todo se mide en px reales
  // y se convierte a px de maqueta.
  const escala = cont.offsetHeight ? caja.height / cont.offsetHeight : 1;
  const r = tx.map((t) => {
    const b = t.getBoundingClientRect();
    return { t, top: (b.top - caja.top) / escala, h: b.height / escala, left: b.left / escala, right: b.right / escala, dy: 0 };
  });
  const alto = cont.offsetHeight;
  // Botones fijos sobre la imagen: la lupa (arriba a la derecha) y "Panelar".
  const fijos = [...(cont.closest(".tfk-ilus")?.querySelectorAll<HTMLElement>(".tfk-zoom, .tfk-panelar") ?? [])].map((el) => {
    // Tamaño completo aunque esté reducido (la lupa entra con scale .8 al hover).
    const b = el.getBoundingClientRect();
    const cx = (b.left + b.right) / 2;
    const cy = (b.top + b.bottom) / 2;
    const w = el.offsetWidth / 2;
    const h = el.offsetHeight / 2;
    return { top: (cy - h - caja.top) / escala, bottom: (cy + h - caja.top) / escala, left: (cx - w) / escala, right: (cx + w) / escala };
  });
  const tope = (k: (typeof r)[number]) => Math.max(0, k.h / 2 - 6); // la línea sigue tocando el texto
  for (let paso = 0; paso < 8; paso++) {
    let movio = false;
    // Dentro de la imagen
    for (const k of r) {
      const arriba = BORDE - (k.top + k.dy);
      const abajo = k.top + k.dy + k.h - (alto - BORDE);
      if (arriba > 0) k.dy = Math.min(k.dy + arriba, tope(k));
      else if (abajo > 0) k.dy = Math.max(k.dy - abajo, -tope(k));
    }
    // Lejos de los botones fijos: abajo si el botón queda arriba, si no arriba.
    for (const k of r) {
      for (const f of fijos) {
        if (Math.min(k.right, f.right) - Math.max(k.left, f.left) <= 1) continue;
        const top = k.top + k.dy;
        if (top >= f.bottom + HOLGURA || top + k.h + HOLGURA <= f.top) continue;
        const abajo = f.top + (f.bottom - f.top) / 2 < top + k.h / 2;
        const dy = abajo ? Math.min(k.dy + (f.bottom + HOLGURA - top), tope(k)) : Math.max(k.dy - (top + k.h + HOLGURA - f.top), -tope(k));
        if (dy !== k.dy) movio = true;
        k.dy = dy;
      }
    }
    // Entre textos que se enciman en horizontal
    const orden = [...r].sort((a, b) => a.top + a.dy + a.h / 2 - (b.top + b.dy + b.h / 2));
    for (let i = 0; i < orden.length; i++) {
      for (let j = i + 1; j < orden.length; j++) {
        const a = orden[i];
        const b = orden[j];
        if (Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 1) continue;
        const falta = a.top + a.dy + a.h + HOLGURA - (b.top + b.dy);
        if (falta <= 0) continue;
        const ya = Math.max(-tope(a), a.dy - falta / 2);
        const yb = Math.min(tope(b), b.dy + (falta - (a.dy - ya)));
        if (ya !== a.dy || yb !== b.dy) movio = true;
        a.dy = ya;
        b.dy = yb;
      }
    }
    if (!movio) break;
  }
  r.forEach((k) => k.dy && k.t.style.setProperty("--dy", `${k.dy.toFixed(1)}px`));
}

export default function EtiquetasSinChoque() {
  useEffect(() => {
    const conts = [...document.querySelectorAll<HTMLElement>(".tfk-card .ilus-tags")];
    if (conts.length === 0) return;
    const todo = () => conts.forEach(acomodar);
    const ro = new ResizeObserver((entradas) => entradas.forEach((e) => acomodar(e.target as HTMLElement)));
    conts.forEach((c) => ro.observe(c));
    document.fonts?.ready.then(todo);
    todo();
    return () => ro.disconnect();
  }, []);
  return null;
}
