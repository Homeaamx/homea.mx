"use client";

// SiteHeader — barra superior + nav del sitio (portado del preview v2).
//  • GUÍAS enlaza a /guias/ y queda ACTIVO cuando la ruta empieza por /guias.
//  • Mega de Productos generado desde la taxonomía: macro → /guias/{macro}/ + leaves (CtaProducto).
//  • Estado .scrolled (fondo oscuro al hacer scroll) y toggle móvil.
//  Los destinos de producto (leaves, marcas) usan <CtaProducto>: nunca dan 404 con PLP_READY=false.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getMacros, leafFiltros } from "@/lib/guias";
import CtaProducto from "./CtaProducto";

const MARCAS = [
  "ACROS", "ALFA FORNI", "ALFRESCO", "AMERICAN STANDARD", "ARTISAN", "ASKO", "AXOR", "BERTAZZONI",
  "BLANCO", "BLAZE", "BOSCH", "BRIZO", "BROIL KING", "CAFE", "COVE", "COYOTE", "DELTA", "ELECTROLUX",
  "ELICA", "ELKAY", "FALMEC", "FRANKE", "FRIGIDAIRE", "FULGOR MILANO", "GAGGENAU", "GE PROFILE",
  "GESSI", "HANSGROHE", "HOSHIZAKI", "INSINKERATOR", "KAMADO JOE", "KITCHENAID", "LYNX", "MABE",
  "MAYTAG", "MIELE", "MOEN", "MONOGRAM", "PITT COOKING", "SCHOCK", "SCOTSMAN", "SMEG", "SUBZERO",
  "TEKA", "THERMADOR", "THOR", "U-LINE", "VIKING", "WHIRLPOOL", "WOLF", "WPPO",
];

function marcaSlug(m: string) {
  return m.toLowerCase().replace(/\s+/g, "-");
}

export default function SiteHeader() {
  const pathname = usePathname();
  const isGuias = pathname?.startsWith("/guias") ?? false;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const macros = getMacros();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cierra el menú móvil al navegar.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <div className="ubar">
        <div className="container">
          <a className="u-phone" href="tel:+524422163552" aria-label="Teléfono de oficina">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6.8 3.5h2.7l1.4 3.8-2 1.4a11.5 11.5 0 0 0 4.4 4.4l1.4-2 3.8 1.4v2.7a2 2 0 0 1-2.2 2A15.2 15.2 0 0 1 4.8 5.7a2 2 0 0 1 2-2.2Z" /></svg>
            Tel. oficina · (442) 216 3552
          </a>
          <span className="u-fx">Tipo de cambio · 1 USD = <strong>17.21</strong> MXN</span>
          <div className="u-right">
            <a href="#">Cuenta</a>
          </div>
        </div>
      </div>

      <nav className={`site-nav${scrolled ? " scrolled" : ""}${open ? " nav-open" : ""}`}>
        <div className="container">
          <Link className="brand" href="/" aria-label="Inicio">
            <img src="/assets/wordmark-black.png" alt="HOMEA Premium" />
          </Link>
          <button
            className="nav-toggle"
            type="button"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>

          <div className="nav-links">
            <div className="has-mega">
              <a href="#">Productos</a>
              <div className="mega-panel mega-guide" data-mega>
                <div className="mega-guide-head">
                  <span className="eyebrow">Explora por categoría</span>
                  <span className="mega-guide-note">Catálogo con filtros · próximamente</span>
                </div>
                <div className="mega-guide-cols">
                  {macros.map((macro) => {
                    const leaves = leafFiltros(macro).slice(0, 7);
                    return (
                      <div className="mega-guide-col" key={macro.slug}>
                        <Link className="mega-guide-cat" href={macro.ruta}>
                          {macro.nombre}
                        </Link>
                        {leaves.map((l) => (
                          <CtaProducto
                            key={l.filtro}
                            filtro={l.filtro}
                            className="mega-guide-leaf"
                            fallback="whatsapp"
                          >
                            {l.nombre}
                          </CtaProducto>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="has-mega has-mega--brands">
              <a href="#">Marcas</a>
              <div className="mega-panel mega-brands">
                <div className="mega-brands-head">
                  <span className="eyebrow">Marcas oficiales · A–Z</span>
                </div>
                <div className="mega-brands-cols" role="list">
                  {MARCAS.map((m) => (
                    <CtaProducto key={m} filtro={`/productos/?marca=${marcaSlug(m)}`} fallback="whatsapp">
                      {m}
                    </CtaProducto>
                  ))}
                </div>
              </div>
            </div>

            <a href="#">Proyectos</a>
            <a href="#">Ofertas</a>
            <Link href="/guias/" className={isGuias ? "is-active" : undefined} aria-current={isGuias ? "page" : undefined}>
              Guías
            </Link>
          </div>

          <div className="nav-right">
            <a href="#">Herramientas</a>
            <a href="#">Showroom</a>
            <a className="nav-search" href="#" aria-label="Buscar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></svg>
            </a>
          </div>
          <a className="btn btn-ghost" href="#">Wishlist</a>
        </div>
      </nav>
    </>
  );
}
