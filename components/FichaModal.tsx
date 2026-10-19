"use client";

// FichaModal — al hacer clic en una ficha de tipo (FilterShowcase) se abre una
// tarjeta sobre el fondo oscurecido, como el overlay de "Aprende sobre campanas"
// pero más compacta (Carla, 2026-10-19): el mismo diagrama con su hover, la
// explicación técnica, los puntos clave y el botón al catálogo con el filtro de
// esa ficha ya aplicado.
//
// Tipos con ilustración en escena (IlustracionTipo, prueba French Door): el modal
// pone juntas las dos vistas — cerrado | abierto — recortadas al aparato; la
// abierta se abre sola al aparecer. Sin botón de WhatsApp (Carla, 2026-10-19).
//
// Los datos viajan en los data-* de cada tarjeta (<a class="tfk-card" data-ficha>)
// y el diagrama se clona de la propia tarjeta, así el SVG no se duplica en el
// bundle. Sin JS la tarjeta es un enlace normal al catálogo filtrado.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Datos {
  nombre: string;
  grupo: string;
  desc: string;
  detalle: string;
  puntos: string[];
  href: string;
  svg: string;
  /** Ilustración en escena (outerHTML de .ilus) y su proporción de recorte. */
  ilus: string;
  recorte: string;
  /** Vistas apiladas (Parejas): la escena es más ancha que alta. */
  apilar: boolean;
  /** Tipo con botón "Panelar" (Columna) y su estado al abrir. */
  panelable: boolean;
  panel: boolean;
}

export default function FichaModal({ contexto }: { contexto: string }) {
  const [ficha, setFicha] = useState<Datos | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [panel, setPanel] = useState(false);
  const xRef = useRef<HTMLButtonElement>(null);
  const origen = useRef<HTMLElement | null>(null);

  const cerrar = useCallback(() => {
    setFicha(null);
    // La tarjeta de origen vuelve a animar su hover (ver "tfk-quieta" abajo).
    const o = origen.current;
    window.setTimeout(() => o?.classList.remove("tfk-quieta"), 60);
    // El foco regresa a la tarjeta que abrió el modal.
    origen.current?.focus();
  }, []);

  useEffect(() => {
    // Botón "Panelar" dentro de la tarjeta (es un <span>: la tarjeta es un <a>).
    const alternarPanel = (b: HTMLElement) => {
      const caja = b.closest(".tfk-ilus");
      const on = !caja?.classList.contains("is-panel");
      caja?.classList.toggle("is-panel", on);
      b.setAttribute("aria-pressed", String(on));
      b.textContent = on ? "Ver en acero" : "Panelar";
    };
    const onKey = (e: KeyboardEvent) => {
      const b = (e.target as Element).closest?.<HTMLElement>(".tfk-card [data-panelar]");
      if (b && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        alternarPanel(b);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const pb = (e.target as Element).closest<HTMLElement>(".tfk-card [data-panelar]");
      if (pb) {
        e.preventDefault();
        alternarPanel(pb);
        return;
      }
      const card = (e.target as Element).closest<HTMLAnchorElement>(".tfk-card[data-ficha]");
      if (!card) return;
      // Captura + preventDefault: PreviewRouter respeta el default prevenido y no navega.
      e.preventDefault();
      origen.current = card;
      // El velo es translúcido: sin esto, detrás se vería la tarjeta cerrarse
      // (perdió el hover) mientras en el modal se abre la vista "Abierto".
      card.classList.add("tfk-quieta");
      const d = card.dataset;
      const ilus = card.querySelector<HTMLElement>(".tfk-ilus .ilus");
      setFicha({
        nombre: d.nombre ?? "",
        grupo: d.grupo ?? "",
        desc: d.desc ?? "",
        detalle: d.detalle ?? "",
        puntos: (d.specs ?? "").split("·").map((s) => s.trim()).filter(Boolean),
        href: card.getAttribute("href") ?? "#",
        svg: card.querySelector(".tfk-diagram")?.innerHTML ?? "",
        ilus: ilus?.outerHTML ?? "",
        recorte: ilus?.style.getPropertyValue("--rar") ?? "",
        apilar: ilus?.dataset.apilar !== undefined,
        panelable: d.panelable !== undefined,
        panel: !!card.querySelector(".tfk-ilus.is-panel"),
      });
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Abierto: bloquear el scroll del fondo, cerrar con Esc, foco al ×.
  useEffect(() => {
    if (!ficha) return;
    document.body.style.overflow = "hidden";
    xRef.current?.focus();
    // La vista "abierto" arranca cerrada y se abre cuando terminó de entrar el
    // modal (apcUp dura 400 ms): una sola apertura, sin pelear con la entrada.
    setAbierto(false);
    setPanel(ficha.panel);
    const t = window.setTimeout(() => setAbierto(true), 550);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [ficha, cerrar]);

  if (!ficha) return null;

  // Portal a <body>: el `position: fixed` del velo no queda atrapado en el
  // contexto de apilamiento del hero (mismo motivo que AprendeCampanas).
  return createPortal(
    <div
      className="apc-veil tfk-veil"
      role="dialog"
      aria-modal="true"
      aria-label={`${ficha.nombre} · ${contexto}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) cerrar();
      }}
    >
      <div className={ficha.ilus ? "tfk-modal tfk-modal--ilus" : "tfk-modal"}>
        <button ref={xRef} type="button" className="apc-x tfk-modal-x" onClick={cerrar} aria-label="Cerrar">
          ×
        </button>
        {ficha.ilus ? (
          <div className={panel ? "tfk-modal-fig is-panel" : "tfk-modal-fig"}>
            {ficha.panelable && (
              <button type="button" className="tfk-panelar tfk-panelar--modal" aria-pressed={panel} onClick={() => setPanel((v) => !v)}>
                {panel ? "Ver en acero" : "Panelar"}
              </button>
            )}
            <div className={ficha.apilar ? "tfk-duo tfk-duo--apilado" : "tfk-duo"} aria-hidden="true">
              {(["Cerrado", "Abierto"] as const).map((vista) => (
                <figure key={vista} className={vista === "Abierto" && abierto ? "tfk-duo-item is-abierto" : "tfk-duo-item"}>
                  <span
                    className="tfk-duo-crop"
                    style={{ aspectRatio: ficha.recorte }}
                    dangerouslySetInnerHTML={{ __html: ficha.ilus }}
                  />
                  <figcaption>{vista}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        ) : (
          <div className="tfk-modal-fig" aria-hidden="true">
            <span className="tfk-diagram" dangerouslySetInnerHTML={{ __html: ficha.svg }} />
            <span className="tfk-modal-hint">Pasa el cursor sobre el plano</span>
          </div>
        )}
        <div className="tfk-modal-body">
          <span className="eyebrow">
            {contexto}
            {ficha.grupo ? ` · ${ficha.grupo}` : ""}
          </span>
          <h3>{ficha.nombre}</h3>
          <p className="tfk-modal-desc">{ficha.desc}</p>
          {ficha.detalle && <p className="tfk-modal-detalle">{ficha.detalle}</p>}
          {ficha.puntos.length > 0 && (
            <ul className="tfk-modal-puntos" aria-label="Puntos a considerar">
              {ficha.puntos.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          <div className="tfk-modal-acts">
            <a className="btn btn-primary" href={ficha.href} onClick={() => setFicha(null)}>
              Ver en el catálogo
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
