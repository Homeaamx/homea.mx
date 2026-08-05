// PLP de Subcategoría 2 (tipo de producto): /productos/<macro>/<sub1>/<tipo>.
//
// Es la página que en AJ Madison equivale a /refrigerators/: primero el mosaico
// visual de tipos (TipoGrid) para que el usuario reconozca lo que busca sin leer,
// y debajo el catálogo con los filtros de la tabla de filtros (lib/filtrosPlp).
//
// Vive en el front-end, no en Shopify: es una landing indexable bajo homea.mx y
// usa el sistema de diseño v2. Shopify aporta los productos vía Storefront API.

import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoute } from "@/lib/guias";
import { FILTROS_PLP, getFiltrosPlp } from "@/lib/filtrosPlp";
import { SITE_URL } from "@/lib/site";
import TipoGrid from "@/components/TipoGrid";
import ScrollAFiltros from "@/components/ScrollAFiltros";
import PlpFiltro from "@/components/PlpFiltro";
import JsonLd from "@/components/JsonLd";
import WhatsAppCta from "@/components/WhatsAppCta";

// ⚠️ La página NO lee searchParams en el servidor: hacerlo la vuelve dinámica
// (desaparece del prerender-manifest y Vercel la sirve con no-store, render por
// request). El filtro ?f= es estado de cliente — lo aplica PlpFiltro tras
// hidratar. Así las tres PLP quedan pre-generadas (SSG), que es lo que exige la
// regla de oro SEO del proyecto.
interface Params {
  params: Promise<{ categoria: string; subcategoria: string; tipo: string }>;
}

/** Foto del hero por PLP (misma familia visual que HERO_FOTO_SUB1 de Guías). */
const HERO_PLP: Record<string, { src: string; alt: string; pos?: string }> = {
  "cocina-y-bar/refrigeracion/refrigeradores": {
    src: "/assets/photos/hero-sub1-refrigeracion-subzero.jpg",
    alt: "Columnas de refrigeración Sub-Zero panelables en cocina premium",
    pos: "center 50%",
  },
  "cocina-y-bar/coccion/parrillas": {
    src: "/assets/photos/hero-sub1-coccion-pitt.jpg",
    alt: "Parrilla de quemadores submontados Pitt Cooking en cubierta de piedra",
    pos: "center 90%",
  },
  // El hero recorta ~46% del alto: centrado (50%) caía en la cubierta y dejaba
  // la campana fuera de cuadro. A 12% la banda abarca la campana completa y
  // alcanza a mostrar la isla debajo.
  "cocina-y-bar/coccion/campanas": {
    src: "/assets/photos/hero-sub1-coccion-campanas-isla.jpg",
    alt: "Campana de isla suspendida sobre la isla de una cocina contemporánea",
    pos: "center 12%",
  },
};

