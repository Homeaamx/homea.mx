// Página de marca: /marcas/<slug>.
//
// Una sola ruta para las 77 marcas (data/marcas.json). Cambia el logo, la foto,
// las categorías y las listas de precios; el armazón es el mismo para todas.
//
// El catálogo de productos todavía no existe (la tienda de Shopify sigue con
// contraseña), así que la rejilla enseña la misma maqueta que el PLP de
// /productos con salida a WhatsApp. En cuanto `productosDeMarca()` devuelva
// productos, las 77 páginas se llenan sin tocar este archivo.
//
// ⚠️ NO leer searchParams aquí: vuelve la página dinámica, sale del
// prerender-manifest y Vercel la sirve con no-store (ver el comentario de
// app/productos/[categoria]/[subcategoria]/[tipo]/page.tsx).

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import WhatsAppCta from "@/components/WhatsAppCta";
import { srcSet, SIZES_SANGRE } from "@/lib/imagenResponsiva";
import { rutaListaPrecios } from "@/lib/listasPrecios";
import {
  categoriasDeMarca,
  filtrosDeMarca,
  gamaDeMarca,
  listasDeMarca,
  marcaPorSlug,
  productosDeMarca,
  rutaMarca,
  todasLasMarcas,
  type Marca,
} from "@/lib/marcas";
import { SITE_URL } from "@/lib/site";

export const revalidate = 86400;
// Solo las marcas del registro: cualquier otro slug es 404.
export const dynamicParams = false;

interface Params {
  params: Promise<{ marca: string }>;
}

export function generateStaticParams() {
  return todasLasMarcas().map((m) => ({ marca: m.slug }));
}

