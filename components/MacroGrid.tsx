// MacroGrid — grid de las 10 macrocategorías (estilo "Navegar por categoría" del home).
// Cada tarjeta enlaza a /guias/{macro}/.

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

/** Resumen corto de hijos para la cápsula (Sub1 en 3 niveles; leaves en 2 niveles). */
function resumenHijos(macro: Macrocategoria): string {
  const nombres = (macro.subcategorias1 ?? []).map((s) => s.nombre);
  return nombres.slice(0, 4).join(" · ");
}

export default function MacroGrid({ macros }: { macros: Macrocategoria[] }) {
  return (
    <div className="cat-grid macro-grid">
      {macros.map((macro) => {
        const foto = FOTO_MACRO[macro.slug];
        const bg = foto
          ? {
              backgroundImage: `url('/assets/photos/${foto.src}')`,
              backgroundPosition: foto.pos ?? "center",
            }
          : undefined;
        return (
          <Link key={macro.slug} className="cat" href={macro.ruta}>
            <div className="cat-media" style={bg} />
            <div className="cat-cap">
              <h3>{macro.nombre}</h3>
              <span className="cat-brands">{resumenHijos(macro)}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