/** "Bajo cubierta" → "bajo-cubierta" (para casar valor de filtro ↔ ?f=). */
function slug(v: string): string {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Solo se generan los tipos que ya tienen filtros definidos en la tabla. */
export function generateStaticParams() {
  return Object.keys(FILTROS_PLP).map((clave) => {
    const [categoria, subcategoria, tipo] = clave.split("/");
    return { categoria, subcategoria, tipo };
  });
}

export default async function Page({ params }: Params) {
  const { categoria, subcategoria, tipo } = await params;
  const node = getRoute([categoria, subcategoria, tipo]);
  if (!node || node.kind !== "filtros") notFound();

  const { macro, sub1, sub2 } = node;
  const filtros = getFiltrosPlp(categoria, subcategoria, tipo);
  if (filtros.length === 0) notFound();

  const base = `/productos/${categoria}/${subcategoria}/${tipo}`;
  const hero = HERO_PLP[`${categoria}/${subcategoria}/${tipo}`];
  const tipos = sub2.filtros ?? [];
  const conFicha = tipos.filter((f) => f.ficha).length;
  // slug → nombre visible, para la etiqueta "tipo: X" que pinta PlpFiltro.
  const nombresPorSlug = Object.fromEntries(
    tipos
      .map((f) => [f.filtro.split("?f=")[1], f.nombre])
      .filter(([slug]) => Boolean(slug)),
  );

  return (
    <>
      <header className="subhero">
        <div className="subhero-bg">
          {hero && (
            <img
              src={hero.src}
              alt={hero.alt}
              style={{ objectPosition: hero.pos ?? "center 50%" }}
              fetchPriority="high"
            />
          )}
        </div>
        <div className="subhero-scrim" aria-hidden="true" />
        <div className="subhero-inner">
          <nav className="subhero-crumbs" aria-label="Migas de pan">
            <Link href="/">Inicio</Link>
            <span className="sep">·</span>
            <Link href={`/productos/${categoria}`}>{macro.nombre}</Link>
            <span className="sep">·</span>
            <Link href={`/productos/${categoria}/${subcategoria}`}>{sub1.nombre}</Link>
            <span className="sep">·</span>
            <span aria-current="page">{sub2.nombre}</span>
          </nav>
          <h1>{sub2.nombre}</h1>
          <span className="subhero-meta">
            <span className="it figures">{conFicha} tipos</span>{" "}
            <span className="dot">·</span> <span className="it">Asesoría sin costo</span>{" "}
            <span className="dot">·</span> <span className="it">Entrega en todo México</span>{" "}
            <span className="dot">·</span> <span className="it">Instalación coordinada</span>
          </span>
        </div>
      </header>

      <TipoGrid
        filtros={tipos}
        base={base}
        guia={sub2.rutaFiltros}
        contexto={sub2.nombre}
        etiquetas={sub2.etiquetasGrupos}
      />

      <PlpFiltro base={base} tipos={nombresPorSlug} />
      <Suspense fallback={null}>
        <ScrollAFiltros destino="catalogo" />
      </Suspense>

      <section className="sec tight" id="catalogo" style={{ paddingTop: 8 }}>
        <div className="container">
          <div className="plp">
            <aside className="filters">
              {filtros.map((f) => (
                <div className="fgroup" key={f.nombre}>
                  <h6>{f.nombre}</h6>
                  {f.control === "slider" ? (
                    <div className="fnote">Rango en MXN — se activa con el catálogo cargado.</div>
                  ) : f.valores ? (
                    f.valores.map((v) => (
                      <label key={v} data-tipo={slug(v)}>
                        {/* El check del tipo activo (?f=) lo pone PlpFiltro en
                            el cliente: el HTML estático es igual para todos. */}
                        <input type="checkbox" /> {v}
                      </label>
                    ))
                  ) : (
                    <div className="fnote">{f.nota}</div>
                  )}
                </div>
              ))}
            </aside>

            <div>
              <div className="toolbar">
                <span className="results figures">
                  0 piezas en línea · {conFicha} tipos
                  {/* "· tipo: X" lo pinta PlpFiltro según el ?f= de la URL. */}
                  <span id="plp-tipo-activo" />
                </span>
                <select aria-label="Ordenar">
                  <option>Relevancia</option>
                  <option>Precio ↑</option>
                  <option>Precio ↓</option>
                  <option>Novedades</option>
                </select>
              </div>
              <div className="plp-grid">
                {/* Placeholders: la plantilla del catálogo ya está armada; se
                    sustituyen por productos reales de Shopify cuando el catálogo
                    de refrigeradores esté cargado (ver PLAN-DE-FASES §Fase 4). */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <div className="pcard pcard--ph" key={i} aria-hidden="true">
                    <div className="imgw">
                      <span className="ph">
                        <span className="ph-inner">Producto</span>
                      </span>
                    </div>
                    <div className="body">
                      <span className="ph-line ph-line--sm" />
                      <span className="ph-line" />
                      <span className="ph-line ph-line--md" />
                      <span className="ph-line ph-line--sm" />
                    </div>
                  </div>
                ))}

                {/* Lead embebido: alto ticket → especialista. */}
                <div className="quote-card">
                  <div className="eyebrow eyebrow-bright">Proyecto de cocina</div>
                  <h3>
                    ¿Especificando una cocina <i>completa</i>?
                  </h3>
                  <p>
                    Un especialista arma contigo el paquete por marca: medidas, cargas
                    eléctricas, ventilación y paneles. Sin costo.
                  </p>
                  <Link className="arrow-link light" href="/contacto">
                    Cotizar con especialista <span className="ln" />
                    <span className="ar">→</span>
                  </Link>
                </div>
              </div>

              <p className="plp-aviso">
                Catálogo en migración: las piezas de {sub2.nombre.toLowerCase()} están
                por publicarse.{" "}
                <WhatsAppCta
                  className="arrow-link"
                  label={`plp_${tipo}`}
                  message={`¡Hola! Me interesan ${sub2.nombre.toLowerCase()}. ¿Me pueden asesorar?`}
                >
                  Pedir la lista por WhatsApp <span className="ln" />
                  <span className="ar">→</span>
                </WhatsAppCta>
              </p>
            </div>
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
            {
              "@type": "ListItem",
              position: 2,
              name: macro.nombre,
              item: `${SITE_URL}/productos/${categoria}`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: sub1.nombre,
              item: `${SITE_URL}/productos/${categoria}/${subcategoria}`,
            },
            {
              "@type": "ListItem",
              position: 4,
              name: sub2.nombre,
              item: `${SITE_URL}${base}`,
            },
          ],
        }}
      />
    </>
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { categoria, subcategoria, tipo } = await params;
  const node = getRoute([categoria, subcategoria, tipo]);
  if (!node || node.kind !== "filtros") return {};
  const { sub1, sub2 } = node;
  const url = `${SITE_URL}/productos/${categoria}/${subcategoria}/${tipo}`;
  const ejeEstilo = (sub2.etiquetasGrupos?.estilo ?? "Diseño").toLowerCase();
  return {
    title: `${sub2.nombre} · ${sub1.nombre}`,
    description: `${sub2.nombre} premium por tipo de instalación y ${ejeEstilo}. Asesoría de especificación y entrega en todo México.`,
    alternates: { canonical: url },
  };
}
