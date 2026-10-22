// GuiasPortada — portada de una Subcategoría 1 en Guías (Carla, 2026-10-19;
// primero Refrigeración): hero partido (texto sobre bone · foto a la derecha) y
// rejilla de tarjetas, una por tipo de producto (Subcategoría 2), con su foto,
// ícono de línea, resumen y flecha. Las guías del blog van abajo, en su propia
// sección (page.tsx). Se activa cuando todas las Subcategorías 2 traen `tarjeta`.

import Image from "next/image";
import Link from "next/link";
import type { Crumb } from "@/lib/guias";
import { TIPOS_WEB } from "@/lib/shopify/coleccionesWeb";
import { conPaginaFichas } from "@/lib/paginaFichas";
import type { Subcategoria2 } from "@/types/guias";
import Breadcrumb from "./Breadcrumb";
import CtaProducto from "./CtaProducto";
import DestinoBusqueda from "./DestinoBusqueda";

/** Íconos de línea por tipo (24×24, trazo). Sin ícono propio → refrigerador. */
const ICONOS: Record<string, React.ReactNode> = {
  refrigeradores: (
    <>
      <rect x="6" y="2.5" width="12" height="19" rx="1" />
      <path d="M6 10h12M9 5.5v2.5M9 12.5v4" />
    </>
  ),
  congeladores: (
    <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 6.5l2.5-2M9.5 19.5 12 17.5l2.5 2M4.6 10.6l2.9-1.2-.5-3M19.4 13.4l-2.9 1.2.5 3M4.6 13.4l2.9 1.2-.5 3M19.4 10.6l-2.9-1.2.5-3" />
  ),
  "centros-de-bebida": (
    <>
      <path d="M10 2.5h4v3.2l1.6 2.8v13h-7.2v-13L10 5.7z" />
      <path d="M8.4 12h7.2M8.4 17h7.2" />
    </>
  ),
  frigobares: (
    <>
      <rect x="5" y="5" width="14" height="15" rx="1" />
      <rect x="7.5" y="7.5" width="9" height="9.5" />
      <path d="M5 4v1M19 4v1M8 20v1.2M16 20v1.2" />
    </>
  ),
  "maquinas-de-hielo": (
    <>
      <path d="M12 3.5l7 4v8l-7 4-7-4v-8z" />
      <path d="M5 7.5l7 4 7-4M12 11.5v8" />
    </>
  ),
  "cavas-de-vino": (
    <>
      <path d="M8 3h8c0 5.2-1.6 8.5-4 8.5S8 8.2 8 3z" />
      <path d="M8.3 6.5h7.4M12 11.5V20M8.5 20.5h7" />
    </>
  ),
  "cajones-refrigerantes": (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <path d="M4 12h16M10 7.5h4M10 15.5h4" />
    </>
  ),
  // Cocción (2026-10-20)
  estufas: (
    <>
      <rect x="3.5" y="7" width="17" height="14" rx="1" />
      <path d="M3.5 11h17M7 4.5v2.5M12 4.5v2.5M17 4.5v2.5M7.5 14.5h9v4h-9z" />
    </>
  ),
  parrillas: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="1" />
      <circle cx="8" cy="10" r="2.6" />
      <circle cx="16" cy="10" r="2.6" />
      <circle cx="12" cy="15.5" r="1.8" />
    </>
  ),
  hornos: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="1" />
      <path d="M3.5 8h17M7 5.8h1M10 5.8h1M7 11h10v6.5H7z" />
    </>
  ),
  microondas: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="1" />
      <rect x="5" y="8.5" width="10.5" height="7" />
      <path d="M18.5 9v1M18.5 12v1M18.5 15v.5" />
    </>
  ),
  campanas: (
    <>
      <path d="M10 3h4v7h-4z" />
      <path d="M10 10 4 16.5h16L14 10" />
      <path d="M4 16.5h16v2H4zM8 20.5v.5M12 20.5v.5M16 20.5v.5" />
    </>
  ),
  cajones: (
    <>
      <rect x="3" y="7" width="18" height="10" rx="1" />
      <path d="M9 10.5h6" />
    </>
  ),
  "cafeteras-empotrables": (
    <>
      <rect x="4" y="3.5" width="16" height="17" rx="1" />
      <path d="M4 8h16M10.5 8v3h3V8M9 15.5h6l-.6 3H9.6z" />
    </>
  ),
  "accesorios-coccion": (
    <>
      <path d="M3 11h12a6 6 0 0 1-12 0z" />
      <path d="M15 11.5 21 9" />
    </>
  ),
  // Lavavajillas
  "lavavajillas-empotrable": (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M4 7h16M9.5 9.5h5M7 5h1" />
    </>
  ),
  "lavavajillas-de-piso": (
    <>
      <rect x="4" y="3" width="16" height="17" rx="1" />
      <path d="M4 7h16M9.5 9.5h5M7 5h1M6 20v1.2M18 20v1.2" />
    </>
  ),
  // Tarjas y Grifería
  tarjas: (
    <>
      <rect x="2.5" y="7" width="19" height="11" rx="1" />
      <rect x="5" y="9.5" width="14" height="6" rx="1" />
      <circle cx="12" cy="12.5" r=".9" />
    </>
  ),
  griferia: <path d="M8 21v-9a5 5 0 0 1 10 0v2M5 21h6M8 7h-3M18 14v1.5" />,
  "monomandos-de-agua-filtrada": (
    <>
      <path d="M8 21v-9a5 5 0 0 1 10 0v2M5 21h6M18 14v1.5" />
      <path d="M17.5 18.5c0 1-.7 1.7-1.5 1.7s-1.5-.7-1.5-1.7c0-.9 1.5-2.5 1.5-2.5s1.5 1.6 1.5 2.5z" />
    </>
  ),
  "accesorios-tarjas-griferia": (
    <>
      <rect x="4" y="6" width="16" height="12" rx="1.5" />
      <path d="M8 9v6M12 9v6M16 9v6" />
    </>
  ),
  // Trituradores
  trituradores: (
    <>
      <path d="M8 3h8v3H8zM6.5 6h11v10a5.5 5.5 0 0 1-11 0z" />
      <path d="M9.5 10l5 4M14.5 10l-5 4" />
    </>
  ),
  // Purificadores y despachadores de agua
  "purificadores-de-agua": (
    <path d="M12 3c3.5 4.4 6 7.7 6 11a6 6 0 0 1-12 0c0-3.3 2.5-6.6 6-11zM9 15a3 3 0 0 0 3 3" />
  ),
  "despachadores-de-agua": (
    <>
      <path d="M9.5 2.5h5v4h-5zM8 6.5h8v3H8z" />
      <rect x="6" y="9.5" width="12" height="12" rx="1" />
      <path d="M10 14h4M12 14v2.5" />
    </>
  ),
  // Exterior · Asadores & Hornos (2026-10-20)
  "asadores-empotrables": (
    <>
      <path d="M3 10h18v3H3zM4.5 13v7.5h15V13M8 16.5h8" />
      <path d="M6 10V7.5a6 6 0 0 1 12 0V10" />
    </>
  ),
  "asadores-con-carrito": (
    <>
      <path d="M5 9h14v4H5zM5 9a7 3.5 0 0 1 14 0" />
      <path d="M7 13v7M17 13v7M7 17h10M2.5 11H5M19 11h2.5" />
      <circle cx="7" cy="20.5" r=".8" />
      <circle cx="17" cy="20.5" r=".8" />
    </>
  ),
  "hornos-de-pizza": (
    <>
      <path d="M3 18a9 9 0 0 1 18 0z" />
      <path d="M9 18v-3a3 3 0 0 1 6 0v3M10.5 6.5V3h3v3.8M2 18h20" />
    </>
  ),
  "accesorios-asadores": (
    <>
      <path d="M4 20 13 11M13 11l2-5 3 3-5 2z" />
      <path d="M14 20l7-7M19 15l1.5 1.5" />
    </>
  ),
  // Electrodomésticos menores
  licuadoras: (
    <>
      <path d="M7 3h10l-1.5 11h-7z" />
      <path d="M8.5 14h7l1 3.5h-9zM7.5 17.5h9V21h-9zM12 18.5v1" />
    </>
  ),
  batidoras: (
    <>
      <path d="M6 21h12M8 21v-6M8 15h4l3-6H6v3" />
      <path d="M6 6.5a3 3 0 0 1 3-3h7l2 5.5h-3" />
      <path d="M12 15a4 4 0 0 0 4 4" />
    </>
  ),
  tostadoras: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="3" />
      <path d="M8 8V5.5M16 8V5.5M18 13h3M7 16h6" />
    </>
  ),
  exprimidores: (
    <>
      <path d="M6 12h12l-1.5 8.5h-9z" />
      <path d="M8 12a4 4 0 0 1 8 0M12 6.5V8M10 9l1 1M14 9l-1 1" />
    </>
  ),
  cafeteras: (
    <>
      <path d="M5 3h14v5H5zM7 8v8h10V8" />
      <path d="M9.5 16h5v2.5h-5zM4 21h16M12 10.5v2" />
    </>
  ),
  "accesorios-cocina-pequenos": (
    <>
      <path d="M6 9h9v8a4 4 0 0 1-4 4h-1a4 4 0 0 1-4-4z" />
      <path d="M15 11h2a2 2 0 0 1 0 4h-2M9 9V6.5a1.5 1.5 0 0 1 3 0V9" />
    </>
  ),
  "accesorios-refrigeracion": (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M5.5 18.5l2.1-2.1M16.4 7.6l2.1-2.1" />
      <circle cx="12" cy="12" r="6.2" />
    </>
  ),
};

