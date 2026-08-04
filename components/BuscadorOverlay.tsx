"use client";

// BuscadorOverlay — buscador de catálogo de la lupa del nav.
//
// Doctrina: la lupa NO navega. Abre una capa sobre la página en la que está el
// usuario, con autocompletado contra el catálogo de Shopify (/api/buscar) y
// cierre por Esc, clic fuera o ×. La página de abajo no pierde su estado.
//
// El nav se inyecta como HTML del preview (layout.tsx → dangerouslySetInnerHTML),
// así que el disparador se engancha con un listener delegado sobre
// `a.nav-ic-search` en vez de con un onClick de React.
//
// Cada fila muestra lo que el usuario necesita para reconocer el modelo de un
// vistazo: imagen, marca, nombre corto, SKU y precio CON IVA en su moneda.
// Los productos con ficha publicada abren su PDP; el resto —catálogo todavía en
// migración— resuelve por WhatsApp con el SKU ya escrito, que es el modelo de
// lead del sitio.

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ResultadoBusqueda } from "@/lib/catalogo";
import { whatsappHref } from "@/lib/whatsapp";

const MIN_CARACTERES = 2;
const DEBOUNCE_MS = 160;

function destinoDe(r: ResultadoBusqueda): { href: string; externo: boolean } {
  if (r.ficha) return { href: r.ficha, externo: false };
  return {
    href: whatsappHref(
      `¡Hola! Me interesa el ${r.marca} ${r.nombre} (modelo ${r.sku}). ¿Me pueden cotizar?`,
    ),
    externo: true,
  };
}

