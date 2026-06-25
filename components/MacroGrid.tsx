// MacroGrid — mosaico editorial (bento) de las 10 macrocategorías.
// El TAMAÑO del tile codifica jerarquía: Cocina y Bar y Baños son features
// grandes (2×2), las secundarias anchas (2×1) y las de nicho compactas (1×1).
// El layout se resuelve con grid-template-areas en CSS (.catsec .macro-grid);
// aquí cada tile solo declara su área, su clase de tamaño, su número de índice
// y el retraso de entrada (stagger) por orden de lectura.

import type { CSSProperties } from "react";
import Link from "next/link";
import type { Macrocategoria } from "@/types/guias";

// Foto editorial por macro (en /public/assets/photos). Si falta, queda el fondo espresso.
const FOTO_MACRO: Record<string, { src: string; pos?: string }> = {
  "cocina-y-bar": { src: "cat-cocina-bar.jpg", pos: "center 80%" },
  exterior: { src: "cat-exterior-asador.jpg" },
  "electrodomesticos-menores": { src: "cat-electro-menores-kitchenaid-mixer.webp", pos: "center 55%" },
  lavanderia: { src: "cat-cuidado-ropa-bosch-lavadora-secadora.jpg" },
  banos: { src: "cat-banos.jpg", pos: "center 80%" },
  minisplits: { src: "minisplit.png" },
  "vapor-y-sauna": { src: "cat-vapor-sauna.jpg" },
  wellness: { src: "cat-wellness.jpg" },
  "recubrimientos-y-superficies": { src: "cat-recubrimientos-laminam-noir-desir.jpg", pos: "center 70%" },
  "chimeneas-y-calentadores": { src: "cat-chimeneas.jpg" },
};

// Mosaico: área (grid-template-areas), tamaño (tipografía) y orden de lectura
// (número visible + stagger). El número y el delay siguen el zig-zag visual,
// no el orden del DOM, para que la entrada fluya de arriba a abajo.
const LAYOUT: Record<string, { area: string; size: "big" | "wide" | "sm"; order: number }> = {
  "cocina-y-bar": { area: "coc", size: "big", order: 1 },
  exterior: { area: "ext", size: "wide", order: 2 },
  "electrodomesticos-menores": { area: "ele", size: "sm", order: 3 },
  lavanderia: { area: "lav", size: "sm", order: 4 },
  wellness: { area: "wel", size: "wide", order: 5 },
  banos: { area: "ban", size: "big", order: 6 },
  "vapor-y-sauna": { area: "vap", size: "sm", order: 7 },
  minisplits: { area: "min", size: "sm", order: 8 },
  "recubrimientos-y-superficies": { area: "rec", size: "wide", order: 9 },
  "chimeneas-y-calentadores": { area: "chi", size: "wide", order: 10 },
};

/** Resumen corto de hijos para la cápsula (Sub1 en 3 niveles; leaves en 2 niveles).
 *  Los espacios internos de cada nombre se vuelven duros ( ) para que un
 *  nombre de varias palabras (p. ej. "Tarjas y Grifería") salte de línea como
 *  una sola unidad y no deje palabras sueltas; el corte solo ocurre en " · ". */
function resumenHijos(macro: Macrocategoria): string {
  const nombres = (macro.subcategorias1 ?? []).map((s) =>
    s.nombre.replace(/ /g, " ")
  );
  return nombres.slice(0, 4).join(" · ");
}

export default function MacroGrid({ macros }: { macros: Macrocategoria[] }) {
  return (
    <div className="cat-grid macro-grid reveal">
      {macros.map((macro) => {
        const foto = FOTO_MACRO[macro.slug];
        const layout = LAYOUT[macro.slug];
        const bg = foto
          ? {
              backgroundImage: `url('/assets/photos/${foto.src}')`,
              backgroundPosition: foto.pos ?? "center",
            }
          : undefined;
        const cellStyle = layout
          ? ({ gridArea: layout.area, "--d": `${(layout.order - 1) * 70}ms` } as CSSProperties)
          : undefined;
        const numero = layout ? String(layout.order).padStart(2, "0") : undefined;
        return (
          <Link
            key={macro.slug}
            className={`cat${layout ? ` cat--${layout.size}` : ""}`}
            href={macro.ruta}
            style={cellStyle}
          >
            <div className="cat-media" style={bg} />
            <div className="cat-cap">
              {numero && <span className="cat-num">· {numero}</span>}
              <h3>{macro.nombre}</h3>
              <span className="cat-brands">{resumenHijos(macro)}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