function Icono({ slug }: { slug: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONOS[slug] ?? ICONOS.refrigeradores}
    </svg>
  );
}

/** Lo que la portada necesita de un tipo: una Subcategoría 2 (Cocina y Bar,
 *  Exterior) o un leaf de Subcategoría 1 (macros de 2 niveles: Menores). */
type TipoPortada = Pick<Subcategoria2, "nombre" | "slug" | "tarjeta" | "tienda" | "rutaFiltros"> & {
  filtro?: string;
  filtros?: unknown[];
};

function Tarjeta({ s, filtraBlog }: { s: TipoPortada; filtraBlog?: boolean }) {
  const cuerpo = (
    <>
      <span className={s.tarjeta!.ambiente ? "gx-card-media gx-card-media--ambiente" : "gx-card-media"}>
        <Image
          src={s.tarjeta!.imagen}
          alt={s.nombre}
          width={640}
          height={640}
          sizes="(max-width: 560px) 70vw, (max-width: 1100px) 60vw, 460px"
          style={s.tarjeta!.pos ? { objectPosition: s.tarjeta!.pos } : undefined}
        />
      </span>
      <span className="gx-card-ico">
        <Icono slug={s.slug} />
      </span>
      <span className="gx-card-body">
        <h3 className="gx-card-name">{s.nombre}</h3>
        <span className="gx-card-sum">{s.tarjeta!.resumen}</span>
        <span className="gx-card-arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" />
          </svg>
        </span>
      </span>
    </>
  );
  // Con varios filtros → su página de fichas; si no, su página de la tienda
  // (`tienda` de la taxonomía o coleccionesWeb); sin ninguna, CtaProducto (cae a WhatsApp).
  const conFichas = conPaginaFichas(s);
  const destino = conFichas ? s.rutaFiltros! : (s.tienda ?? TIPOS_WEB.find((t) => t.slugRiel === s.slug)?.ruta);
  // Sin página de fichas (todas las de Menores; Frigobares, Hornos de pizza…):
  // la tarjeta filtra el Blog de abajo (BlogTemas escucha `data-tema-guia`) y el
  // Blog ofrece "Ver productos en tienda"; sin JS baja al Blog.
  if (filtraBlog && !conFichas) {
    return (
      <a id={`tipo-${s.slug}`} href="#blog" className="gx-card" data-tema-guia={s.slug} aria-pressed="false">
        {cuerpo}
      </a>
    );
  }
  return destino ? (
    <Link id={`tipo-${s.slug}`} href={destino} className="gx-card">
      {cuerpo}
    </Link>
  ) : (
    <CtaProducto id={`tipo-${s.slug}`} filtro={s.filtro ?? ""} className="gx-card" fallback="whatsapp">
      {cuerpo}
    </CtaProducto>
  );
}

