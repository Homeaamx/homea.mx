"use client";

// GuiaSearch — buscador de la sección Guías.
//  • En el hub /guias: filtra entre TODAS las guías (título, resumen, etiqueta).
//  • En una categoría (Subcategoría 1, p.ej. Refrigeración): se pasa `topics`
//    (las Subcategorías 2 / tipos de producto) además de las guías de esa
//    categoría → la búsqueda queda ACOTADA a esa subcategoría y encuentra tanto
//    sus temas (Refrigeradores, Cavas de vino, …) como sus guías.
//  • Con `fichas` (índice de la categoría, lib/guiasBusqueda; Carla 2026-10-20):
//    cualquier palabra de una tarjeta, descripción o título de la sección la
//    encuentra; el resultado lleva a ESA tarjeta, cerrada o con su descripción
//    extendida (DestinoBusqueda). Autocompletado en línea (ghost gris, Tab o →
//    lo aceptan) con frases de la propia sección de 1 a 3 palabras.
// Los temas enlazan a su filtro PLP vía <CtaProducto> (sin 404); las guías a su ruta.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { GuideCardData } from "./GuideCard";
import CtaProducto from "./CtaProducto";
import { irADestino } from "./DestinoBusqueda";
import type { EntradaBusqueda } from "@/lib/guiasBusqueda";

/** Minúsculas sin acentos, carácter por carácter: conserva la longitud, así los
 *  índices sirven para el texto original (resaltado y ghost). */
const norm = (s: string) => Array.from(s, (c) => c.normalize("NFD")[0].toLowerCase()).join("");

const VACIAS = new Set(
  "a al con como de del e el en es la las lo los más mas o para por que se según segun sin su sus u un una y ya".split(" "),
);
const MAX_RESULTADOS = 8;

interface Topic {
  nombre: string;
  filtro: string;
}

interface Props {
  guias: GuideCardData[];
  /** Temas (Subcategoría 2) de la categoría actual; acotan la búsqueda a la subcategoría. */
  topics?: Topic[];
  /** Tarjetas y fichas de la categoría (todo su texto) con su destino. */
  fichas?: EntradaBusqueda[];
  /** Texto del placeholder del input. */
  placeholder?: string;
  /** Etiqueta accesible del input. */
  ariaLabel?: string;
  /** Etiqueta (tag) que se muestra en los resultados de tema. */
  scopeLabel?: string;
}

interface Resultado {
  key: string;
  tag: string;
  titulo: string;
  /** Fragmento con la coincidencia: [antes, coincidencia, después]. */
  extracto?: [string, string, string];
  href: string;
  tipo: "link" | "cta";
}