/** "Bajo cubierta" → "bajo-cubierta" (mismo criterio que el PLP). */
function slug(v: string): string {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Frase de apoyo cuando la marca no tiene `descripcion` escrita a mano. */
function resumen(m: Marca): string {
  const cats = categoriasDeMarca(m).map((c) => c.nombre.toLowerCase());
  const lista =
    cats.length > 1 ? `${cats.slice(0, -1).join(", ")} y ${cats.at(-1)}` : (cats[0] ?? "equipamiento");
  return `Distribuidor oficial de ${m.nombre} en México: ${lista}. Asesoría de especificación, entrega en todo el país e instalación coordinada.`;
}

export default async function MarcaPage({ params }: Params) {
  const { marca: param } = await params;
  const marca = marcaPorSlug(param);
  if (!marca) notFound();

  const categorias = categoriasDeMarca(marca);
  const listas = listasDeMarca(marca);
  const filtros = filtrosDeMarca(marca);
  const productos = productosDeMarca(marca.slug);
  const gama = gamaDeMarca(marca);

  return (
    <>
      {/* El logo se normaliza a blanco sobre el hero oscuro con el mismo filtro
          que usan los tiles de /marcas (theme.css → .brandtile .bt-logo). */}
      <style>{`
        .marca-logo{max-height:84px;max-width:min(300px,62vw);width:auto;object-fit:contain;display:block;
          margin-bottom:22px;filter:brightness(0) invert(1) drop-shadow(0 2px 10px rgba(0,0,0,.45))}
        .marca-listas{margin:28px 0 0;padding:0;list-style:none;display:grid;gap:10px}
        .marca-cats{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px}
      `}</style>

      <header className="page-hero marcas-hero run">
        <img
          className="marcas-hero-bg"
          src={marca.foto}
          srcSet={srcSet(marca.foto)}
          sizes={SIZES_SANGRE}
          alt={`Equipamiento ${marca.nombre}`}
          fetchPriority="high"
          decoding="async"
        />
        <div className="container">
          <div className="crumbs">
            <Link href="/">Inicio</Link>
            <span className="sep">·</span>
            <Link href="/marcas">Marcas</Link>
            <span className="sep">·</span>
            <span aria-current="page">{marca.nombre}</span>
          </div>
          {/* alt vacío: el nombre ya va en el <h1>, el logo no aporta texto nuevo. */}
          <img className="marca-logo" src={marca.logo} alt="" width={300} height={84} />
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            {gama ? `${gama} · Distribución oficial` : "Distribución oficial"}
          </div>
          <h1>{marca.nombre}</h1>
          <p className="sub">{marca.descripcion ?? resumen(marca)}</p>
        </div>
      </header>

      {/* Categorías que cubre la marca + sus listas de precios. */}
      <section className="sec tight">
        <div className="container">
          {categorias.length > 0 && (
            <>
              <div className="eyebrow">Qué distribuimos de {marca.nombre}</div>
              <div className="marca-cats">
                {categorias.map((c) => (
                  <Link className="btn btn-ghost" key={c.ruta} href={c.ruta}>
                    {c.nombre}
                  </Link>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop: categorias.length > 0 ? 48 : 0 }}>
            <div className="eyebrow">Lista de precios</div>
            {listas.length > 0 ? (
              <ul className="marca-listas">
                {listas.map((d) => (
                  <li key={d.slug}>
                    {d.url ? (
                      <>
                        {/* URL permanente: sirve la edición vigente y no cambia
                            entre años (app/listas-de-precios/[archivo]/route.ts). */}
                        <a className="arrow-link" href={rutaListaPrecios(d)} target="_blank" rel="noopener">
                          ⬇ {d.titulo} <span className="ln" />
                          <span className="ar">→</span>
                        </a>
                        {d.vigencia && (
                          <>
                            {" "}
                            <span className="dot-sep">·</span>{" "}
                            <span className="caption">vigente {d.vigencia}</span>
                          </>
                        )}{" "}
                        <span className="dot-sep">·</span> <span className="caption">PDF</span>
                      </>
                    ) : (
                      <>
                        {d.titulo} <span className="dot-sep">·</span>{" "}
                        <span className="caption">Próximamente ·</span>{" "}
                        <WhatsAppCta
                          className="arrow-link"
                          label={`marca_${marca.slug}_lista`}
                          message={`¡Hola! Me interesa la lista de precios de ${marca.nombre}.`}
                        >
                          solicítala por WhatsApp <span className="ln" />
                          <span className="ar">→</span>
                        </WhatsAppCta>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ marginTop: 12, color: "var(--fg-muted)" }}>
                Todavía no publicamos la lista de {marca.nombre} en línea.{" "}
                <WhatsAppCta
                  className="arrow-link"
                  label={`marca_${marca.slug}_lista`}
                  message={`¡Hola! Me interesa la lista de precios de ${marca.nombre}.`}
                >
                  Pídela por WhatsApp <span className="ln" />
                  <span className="ar">→</span>
                </WhatsAppCta>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Catálogo de la marca: mismo armazón (filtros + rejilla) que /productos. */}
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
                  {productos.length} piezas en línea · {marca.nombre}
                </span>
                <select aria-label="Ordenar">
                  <option>Relevancia</option>
                  <option>Precio ↑</option>
                  <option>Precio ↓</option>
                  <option>Novedades</option>
                </select>
              </div>
              <div className="plp-grid">
                {/* Maqueta: se sustituye por los productos reales en cuanto
                    productosDeMarca() los devuelva (lib/marcas.ts). */}
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

                <div className="quote-card">
                  <div className="eyebrow eyebrow-bright">Proyecto de cocina</div>
                  <h3>
                    ¿Especificando con <i>{marca.nombre}</i>?
                  </h3>
                  <p>
                    Un especialista arma contigo el paquete: medidas, cargas eléctricas,
                    ventilación y paneles. Sin costo.
                  </p>
                  <Link className="arrow-link light" href="/contacto">
                    Cotizar con especialista <span className="ln" />
                    <span className="ar">→</span>
                  </Link>
                </div>
              </div>

              <p className="plp-aviso">
                Catálogo en migración: las piezas de {marca.nombre} están por publicarse.{" "}
                <WhatsAppCta
                  className="arrow-link"
                  label={`marca_${marca.slug}`}
                  message={`¡Hola! Me interesan los productos de ${marca.nombre}. ¿Me pueden asesorar?`}
                >
                  Pedir la lista por WhatsApp <span className="ln" />
                  <span className="ar">→</span>
                </WhatsAppCta>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec on-dark cta-band">
        <div className="glow" />
        <div className="container">
          <div className="inner">
            <div className="eyebrow eyebrow-bright">Showroom en Querétaro</div>
            <h2>
              Ve {marca.nombre} <i>en persona</i>.
            </h2>
            <Link className="btn btn-gold" href="/contacto">
              Agenda una visita
            </Link>
            <p>Atención personal, sin call centers.</p>
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Brand",
          name: marca.nombre,
          logo: `${SITE_URL}${marca.logo}`,
          url: `${SITE_URL}${rutaMarca(marca)}`,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Marcas", item: `${SITE_URL}/marcas` },
            {
              "@type": "ListItem",
              position: 3,
              name: marca.nombre,
              item: `${SITE_URL}${rutaMarca(marca)}`,
            },
          ],
        }}
      />
    </>
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { marca: param } = await params;
  const marca = marcaPorSlug(param);
  if (!marca) return {};
  return {
    title: `${marca.nombre} · Distribuidor oficial`,
    description: marca.descripcion ?? resumen(marca),
    alternates: { canonical: rutaMarca(marca) },
  };
}
