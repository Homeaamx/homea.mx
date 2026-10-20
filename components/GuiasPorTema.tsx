"use client";

// GuiasPorTema — riel "Explora por categoría" + guías de las páginas de guías
// sin portada (Lavandería, Baños, Wellness, Alberca…), y BlogTemas — el Blog de
// la portada de Electrodomésticos menores, cuyas tarjetas hacen de categoría
// (Carla, 2026-10-20).
//
// Cada guía pertenece a una categoría (`temas` de su tarjeta, lib/guias →
// temasDeGuia) y el riel muestra el número solo donde hay guías. Al elegir una
// categoría cambian únicamente las guías visibles y aparece, a la derecha de los
// chips, "Ver productos en tienda" con el filtro de esa categoría; los chips
// "Todas / Guía de compra…" y lo demás se quedan fijos. Un segundo clic en la
// misma categoría vuelve a todas. El tema elegido queda en el hash (#jacuzzi).

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import GuideTypeFilter from "./GuideTypeFilter";
import type { GuideCardData } from "./GuideCard";

export interface TemaGuia {
  nombre: string;
  slug: string;
  /** Página de la tienda de esta categoría. */
  tienda?: string;
}

interface Props {
  temas: TemaGuia[];
  cards: GuideCardData[];
  tipos: { slug: string; nombre: string }[];
  railHead?: string;
}

/** Tema elegido, sincronizado con el hash de la URL. */
function useTema(temas: TemaGuia[]) {
  const [activo, setActivo] = useState<string | null>(null);
  useEffect(() => {
    const leer = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      if (temas.some((t) => t.slug === h)) setActivo(h);
    };
    leer();
    window.addEventListener("hashchange", leer);
    return () => window.removeEventListener("hashchange", leer);
  }, [temas]);
  // El hash se escribe fuera del setState: tocar el history dentro del
  // actualizador hace que el Router de Next se actualice durante el render.
  const actual = useRef<string | null>(null);
  actual.current = activo;
  const elegir = useCallback((slug: string) => {
    const nuevo = actual.current === slug ? null : slug;
    setActivo(nuevo);
    history.replaceState(null, "", nuevo ? `#${nuevo}` : window.location.pathname + window.location.search);
  }, []);
  return { tema: temas.find((t) => t.slug === activo) ?? null, elegir };
}

/** Chips fijos + guías del tema + botón a la tienda. */
function GuiasDelTema({ tema, cards, tipos }: { tema: TemaGuia | null; cards: GuideCardData[]; tipos: Props["tipos"] }) {
  const visibles = tema ? cards.filter((c) => c.temas?.includes(tema.slug)) : cards;
  return (
    <GuideTypeFilter
      cards={cards}
      tipos={tipos}
      visibles={visibles}
      accion={
        tema?.tienda ? (
          <Link className="btn tema-tienda" href={tema.tienda}>
            Ver productos en tienda
          </Link>
        ) : null
      }
      vacio={tema ? <p className="guide-empty">Aún no hay guías publicadas de {tema.nombre}.</p> : null}
    />
  );
}

export default function GuiasPorTema({ temas, cards, tipos, railHead = "Explora por categoría" }: Props) {
  const { tema, elegir } = useTema(temas);
  return (
    <div className="container category-layout">
      <nav className="cat-rail" aria-label={railHead}>
        <span className="cat-rail-head eyebrow">{railHead}</span>
        {temas.map((t) => {
          const n = cards.filter((c) => c.temas?.includes(t.slug)).length;
          return (
            <button
              key={t.slug}
              type="button"
              className={`cat-rail-item cat-rail-leaf cat-rail-btn${t.slug === tema?.slug ? " is-active" : ""}`}
              aria-pressed={t.slug === tema?.slug}
              onClick={() => elegir(t.slug)}
            >
              {t.nombre}
              {n > 0 && <span className="cat-rail-n">{n}</span>}
            </button>
          );
        })}
      </nav>
      <div className="category-main">
        <GuiasDelTema tema={tema} cards={cards} tipos={tipos} />
      </div>
    </div>
  );
}

/**
 * Blog de una portada cuyas tarjetas son categorías sin página propia
 * (Electrodomésticos menores): la tarjeta lleva `data-tema-guia="<slug>"` y, al
 * hacer clic, elige ese tema aquí, la marca y baja al Blog.
 */
export function BlogTemas({ temas, cards, tipos }: Omit<Props, "railHead">) {
  const { tema, elegir } = useTema(temas);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const card = (e.target as Element).closest<HTMLElement>("[data-tema-guia]");
      if (!card) return;
      e.preventDefault();
      elegir(card.dataset.temaGuia!);
      document.getElementById("blog")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [elegir]);

  // La tarjeta elegida se marca (y se desmarca al volver a todas).
  useEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-tema-guia]").forEach((el) => {
      const on = el.dataset.temaGuia === tema?.slug;
      el.classList.toggle("is-activa", on);
      el.setAttribute("aria-pressed", String(on));
    });
  }, [tema]);

  return <GuiasDelTema tema={tema} cards={cards} tipos={tipos} />;
}
