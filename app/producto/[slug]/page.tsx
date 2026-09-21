import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import MarketingPage from "@/components/MarketingPage";
import { productoPorSku } from "@/lib/catalogo";
import { getMain, getTitle, productoFile, productoSlugs } from "@/lib/preview";
import { contenidoDeFicha, jsonLdProducto } from "@/lib/shopify/pdpSlots";
import { absUrl } from "@/lib/site";

// ISR — una hora. Antes era un día, cuando el precio estaba escrito a mano en el
// HTML y no cambiaba nunca; ahora la ficha trae precio y tipo de cambio vivos.
export const revalidate = 3600;
// Solo las fichas precomputadas (producto-<slug>.html) existen → resto 404.
export const dynamicParams = false;

interface Params {
  slug: string;
}

export function generateStaticParams(): Params[] {
  return productoSlugs().map((slug) => ({ slug }));
}

/** El slug de la ficha ES el SKU en minúsculas (scripts/build-search-index.mjs). */
const skuDeSlug = (slug: string) => slug.toUpperCase();

/** El gancho de una línea de la ficha; sirve de descripción en metadatos y JSON-LD. */
function ganchoDeFicha(file: string): string | null {
  const encontrado = getMain(file).match(/<p class="lead-serif">([\s\S]*?)<\/p>/);
  return encontrado ? encontrado[1].replace(/<[^>]+>/g, "").trim() : null;
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const params = await props.params;
  if (!productoSlugs().includes(params.slug)) return {};
  const file = productoFile(params.slug);
  const gancho = ganchoDeFicha(file);
  return {
    title: getTitle(file),
    ...(gancho ? { description: gancho } : {}),
    alternates: { canonical: `/producto/${params.slug}` },
  };
}

export default async function ProductoFichaPage(props: { params: Promise<Params> }) {
  const params = await props.params;
  if (!productoSlugs().includes(params.slug)) notFound();

  const file = productoFile(params.slug);
  const sku = skuDeSlug(params.slug);
  const indexado = productoPorSku(sku);
  const { slots, datos } = await contenidoDeFicha(sku);

  return (
    <>
      <MarketingPage file={file} slots={slots} />
      {/* El JSON-LD se emite aquí y no en el HTML del preview para que el precio
          y la disponibilidad del marcado sean LOS MISMOS que ve el visitante.
          Dos bloques Product en conflicto valen menos que ninguno. */}
      {datos && indexado ? (
        <JsonLd
          data={jsonLdProducto(
            datos,
            indexado,
            absUrl(`/producto/${params.slug}`),
            ganchoDeFicha(file) ?? indexado.titulo,
          )}
        />
      ) : null}
    </>
  );
}