interface Props {
  crumbs: Crumb[];
  /** Nombre de la Subcategoría 1 (p.ej. "Refrigeración"). */
  nombre: string;
  tipos: TipoPortada[];
  /** `flip`: espejo horizontal, para que el aparato quede del lado de la foto. */
  foto: { src: string; pos?: string; flip?: boolean };
  /** Buscador acotado a la subcategoría (GuiaSearch). */
  buscador?: React.ReactNode;
  /** Las tarjetas sin página de fichas eligen categoría en el Blog (BlogTemas). */
  filtraBlog?: boolean;
}

export default function GuiasPortada({ crumbs, nombre, tipos, foto, buscador, filtraBlog }: Props) {
  return (
    <>
      <header className="gx-hero">
        <div className="gx-hero-foto">
          <Image src={foto.src} alt="" fill priority sizes="(max-width: 900px) 100vw, 58vw" style={{ objectFit: "cover", objectPosition: foto.pos ?? "center", transform: foto.flip ? "scaleX(-1)" : undefined }} />
        </div>
        <div className="container gx-hero-in">
          <Breadcrumb crumbs={crumbs} />
          <p className="eyebrow">Guías HOMEA · {nombre}</p>
          <h1>
            Encuentra la guía de {nombre.toLowerCase()} <i>que necesitas</i>
          </h1>
          <p className="gx-hero-sub">
            {/* "tus tarjas…", "tus electrodomésticos…": plural si la primera palabra lo es. */}
            Información clara y visual para ayudarte a elegir, especificar e integrar {/^\S+s\b/i.test(nombre) ? "tus" : "tu"}{" "}
            {nombre.toLowerCase()} en cualquier proyecto.
          </p>
          {buscador}
        </div>
      </header>

      <section className="sec gx-cats">
        {/* Llegada desde el buscador de otra página de Guías (#tipo-<slug>). */}
        <DestinoBusqueda />
        <div className="container">
          <div className="gx-cats-head">
            <p className="eyebrow">Explora por categoría</p>
            <p className="gx-cats-n">
              {tipos.length} {tipos.length === 1 ? "categoría" : "categorías"}
            </p>
          </div>
          <div className="gx-grid">
            {tipos.map((s) => (
              <Tarjeta key={s.slug} s={s} filtraBlog={filtraBlog} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