/** Frases de 1–3 palabras de un texto que no empiezan ni terminan en palabra vacía. */
function frases(texto: string, peso: number, cuenta: Map<string, { txt: string; n: number }>) {
  for (const tramo of texto.split(/[.,;:()·¿?¡!"“”/]+/)) {
    const pal = tramo.split(/\s+/).filter(Boolean);
    for (let i = 0; i < pal.length; i++) {
      if (VACIAS.has(norm(pal[i]))) continue;
      for (let n = 1; n <= 3 && i + n <= pal.length; n++) {
        if (VACIAS.has(norm(pal[i + n - 1]))) continue;
        const txt = pal.slice(i, i + n).join(" ");
        if (txt.length < 3) continue;
        const k = norm(txt);
        const e = cuenta.get(k) ?? { txt, n: 0 };
        e.n += peso * (n === 1 ? 1 : 1.25);
        cuenta.set(k, e);
      }
    }
  }
}

/** Extracto de ~70 caracteres alrededor de la primera coincidencia. */
function extracto(texto: string, termino: string): [string, string, string] | undefined {
  const i = norm(texto).indexOf(termino);
  if (i < 0) return undefined;
  const ini = Math.max(0, texto.lastIndexOf(" ", Math.max(0, i - 30)) + 1);
  let fin = texto.indexOf(" ", Math.min(texto.length, i + termino.length + 40));
  if (fin < 0) fin = texto.length;
  return [
    (ini > 0 ? "…" : "") + texto.slice(ini, i),
    texto.slice(i, i + termino.length),
    texto.slice(i + termino.length, fin) + (fin < texto.length ? "…" : ""),
  ];
}

export default function GuiaSearch({
  guias,
  topics = [],
  fichas = [],
  placeholder = "Busca en el Centro de Guías",
  ariaLabel = "Buscar en las guías",
  scopeLabel = "Tema",
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  const term = norm(q.trim()).replace(/\s+/g, " ");
  const palabras = term ? term.split(" ") : [];

  // Vocabulario de la sección para el autocompletado: los títulos pesan más.
  const vocab = useMemo(() => {
    const cuenta = new Map<string, { txt: string; n: number }>();
    for (const f of fichas) {
      frases(f.titulo, 6, cuenta);
      frases(f.visible, 1, cuenta);
      frases(f.extendido, 1, cuenta);
    }
    for (const t of topics) frases(t.nombre, 6, cuenta);
    for (const g of guias) frases(g.titulo, 2, cuenta);
    // Frases de varias palabras que salen una sola vez son ruido.
    return [...cuenta.entries()]
      .filter(([k, e]) => !k.includes(" ") || e.n >= 2)
      .map(([k, e]) => ({ k, txt: e.txt, n: e.n }))
      .sort((a, b) => b.n - a.n || a.k.length - b.k.length);
  }, [fichas, topics, guias]);

  // Ghost: completa lo último que se escribió (hasta 3 palabras) con la frase más
  // usada de la sección que empieza así.
  const fantasma = useMemo(() => {
    const crudo = q.replace(/^\s+/, "");
    if (norm(crudo).trim().length < 2 || /\s{2,}$/.test(crudo)) return "";
    const pals = norm(crudo).split(/\s+/);
    for (let k = Math.min(3, pals.length); k >= 1; k--) {
      const cola = pals.slice(-k).join(" ");
      if (cola.replace(/\s/g, "").length < 2) continue;
      const hit = vocab.find((v) => v.k.length > cola.length && v.k.startsWith(cola));
      if (hit) return hit.txt.slice(cola.length).toLowerCase();
    }
    return "";
  }, [q, vocab]);

  const resultados = useMemo<Resultado[]>(() => {
    if (term.length < 2) return [];
    const todas = (h: string) => palabras.every((p) => h.includes(p));
    const out: (Resultado & { rango: number })[] = [];
    fichas.forEach((f, i) => {
      const tit = norm(f.titulo);
      const vis = norm(f.visible);
      const ext = norm(f.extendido);
      if (!todas(`${tit} ${vis} ${ext}`)) return;
      const enCerrada = todas(`${tit} ${vis}`);
      const rango = tit.includes(term) ? 0 : enCerrada ? 1 : 2;
      const fuente = rango === 0 ? undefined : vis.includes(palabras[0]) ? f.visible : f.extendido;
      out.push({
        key: `f-${i}`,
        tag: f.tag,
        titulo: f.titulo,
        extracto: fuente ? extracto(fuente, palabras[0]) : undefined,
        href: enCerrada ? f.href : (f.hrefDetalle ?? f.href),
        tipo: "link",
        rango,
      });
    });
    topics.forEach((t) => {
      if (todas(norm(t.nombre))) out.push({ key: `t-${t.filtro}`, tag: scopeLabel, titulo: t.nombre, href: t.filtro, tipo: "cta", rango: 0 });
    });
    guias.forEach((g) => {
      if (todas(norm(`${g.titulo} ${g.resumen} ${g.etiqueta}`)))
        out.push({ key: `g-${g.href}`, tag: g.etiqueta, titulo: g.titulo, href: g.href, tipo: "link", rango: 3 });
    });
    return out
      .sort((a, b) => a.rango - b.rango)
      .slice(0, MAX_RESULTADOS)
      .map(({ rango: _, ...r }) => r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, fichas, topics, guias, scopeLabel]);

  const total = resultados.length;

  useEffect(() => setCursor(-1), [term]);

  // Cerrar el panel al hacer clic fuera o con Escape.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const showPanel = open && term.length >= 2;

  // Limitar la altura del panel para que no invada la sección de abajo: su borde
  // inferior nunca pasa del encabezado de la sección (ni del viewport).
  useEffect(() => {
    if (!showPanel) return;
    const panel = panelRef.current;
    if (!panel) return;
    const heading = document.querySelector(".catsec h2, .category-main h2, .sec h2");
    const fit = () => {
      const top = panel.getBoundingClientRect().top;
      const headingTop = heading
        ? heading.getBoundingClientRect().top - 24
        : window.innerHeight;
      // Nunca menos de ~4 resultados: en la portada el encabezado de abajo queda
      // pegado al buscador y el panel se reducía a nada.
      const bound = Math.max(Math.min(headingTop, window.innerHeight - 8), top + 300);
      panel.style.maxHeight = `${Math.max(0, Math.min(bound, window.innerHeight - 8) - top)}px`;
    };
    fit();
    window.addEventListener("scroll", fit, { passive: true });
    window.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("scroll", fit);
      window.removeEventListener("resize", fit);
    };
  }, [showPanel, total]);

  function ir(r: Resultado) {
    setOpen(false);
    if (r.href.startsWith("#")) {
      // Tarjeta de esta misma página (portada): se centra y se resalta.
      history.replaceState(null, "", r.href);
      irADestino(r.href);
    } else {
      router.push(r.href);
    }
  }

  function aceptarFantasma() {
    setQ(q + fantasma);
    setOpen(true);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Tab y → completan lo sugerido (→ solo con el cursor al final).
    if (fantasma && (e.key === "Tab" || e.key === "ArrowRight")) {
      if (e.key === "Tab" || inputRef.current?.selectionStart === q.length) {
        e.preventDefault();
        aceptarFantasma();
        return;
      }
    }
    if (!showPanel || total === 0) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const paso = e.key === "ArrowDown" ? 1 : -1;
      setCursor((c) => ((c + 1 + paso + total + 1) % (total + 1)) - 1);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const el = listaRef.current?.querySelectorAll<HTMLElement>(".guia-search-result")[Math.max(0, cursor)];
      el?.click();
    }
  }

  const fila = (r: Resultado) => (
    <>
      <span className="guia-search-result-tag">{r.tag}</span>
      <span className="guia-search-result-title">{r.titulo}</span>
      {r.extracto && (
        <span className="guia-search-result-txt">
          {r.extracto[0]}
          <mark>{r.extracto[1]}</mark>
          {r.extracto[2]}
        </span>
      )}
    </>
  );

  return (
    <div
      className="guia-search"
      ref={wrapRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        // Mientras se escribe, el panel no se cierra por mover el ratón.
        if (document.activeElement !== inputRef.current) setOpen(false);
      }}
    >
      <div className="guia-search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
             strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </svg>
        <span className="guia-search-campo">
          {/* Ghost: lo tecleado en transparente y, detrás, el tramo sugerido. */}
          <span className="guia-search-ghost" aria-hidden="true">
            <span className="guia-search-ghost-esc">{q}</span>
            {fantasma}
          </span>
          <input
            ref={inputRef}
            type="search"
            className="guia-search-input"
            placeholder={placeholder}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            aria-label={ariaLabel}
            aria-description={fantasma ? `Sugerencia: ${q}${fantasma}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
        </span>
      </div>

      {showPanel && (
        <div className="guia-search-panel" ref={panelRef} role="listbox" aria-label="Resultados de búsqueda">
          {total === 0 ? (
            <p className="guia-search-empty">Sin resultados para «{q.trim()}».</p>
          ) : (
            <ul className="guia-search-results" ref={listaRef}>
              {resultados.map((r, i) => (
                <li key={r.key} className={i === cursor ? "is-activo" : undefined}>
                  {r.tipo === "cta" ? (
                    <CtaProducto filtro={r.href} className="guia-search-result" fallback="whatsapp">
                      {fila(r)}
                    </CtaProducto>
                  ) : (
                    <Link
                      className="guia-search-result"
                      href={r.href}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                        e.preventDefault();
                        ir(r);
                      }}
                    >
                      {fila(r)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
