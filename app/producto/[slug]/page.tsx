import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import MarketingPage from "@/components/MarketingPage";
import { productoPorSku } from "@/lib/catalogo";
import { getMain, getTitle, productoFile, productoSlugs } from "@/lib/preview";
import {
  precioPublico,
  productoVivoPorSku,
  productosDeColeccion,
  type PrecioPublico,
  type ProductoVivo,
} from "@/lib/shopify/catalogoVivo";
import { TIPOS_WEB, tipoWeb } from "@/lib/shopify/coleccionesWeb";
import { fichaHtml, type Relacionados } from "@/lib/shopify/htmlCatalogo";
import { coleccionesCandidatas, sugerenciasDeCompra } from "@/lib/shopify/sugerencias";
import { contenidoDeFicha, jsonLdProducto } from "@/lib/shopify/pdpSlots";
import { absUrl } from "@/lib/site";
import { obtenerTipoCambio } from "@/lib/tipoCambio";

// ISR — una hora: la ficha trae precio y tipo de cambio vivos.
export const revalidate = 3600;
// Dos orígenes de ficha:
//   1. Las 5 del piloto, con su HTML curado del preview (producto-<slug>.html).
//   2. Cualquier producto publicado en Shopify (canal Headless): la ficha se arma
//      con sus datos (lib/shopify/htmlCatalogo.ts). Las que no se generaron en el
//      build se crean al primer visitante y quedan en caché (ISR on-demand), que
//      es como escala a ~16k productos sin construirlos todos de golpe.
export const dynamicParams = true;

interface Params {
  slug: string;
}

/** Prerender: las del piloto + las de las colecciones con catálogo vivo. */
export async function generateStaticParams(): Promise<Params[]> {
  const slugs = new Set(productoSlugs());
  const listas = await Promise.all(TIPOS_WEB.map((t) => productosDeColeccion(t.coleccion)));
  for (const p of listas.flat()) slugs.add(p.slug);
  return [...slugs].map((slug) => ({ slug }));
}

/** El slug de la ficha ES el SKU en minúsculas (scripts/build-search-index.mjs). */
const skuDeSlug = (slug: string) => slug.toUpperCase();

/** Un slug válido es un modelo: letras, números y guiones. Lo demás ni se consulta. */
const slugValido = (slug: string) => /^[a-z0-9-]{3,40}$/.test(slug);

/** El gancho de una línea de la ficha; sirve de descripción en metadatos y JSON-LD. */
function ganchoDeFicha(file: string): string | null {
  const encontrado = getMain(file).match(/<p class="lead-serif">([\s\S]*?)<\/p>/);
  return encontrado ? encontrado[1].replace(/<[^>]+>/g, "").trim() : null;
}

function descripcionVivo(p: ProductoVivo): string {
  if (p.lead) return p.lead;
  const tw = tipoWeb(p.tipo);
  return `${p.titulo} de ${p.marca} (modelo ${p.sku}). ${p.tipo}${tw ? ` · ${tw.sub1.nombre}` : ""}. Asesoría de especificación, entrega e instalación coordinada en todo México.`;
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await props.params;
  if (productoSlugs().includes(slug)) {
    const file = productoFile(slug);
    const gancho = ganchoDeFicha(file);
    return {
      title: getTitle(file),
      ...(gancho ? { description: gancho } : {}),
      alternates: { canonical: `/producto/${slug}` },
    };
  }
  if (!slugValido(slug)) return {};
  const p = await productoVivoPorSku(skuDeSlug(slug));
  if (!p) return {};
  const imagen = p.imagenes[0];
  return {
    title: `${p.titulo} · ${p.marca} ${p.sku}`,
    description: descripcionVivo(p),
    alternates: { canonical: `/producto/${slug}` },
    ...(imagen ? { openGraph: { images: [{ url: imagen.url, alt: imagen.alt }] } } : {}),
  };
}

/** JSON-LD con el mismo precio y disponibilidad que ve el visitante. */
function jsonLdVivo(p: ProductoVivo, precio: PrecioPublico, url: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.titulo,
    sku: p.sku,
    mpn: p.sku,
    brand: { "@type": "Brand", name: p.marca },
    ...(p.imagenes.length ? { image: p.imagenes.slice(0, 4).map((i) => i.url) } : {}),
    description: descripcionVivo(p),
    category: p.tipo,
    offers: {
      "@type": "Offer",
      priceCurrency: precio.moneda,
      // Con IVA: es el precio que se publica. "Bajo pedido" es PreOrder, no
      // OutOfStock (marcarlo agotado apaga los resultados enriquecidos).
      price: precio.venta.toFixed(2),
      availability: p.enStock ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      url,
      seller: { "@type": "Organization", name: "HOMEA" },
    },
  };
}

/**
 * Productos relacionados de la ficha (regla de Carla, 2026-10-08): primero las
 * sugerencias de compra del catálogo (accesorios, kits, campanas…, ver
 * lib/shopify/sugerencias.ts); si no hay ninguna, tres similares del mismo tipo.
 */
async function relacionadosDe(p: ProductoVivo): Promise<Relacionados> {
  const tw = tipoWeb(p.tipo);
  if (!tw) return { modo: "similares", productos: [] };
  const handles = coleccionesCandidatas(tw.sub1.ruta, p.tipo);
  const [mismoTipo, ...otras] = await Promise.all([
    productosDeColeccion(tw.coleccion),
    ...handles.map((h) => productosDeColeccion(h)),
  ]);
  const sugeridos = sugerenciasDeCompra(p, otras.flat());
  if (sugeridos.length) return { modo: "sugerencias", productos: sugeridos };
  return {
    modo: "similares",
    productos: mismoTipo.filter((r) => r.sku !== p.sku && r.imagenes.length).slice(0, 3),
  };
}

export default async function ProductoFichaPage(props: { params: Promise<Params> }) {
  const { slug } = await props.params;
  const sku = skuDeSlug(slug);
  const esPiloto = productoSlugs().includes(slug);
  if (!esPiloto && !slugValido(slug)) notFound();

  const vivo = await productoVivoPorSku(sku);
  const url = absUrl(`/producto/${slug}`);

  // 1. Las 5 del piloto: MISMO formato que el resto del catálogo vivo (Carla,
  //    2026-10-08: galería, pestañas, fichas técnicas, sugerencias). Del HTML
  //    curado del preview solo sobrevive el gancho, por si Shopify no trae lead.
  //    El preview completo queda como respaldo cuando Shopify no contesta.
  if (esPiloto && !vivo) {
    const file = productoFile(slug);
    const indexado = productoPorSku(sku);
    const { slots, datos } = await contenidoDeFicha(sku);
    return (
      <>
        <MarketingPage file={file} slots={slots} />
        {datos && indexado ? (
          <JsonLd data={jsonLdProducto(datos, indexado, url, ganchoDeFicha(file) ?? indexado.titulo)} />
        ) : null}
      </>
    );
  }
  if (vivo && esPiloto && !vivo.lead) vivo.lead = ganchoDeFicha(productoFile(slug));

  // 2. Ficha generada con los datos de Shopify.
  if (!vivo) notFound();
  const [tc, relacionados] = await Promise.all([obtenerTipoCambio(), relacionadosDe(vivo)]);
  const precio = precioPublico(vivo, tc);
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: fichaHtml(vivo, tc, relacionados) }} />
      <JsonLd data={jsonLdVivo(vivo, precio, url)} />
    </>
  );
}
