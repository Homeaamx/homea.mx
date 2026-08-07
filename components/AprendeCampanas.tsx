"use client";

// AprendeCampanas — banner "Antes de elegir" en el hero de Guías/Campanas +
// overlay a pantalla completa con la guía educativa del sitio OXATIS
// (PBCPPlayer ID=2383944) reorganizada en 5 pasos. Las láminas son las
// originales (public/assets/guias/aprende-campanas/); se irán sustituyendo por
// diagramas de línea del design system.
//
// Deep-link: /guias/cocina-y-bar/coccion/campanas#aprende abre el overlay al
// cargar — es el destino del botón "Aprende sobre campanas" del PLP (TipoGrid).

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const IMG = "/assets/guias/aprende-campanas/homea-campanas-guia-para-comprar";

/** Láminas del paso 04 · Motores (Nota 3 del sitio viejo, imágenes 2–5). */
const SALIDAS = [
  {
    k: "interno",
    label: "Motor interno",
    img: `${IMG}-3b.jpg`,
    cap: "Motor interno · salida a pared o techo",
    txt: (
      <>
        Con <b>motor interno</b> la salida puede ir a <b>pared o techo</b>; la
        ruta la define tu proyecto.
      </>
    ),
  },
  {
    k: "inline",
    label: "Motor inline",
    img: `${IMG}-3c.jpg`,
    cap: "Motor inline · salida a pared o techo",
    txt: (
      <>
        Con <b>motor inline</b> el motor va a medio ducto — salida a{" "}
        <b>pared o techo</b>, con menos ruido en la cocina.
      </>
    ),
  },
  {
    k: "ext-pared",
    label: "Externo · pared",
    img: `${IMG}-3d.jpg`,
    cap: "Motor externo · salida a la pared",
    txt: (
      <>
        Con <b>motor externo en la pared</b> el motor queda fuera de casa: la
        opción más silenciosa.
      </>
    ),
  },
  {
    k: "ext-techo",
    label: "Externo · techo",
    img: `${IMG}-3e.jpg`,
    cap: "Motor externo · salida al techo",
    txt: (
      <>
        El <b>motor externo también puede ir al techo</b> — mismo silencio,
        salida por la cubierta.
      </>
    ),
  },
];

const VIDEO_DOWNDRAFT = "https://youtu.be/NZ2AsChtmjc";

/** Las 9 láminas del overlay, todas montadas a la vez (ver .apc-imgs). */
const LAMINAS = [
  { src: `${IMG}-1.jpg`, alt: "Campana extractora comparada con campana purificadora" },
  { src: `${IMG}-2.jpg`, alt: "Tipos de motores de extracción: interno, inline y externo, con sus potencias" },
  { src: `${IMG}-3a.jpg`, alt: "Rutas posibles de la ductería de extracción dentro de la casa" },
  ...SALIDAS.map((s) => ({ src: s.img, alt: s.cap })),
  { src: `${IMG}-4.jpg`, alt: "Campana downdraft con ductos por debajo del piso, recirculante o extractora" },
  { src: `${IMG}-5.jpg`, alt: "Tuberías, ductos, codos y salidas de extracción no incluidos" },
];

