// Página de marca: /marcas/<slug>.
//
// Una sola ruta para todas las marcas (data/marcas.json). Cambia el logo, la foto,
// las categorías y las listas de precios; el armazón es el mismo para todas.
//
// Dos canales (marca.canal, decisión de Carla 2026-09-21):
//   - "shopify": hero y directo al catálogo con filtros (Shopify), sin bloque de
//     categorías ni listas de precios (Carla, 2026-09-22).
//   - "pdf": solo el hero (su PDF en el botón) y el cierre "Conocer más sobre
//     <marca>" hacia WhatsApp (Carla, 2026-10-21). Sin listado ni filtros: la
//     marca no se sube a Shopify, la página existe por SEO.
//
// Sin foto o sin logo (marcas recién dadas de alta) el hero cae a fondo oscuro
// con el nombre: nunca una imagen rota.
//
// Catálogo vivo (2026-10-13): las marcas "shopify" traen sus piezas publicadas
// por Vendor desde la Storefront API (`productosDeMarca`, lib/shopify/catalogoVivo.ts)
// con el mismo panel de filtros, tarjetas y orden que las páginas de /productos.
// Una marca que todavía no tiene piezas en Shopify enseña la maqueta con salida
// a WhatsApp; en cuanto se cargue, su página se llena sola.
//
// ⚠️ NO leer searchParams aquí: vuelve la página dinámica, sale del
// prerender-manifest y Vercel la sirve con no-store (ver el comentario de
// app/productos/[categoria]/[subcategoria]/[tipo]/page.tsx).

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import WhatsAppCta from "@/components/WhatsAppCta";
import { mensajeAsesoria } from "@/lib/whatsapp";
import { anchoImagen, srcSet, SIZES_SANGRE } from "@/lib/imagenResponsiva";
import {
  categoriasDeMarca,
  filtrosDeMarca,
  gamaDeMarca,
  heroDeMarca,
  marcaPorSlug,
  rutaMarca,
  todasLasMarcas,
  type Marca,
} from "@/lib/marcas";
import { productosDeMarca } from "@/lib/shopify/catalogoVivo";
import { tilesPresentes } from "@/lib/shopify/coleccionesWeb";
import { conteoHtml, panelFiltrosHtml, rejillaHtml } from "@/lib/shopify/htmlCatalogo";
import { SITE_URL } from "@/lib/site";
import { obtenerTipoCambio } from "@/lib/tipoCambio";