export default function BuscadorOverlay() {
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [total, setTotal] = useState(0);
  const [paginas, setPaginas] = useState(1);
  const [pagina, setPagina] = useState(1);
  /** Tamaño de página que reporta el servidor: se usa para rellenar la última
   *  con huecos y que el panel no encoja al llegar al final. */
  const [porPagina, setPorPagina] = useState(0);
  // Autocompletado en línea. Se guarda JUNTO CON la consulta que lo originó: la
  // respuesta llega con retraso y, si el usuario ya tecleó más, el tramo gris
  // sobrante mentiría. Solo se pinta cuando `para` coincide con lo escrito ahora.
  const [sugerencia, setSugerencia] = useState<{ para: string; texto: string } | null>(null);
  const [desbordado, setDesbordado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cursor, setCursor] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  // Aborta la petición en vuelo al teclear otra letra: sin esto, una respuesta
  // lenta de hace 3 teclas puede pisar la que ya se está mostrando.
  const peticionRef = useRef<AbortController | null>(null);

  const cerrar = useCallback(() => {
    setAbierto(false);
    setCursor(-1);
  }, []);

  /* ---- Disparadores: lupa del nav (delegado) y ⌘K / Ctrl+K ---- */
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const lupa = (e.target as HTMLElement | null)?.closest?.("a.nav-ic-search");
      if (!lupa) return;
      e.preventDefault();
      setAbierto(true);
    }
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAbierto((v) => !v);
      }
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  /* ---- Foco y bloqueo de scroll mientras la capa está abierta ---- */
  useEffect(() => {
    if (!abierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // rAF: el input existe pero aún no está pintado en el mismo tick.
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = previo;
      cancelAnimationFrame(id);
    };
  }, [abierto]);

  /* ---- ¿El texto ya no cabe en el campo? ---- */
  useEffect(() => {
    const el = inputRef.current;
    if (el) setDesbordado(el.scrollWidth > el.clientWidth + 1);
  }, [q, abierto]);

  /* ---- Autocompletado ---- */
  useEffect(() => {
    if (!abierto) return;
    const consulta = q.trim();

    if (consulta.length < MIN_CARACTERES) {
      peticionRef.current?.abort();
      setResultados([]);
      setTotal(0);
      setPaginas(1);
      setSugerencia(null);
      setCargando(false);
      return;
    }

    setCargando(true);
    const t = setTimeout(async () => {
      peticionRef.current?.abort();
      const ctrl = new AbortController();
      peticionRef.current = ctrl;
      try {
        // Se manda `q` TAL CUAL (sin recortar): la sugerencia se corta por
        // índice de carácter, así que un espacio de más desalinearía el ghost.
        const res = await fetch(`/api/buscar?q=${encodeURIComponent(q)}&p=${pagina}`, {
          signal: ctrl.signal,
        });
        const data = await res.json();
        setResultados(data.resultados ?? []);
        setTotal(data.total ?? 0);
        setPaginas(data.paginas ?? 1);
        setPorPagina(data.porPagina ?? 0);
        // El servidor acota la página al rango válido; se acepta su veredicto
        // para que el número del pie nunca muestre una página que no existe.
        if (data.pagina && data.pagina !== pagina) setPagina(data.pagina);
        setSugerencia(data.sugerencia ? { para: q, texto: data.sugerencia } : null);
        setCursor(-1);
        listaRef.current?.scrollTo?.({ top: 0 });
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          setResultados([]);
          setTotal(0);
          setPaginas(1);
          setSugerencia(null);
        }
      } finally {
        // El abort de una petición vieja no debe apagar el spinner de la nueva.
        if (!ctrl.signal.aborted) setCargando(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(t);
  }, [q, pagina, abierto]);

  /** Tramo gris vigente, o "" si la sugerencia ya no corresponde a lo escrito. */
  const propuesta = sugerencia && sugerencia.para === q ? sugerencia.texto : "";
  // Con texto largo el input hace scroll para seguir al cursor y el ghost no
  // (es un span estático): dejarían de coincidir. Se oculta antes que mentir.
  const fantasma = desbordado ? "" : propuesta;

  /** Toda escritura vuelve a la página 1: paginar sobre otra consulta no tiene
   *  sentido y dejaría al usuario en la página 7 de unos resultados nuevos. */
  function escribir(valor: string) {
    setQ(valor);
    setPagina(1);
  }

  function aceptarSugerencia() {
    if (!fantasma) return;
    escribir(q + fantasma);
    setSugerencia(null);
  }

  function irA(destino: number) {
    setPagina(Math.min(Math.max(1, destino), paginas));
  }

  /* ---- Teclado dentro de la capa ---- */
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      cerrar();
      return;
    }

    // Tab y → completan lo sugerido, como en la barra del navegador. La flecha
    // solo cuando el cursor ya está al final: si no, se rompe mover el cursor.
    if (fantasma && (e.key === "Tab" || e.key === "ArrowRight")) {
      const alFinal = inputRef.current?.selectionStart === q.length;
      if (e.key === "Tab" || alFinal) {
        e.preventDefault();
        aceptarSugerencia();
        return;
      }
    }

    if (resultados.length === 0) return;

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const paso = e.key === "ArrowDown" ? 1 : -1;
      const siguiente = (cursor + paso + resultados.length + 1) % (resultados.length + 1);
      setCursor(siguiente === resultados.length ? -1 : siguiente);
      return;
    }
    if (e.key === "Enter" && cursor >= 0) {
      e.preventDefault();
      const el = listaRef.current?.querySelectorAll<HTMLAnchorElement>("a.bsc-row")[cursor];
      el?.click();
    }
  }

  if (!abierto) return null;

  const consulta = q.trim();
  const sinResultados =
    consulta.length >= MIN_CARACTERES && !cargando && resultados.length === 0;

  // La última página casi nunca viene llena. Sin relleno, el panel encogería al
  // llegar a ella y el paginador saltaría hacia arriba justo cuando el usuario
  // va a hacer clic en «anterior».
  const faltantes = paginas > 1 ? Math.max(0, porPagina - resultados.length) : 0;
  const huecos = Array.from({ length: faltantes }, (_, i) => i);

  return (
    <div
      className="bsc-scrim"
      role="dialog"
      aria-modal="true"
      aria-label="Buscar en el catálogo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cerrar();
      }}
    >
      <div className="bsc-panel" onKeyDown={onKeyDown}>
        <button type="button" className="bsc-close" onClick={cerrar} aria-label="Cerrar buscador">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
          </svg>
        </button>

        <div className="bsc-bar">
          <span className="bsc-lupa" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
          </span>
          <span className="bsc-campo">
            {/* Ghost: reproduce lo tecleado en transparente para que el tramo
                sugerido caiga justo después, alineado al carácter. */}
            <span className="bsc-ghost" aria-hidden="true">
              <span className="bsc-ghost-esc">{q}</span>
              {fantasma}
            </span>
            <input
              ref={inputRef}
              className="bsc-input"
              type="search"
              value={q}
              onChange={(e) => escribir(e.target.value)}
              placeholder={'Busca por modelo, marca o tipo. Ej. PGP96KMTI0 o "Parrilla de gas"'}
              aria-label="Buscar productos"
              // El ghost lo anuncia el lector de pantalla por aquí, no por el
              // <span>, que va aria-hidden para no leer el texto dos veces.
              aria-description={fantasma ? `Sugerencia: ${q}${fantasma}` : undefined}
              autoComplete="off"
              spellCheck={false}
            />
          </span>
          {consulta.length >= MIN_CARACTERES && (
            <span className="bsc-count figures">
              {cargando ? "Buscando…" : `${total} ${total === 1 ? "resultado" : "resultados"}`}
            </span>
          )}
        </div>

        <div className="bsc-body">
          {/* Sin instrucción de arranque: el placeholder ya dice qué escribir y
              repetirlo debajo solo llenaba la capa de texto. */}
          {sinResultados && (
            <div className="bsc-vacio">
              <p className="bsc-hint">
                Sin resultados para <i>«{consulta}»</i>.
              </p>
              <a
                className="arrow-link"
                href={whatsappHref(
                  `¡Hola! Busco «${consulta}» y no lo encontré en el sitio. ¿Me pueden ayudar?`,
                )}
                target="_blank"
                rel="noopener"
                data-track="whatsapp_click"
                data-label="buscador_sin_resultados"
              >
                Pregúntale a un especialista <span className="ln" />
                <span className="ar">→</span>
              </a>
            </div>
          )}

          {resultados.length > 0 && (
            <div className="bsc-lista" ref={listaRef} role="listbox">
              {resultados.map((r, i) => {
                const { href, externo } = destinoDe(r);
                return (
                  <a
                    key={r.sku}
                    className={`bsc-row${i === cursor ? " is-cursor" : ""}`}
                    href={href}
                    role="option"
                    aria-selected={i === cursor}
                    onClick={cerrar}
                    {...(externo
                      ? {
                          target: "_blank",
                          rel: "noopener",
                          "data-track": "whatsapp_click",
                          "data-label": `buscador_${r.sku}`,
                        }
                      : {})}
                  >
                    <span className="bsc-thumb">
                      {r.imagen ? (
                        // next/image y no <img>: los packshots pesan hasta 4.4 MB
                        // y aquí se ven a 62 px. Servidos en crudo, ocho filas
                        // pedían ~16 MB y las miniaturas tardaban segundos en
                        // aparecer. Next entrega una versión del tamaño real.
                        <Image src={r.imagen} alt="" width={62} height={62} />
                      ) : (
                        <span className="bsc-thumb-ph" aria-hidden="true" />
                      )}
                    </span>
                    <span className="bsc-datos">
                      <span className="bsc-marca">
                        {r.marca}
                        {r.serie && <span className="bsc-serie"> · {r.serie}</span>}
                      </span>
                      <span className="bsc-nombre">{r.nombre}</span>
                      <span className="bsc-sku figures">{r.sku}</span>
                    </span>
                    <span className="bsc-precio figures">
                      <span className="bsc-moneda">{r.moneda}</span>
                      <span className="bsc-cifra">${r.precio}</span>
                      <span className="bsc-iva">IVA incluido</span>
                    </span>
                  </a>
                );
              })}
              {/* Huecos de relleno en la última página. Solo cuando hay
                  paginación: en una búsqueda de un único resultado dejarían
                  siete filas vacías sin motivo. */}
              {huecos.map((n) => (
                // Mismo esqueleto que una fila real, en invisible: así el alto
                // lo calcula el propio CSS y no hay que mantener un número
                // mágico que se rompa al cambiar tipografía o breakpoint.
                <span className="bsc-row bsc-row--hueco" key={`hueco-${n}`} aria-hidden="true">
                  <span className="bsc-thumb" />
                  <span className="bsc-datos">
                    <span className="bsc-marca">&nbsp;</span>
                    <span className="bsc-nombre">&nbsp;</span>
                    <span className="bsc-sku">&nbsp;</span>
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {resultados.length > 0 && (
          <div className="bsc-pie">
            {/* Solo tab y esc: ↑↓ y ↵ siguen funcionando, pero anunciarlos
                llenaba el pie de instrucciones que nadie lee. */}
            <span className="bsc-teclas">
              {fantasma && (
                <>
                  <kbd>tab</kbd> para completar ·{" "}
                </>
              )}
              <kbd>esc</kbd> para cerrar
            </span>
            {paginas > 1 && (
              <span className="bsc-pager">
                <button
                  type="button"
                  className="bsc-pg"
                  onClick={() => irA(pagina - 1)}
                  disabled={pagina === 1}
                  aria-label="Página anterior"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <polyline points="15 5 8 12 15 19" />
                  </svg>
                </button>
                <span className="bsc-pg-num figures" aria-live="polite">
                  Página <b>{pagina}</b> de {paginas}
                </span>
                <button
                  type="button"
                  className="bsc-pg"
                  onClick={() => irA(pagina + 1)}
                  disabled={pagina === paginas}
                  aria-label="Página siguiente"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <polyline points="9 5 16 12 9 19" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