export default function AprendeCampanas() {
  const [open, setOpen] = useState(false);
  const [paso, setPaso] = useState(0);
  const [salida, setSalida] = useState(0);
  const xRef = useRef<HTMLButtonElement>(null);

  const abrir = useCallback((desde = 0) => {
    setPaso(desde);
    setOpen(true);
  }, []);

  const cerrar = useCallback(() => {
    setOpen(false);
    // El deep-link #aprende ya cumplió: se limpia sin ensuciar el historial.
    if (window.location.hash === "#aprende") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  // Deep-link #aprende (carga directa y cambios de hash en la misma sesión).
  useEffect(() => {
    const porHash = () => {
      if (window.location.hash === "#aprende") abrir(0);
    };
    porHash();
    window.addEventListener("hashchange", porHash);
    return () => window.removeEventListener("hashchange", porHash);
  }, [abrir]);

  // Overlay abierto: bloquear el scroll del fondo, cerrar con Esc, foco al ×.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    xRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, cerrar]);

  const ultimo = paso === 5;
  const laminaActiva =
    paso === 0
      ? `${IMG}-1.jpg`
      : paso === 1
        ? `${IMG}-2.jpg`
        : paso === 2
          ? `${IMG}-3a.jpg`
          : paso === 3
            ? SALIDAS[salida].img
            : paso === 4
              ? `${IMG}-4.jpg`
              : `${IMG}-5.jpg`;

  return (
    <>
      {/* Banner en el hueco del hero (columna derecha). */}
      <div className="apc-card">
        <span className="eyebrow">Antes de elegir</span>
        <h3>
          Aprende sobre campanas <i>en 6 pasos</i>.
        </h3>
        <p>
          Extracción o recirculación, tipo de motor, por dónde sale el aire y
          qué debe dejar listo tu obra.
        </p>
        <button type="button" className="btn btn-gold" onClick={() => abrir(0)}>
          Aprender sobre campanas
        </button>
      </div>

      {/* El overlay se monta en <body> vía portal: el hero (.page-hero--plano)
          tiene `isolation: isolate`, y sin portal el `position: fixed` del velo
          queda atrapado en ese contexto de apilamiento — el nav sticky (z:50)
          se pintaría encima del panel. `open` solo puede ser true en cliente. */}
      {open && createPortal(
        <div
          className="apc-veil"
          role="dialog"
          aria-modal="true"
          aria-label="Aprende sobre campanas"
          onClick={(e) => {
            if (e.target === e.currentTarget) cerrar();
          }}
        >
          <div className="apc-panel">
            <button
              ref={xRef}
              type="button"
              className="apc-x"
              onClick={cerrar}
              aria-label="Cerrar"
            >
              ×
            </button>

            <div className="apc-head">
              <span className="eyebrow">Antes de elegir</span>
              <h2>
                Aprende sobre campanas <i>en 6 pasos</i>.
              </h2>
            </div>

            <div className="apc-steps" role="tablist">
              {["¿Qué tipo?", "El motor", "Ductería", "Motores", "Downdraft", "Extras"].map(
                (t, i) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={paso === i}
                    className={`apc-step${paso === i ? " on" : ""}`}
                    onClick={() => setPaso(i)}
                  >
                    <em>0{i + 1}</em> {t}
                  </button>
                )
              )}
            </div>

            <div className="apc-body">
              {/* ── Lámina ──
                  Las 9 imágenes viven SIEMPRE en el DOM dentro de un marco de
                  proporción fija: cambiar de paso solo alterna cuál es visible
                  (fundido), sin re-descargar ni mover la altura del panel. */}
              <figure className="apc-fig">
                <span className="apc-imgs">
                  {LAMINAS.map((im) => (
                    <img
                      key={im.src}
                      src={im.src}
                      alt={im.alt}
                      className={im.src === laminaActiva ? "on" : undefined}
                    />
                  ))}
                </span>
                <figcaption>
                  {paso === 0 && "Campana extractora vs purificadora"}
                  {paso === 1 && "Escoge: motor interno, inline o externo"}
                  {paso === 2 && "¿Por dónde pasará la ductería de extracción?"}
                  {paso === 3 && SALIDAS[salida].cap}
                  {paso === 4 && "Downdraft · ¿recirculante o extractora?"}
                  {paso === 5 && "Ductos, codos y salidas: no incluidos"}
                </figcaption>
              </figure>

              {/* ── Texto ── */}
              <div className="apc-txt">
                {paso === 0 && (
                  <>
                    <h3>¿Qué tipo de campana prefieres?</h3>
                    <p>
                      La <b>extractora</b> captura el vapor y lo{" "}
                      <b>saca de la casa</b> por un ducto, es la opción{" "}
                      <b>ideal</b> siempre que la obra lo permita.
                    </p>
                    <p>
                      La <b>purificadora</b> filtra el aire y lo{" "}
                      <b>devuelve a la cocina</b>: para espacios donde no hay
                      salida posible.
                    </p>
                    <p className="apc-dato">
                      Esta decisión define el motor, la ductería, el diseño y
                      hasta el mueble.
                    </p>
                  </>
                )}
                {paso === 1 && (
                  <>
                    <h3>Tipos de motores de extracción.</h3>
                    <ul className="apc-leyenda">
                      <li>
                        <span className="n">1</span>
                        <span>
                          <b>Motor interno</b> — dentro de la campana
                        </span>
                        <span className="r">Ruido mayor</span>
                      </li>
                      <li>
                        <span className="n">2</span>
                        <span>
                          <b>Motor inline</b> — en medio del ducto
                        </span>
                        <span className="r">Ruido medio</span>
                      </li>
                      <li>
                        <span className="n">3</span>
                        <span>
                          <b>Motor externo</b> — fuera de casa
                        </span>
                        <span className="r">Ruido menor</span>
                      </li>
                    </ul>
                    <p className="apc-dato">
                      Entre más lejos el motor, más silenciosa la cocina. La
                      potencia del motor depende del tamaño de la campana y del
                      uso del área de cocción.
                    </p>
                  </>
                )}
                {paso === 2 && (
                  <>
                    <h3>¿Por dónde pasará la ductería?</h3>
                    <p>
                      Debes considerar <b>la ruta de ductería conforme a tu
                      espacio disponible</b>, ya que esto define qué tipo de
                      campana necesitas. Algunos modelos requieren{" "}
                      <b>ductos de 10″ de diámetro</b>, algo considerable que
                      comentar con tu arquitecto.
                    </p>
                    <p className="apc-dato">
                      Si no tienes espacio para extracción, debes escoger una
                      campana purificadora.
                    </p>
                  </>
                )}
                {paso === 3 && (
                  <>
                    <h3>¿Dónde pondrás la salida?</h3>
                    <div className="apc-subtabs">
                      {SALIDAS.map((s, i) => (
                        <button
                          key={s.k}
                          type="button"
                          className={salida === i ? "on" : undefined}
                          onClick={() => setSalida(i)}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <p>{SALIDAS[salida].txt}</p>
                    <p className="apc-dato">
                      Entre menos curvas tenga la ruta, mejor extrae y menos
                      ruido hace.
                    </p>
                  </>
                )}
                {paso === 4 && (
                  <>
                    <h3>Campanas downdraft.</h3>
                    <p>
                      Se esconden <b>debajo de tu cubierta</b> y se abren con un
                      control o con un botón. Extraen el vapor hacia abajo y
                      pueden ser <b>recirculantes</b> (recirculan el aire dentro
                      del mueble) o <b>extractoras</b> (lo sacan de la casa).
                    </p>
                    <p className="apc-dato">
                      *Los ductos de extracción van por debajo del piso — hay
                      que preverlo en obra.
                    </p>
                    {/* Abajo del todo (columna flex): alineado al pie de la lámina. */}
                    <a
                      className="arrow-link apc-video"
                      href={VIDEO_DOWNDRAFT}
                      target="_blank"
                      rel="noopener"
                    >
                      Ver video de downdraft <span className="ln" />
                      <span className="ar">→</span>
                    </a>
                  </>
                )}
                {paso === 5 && (
                  <>
                    <h3>Extras que debes considerar.</h3>
                    <p>
                      Las <b>tuberías, ductos, codos y salidas no están
                      incluidas</b> con la campana: tu{" "}
                      <b>arquitecto o instalador</b> es el responsable de
                      planear la instalación.
                    </p>
                    <p>
                      Nosotros te compartimos las{" "}
                      <b>especificaciones exactas del modelo</b> antes de
                      comprar.
                    </p>
                    <p className="apc-dato">
                      Para la instalación, la campana debe estar colocada y
                      conectada al motor — ver Garantías.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="apc-foot">
              <div className="apc-nav">
                <button
                  type="button"
                  onClick={() => setPaso(Math.max(0, paso - 1))}
                  disabled={paso === 0}
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  className="primario"
                  onClick={() => (ultimo ? cerrar() : setPaso(paso + 1))}
                >
                  {ultimo ? "Cerrar ✓" : "Siguiente →"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