// ISR — una hora: la rejilla trae precios y productos vivos de Shopify.
export const revalidate = 3600;
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

  const filtros = filtrosDeMarca(marca);
  const gama = gamaDeMarca(marca);
  const enPdf = marca.canal === "pdf";
  // Piezas publicadas en Shopify con el Vendor = nombre oficial de la marca.
  // Las "pdf" no consultan nada: su página existe por SEO y cierra por WhatsApp.
  const productos = enPdf ? [] : await productosDeMarca(marca.nombre);
  const tc = productos.length ? await obtenerTipoCambio() : null;
  // Contenido del hero por marca (data/marcas-hero.json). Sin entrada, el de siempre.
  const hero = heroDeMarca(marca);
  // Foto de hero de menos de 1100 px: a sangre completa se notan los pixeles, así
  // que se suaviza y se oscurece más con una sombra (styles/theme.css → --suave).
  // Automático: en cuanto llega una foto más grande, el efecto se quita solo.
  const heroSuave = !!marca.fotoHero && (anchoImagen(marca.fotoHero) ?? 0) < 1100;

  return (
    <>
      {/* El logo se normaliza a blanco sobre el hero oscuro con el mismo filtro
          que usan los tiles de /marcas (theme.css → .brandtile .bt-logo). */}
      <style>{`
        .marca-logo{max-height:84px;max-width:min(300px,62vw);width:auto;object-fit:contain;display:block;
          margin-bottom:22px;filter:brightness(0) invert(1) drop-shadow(0 2px 10px rgba(0,0,0,.45))}
      `}</style>

      <header
        className={`page-hero marcas-hero run${hero ? " marcas-hero--contenido" : ""}${heroSuave ? " marcas-hero--suave" : ""}`}
      >
        {marca.fotoHero && (
          <img
            className="marcas-hero-bg"
            src={marca.fotoHero}
            srcSet={srcSet(marca.fotoHero)}
            sizes={SIZES_SANGRE}
            // Ajustes por marca (data/marcas-hero.json → imagen): espejo y encuadre.
            style={
              {
                ...(hero?.imagen?.espejo === false ? { "--espejo": 1 } : {}),
                ...(hero?.imagen?.posicion ? { objectPosition: hero.imagen.posicion } : {}),
                ...(hero?.imagen?.zoom ? { "--zoom": hero.imagen.zoom } : {}),
                ...(hero?.imagen?.origen ? { "--origen": hero.imagen.origen } : {}),
              } as React.CSSProperties
            }
            alt={hero ? `${hero.titulo}, distribuidor oficial en México` : `Equipamiento ${marca.nombre}`}
            fetchPriority="high"
            decoding="async"
          />
        )}
        <div className="container">
          <div className="crumbs">
            <Link href="/">Inicio</Link>
            <span className="sep">·</span>
            <Link href="/marcas">Marcas</Link>
            <span className="sep">·</span>
            <span aria-current="page">{marca.nombre}</span>
          </div>
          {/* alt vacío: el nombre ya va en el <h1>, el logo no aporta texto nuevo. */}
          {marca.logoHero && (
            <img
              className="marca-logo"
              src={marca.logoHero}
              alt=""
              width={300}
              height={84}
              style={
                hero?.logoEscala
                  ? ({
                      "--logo-escala": hero.logoEscala,
                    } as React.CSSProperties)
                  : undefined
              }
            />
          )}
          {hero ? (
            <div className="marca-hero-texto">
              <div className="eyebrow">{hero.eyebrow}</div>
              <h1>{hero.titulo}</h1>
              <p className="sub">{hero.descripcion}</p>
              {hero.cta && (
                <div className="marca-hero-cta">
                  {hero.cta.url ? (
                    <a className="btn btn-gold" href={hero.cta.url} target="_blank" rel="noopener">
                      {hero.cta.texto}
                    </a>
                  ) : (
                    // El PDF oficial todavía no está en Shopify Files: mientras tanto
                    // el mismo botón pide el catálogo por WhatsApp.
                    <WhatsAppCta
                      className="btn btn-gold"
                      label={`marca_${marca.slug}_catalogo`}
                      message={
                        enPdf
                          ? mensajeAsesoria(marca.nombre)
                          : `¡Hola! Me interesa el catálogo oficial de ${marca.nombre}.`
                      }
                    >
                      {hero.cta.texto}
                    </WhatsAppCta>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="eyebrow" style={{ marginBottom: 18 }}>
                {gama ? `${gama} · Distribución oficial` : "Distribución oficial"}
              </div>
              <h1>{marca.nombre}</h1>
              <p className="sub">{marca.descripcion ?? resumen(marca)}</p>
            </>
          )}
        </div>
      </header>

      {/* Catálogo de la marca: mismo armazón (filtros + rejilla) que /productos.
          Solo marcas "shopify"; las "pdf" no tienen productos en Shopify. */}
      {!enPdf && (
        <section className="sec tight" id="catalogo">
          <div className="container">
            <div className="plp">
              {productos.length && tc ? (
                <aside
                  className="filters"
                  // Filtros con los valores reales de Shopify (filtros.*) de los
                  // tipos que la marca tiene publicados, más Subcategoría y Tipo de
                  // producto; public/catalogo.js filtra las tarjetas en el cliente.
                  dangerouslySetInnerHTML={{
                    __html: panelFiltrosHtml(productos, {
                      tc,
                      conCategoria: true,
                      conTipo: true,
                      tiposRiel: tilesPresentes(productos),
                      sinMarca: true,
                    }),
                  }}
                />
              ) : (
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
              )}

              <div>
                <div className="toolbar">
                  <span className="results figures">
                    {productos.length ? conteoHtml(productos) : "0 piezas en línea"} · {marca.nombre}
                  </span>
                  <select aria-label="Ordenar">
                    <option value="precio-desc">Precio: mayor a menor ↓</option>
                    <option value="precio-asc">Precio: menor a mayor ↓</option>
                    <option value="stock-primero">Inventario: de stock a bajo pedido</option>
                    <option value="pedido-primero">Inventario: de bajo pedido a stock</option>
                  </select>
                </div>
                {productos.length && tc ? (
                  <div className="plp-grid" dangerouslySetInnerHTML={{ __html: rejillaHtml(productos, tc) }} />
                ) : (
                  <>
                    <div className="plp-grid">
                      {/* Maqueta mientras la marca no tenga piezas publicadas en Shopify. */}
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
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="sec on-dark cta-band">
        <div className="glow" />
        <div className="container">
          <div className="inner">
            {/* Marcas "pdf": después del hero solo este cierre, que lleva a un
                experto por WhatsApp (Carla, 2026-10-21). */}
            {enPdf ? (
              <>
                <div className="eyebrow eyebrow-bright">Conoce más sobre tus marcas favoritas</div>
                <h2>
                  Conocer más sobre <i>{marca.nombre}</i>.
                </h2>
                <WhatsAppCta
                  className="btn btn-gold"
                  label={`marca_${marca.slug}_asesoria`}
                  message={mensajeAsesoria(marca.nombre)}
                >
                  Hablar con un experto
                </WhatsAppCta>
                <p>Atención personal. Sin call centers.</p>
              </>
            ) : (
              <>
                <div className="eyebrow eyebrow-bright">Showroom en Querétaro</div>
                <h2>
                  Ve {marca.nombre} <i>en persona</i>.
                </h2>
                <Link className="btn btn-gold" href="/contacto">
                  Agenda una visita
                </Link>
                <p>Atención personal, sin call centers.</p>
              </>
            )}
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Brand",
          name: marca.nombre,
          ...(marca.logo ? { logo: `${SITE_URL}${marca.logo}` } : {}),
          url: `${SITE_URL}${rutaMarca(marca)}`,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Inicio",
              item: `${SITE_URL}/`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Marcas",
              item: `${SITE_URL}/marcas`,
            },
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
