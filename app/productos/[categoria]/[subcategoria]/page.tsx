import type { Metadata } from "next";
import { notFound } from "next/navigation";

import MarketingPage from "@/components/MarketingPage";
import { getMain, getTitle, subcategoriaFile, subcategoriaParams } from "@/lib/preview";
import { productosDeColeccion } from "@/lib/shopify/catalogoVivo";
import { tiposDeSub1 } from "@/lib/shopify/coleccionesWeb";
import { conteoHtml, panelFiltrosHtml, rejillaHtml } from "@/lib/shopify/htmlCatalogo";
import { obtenerTipoCambio } from "@/lib/tipoCambio";

// ISR — una hora: la rejilla trae precios y productos vivos de Shopify.
export const revalidate = 3600;
// Solo las subcategorías precomputadas (subcategoria-<cat>--<sub>.html) existen → resto 404.
export const dynamicParams = false;

interface Params {
  categoria: string;
  subcategoria: string;
}

function exists({ categoria, subcategoria }: Params): boolean {
  return subcategoriaParams().some(
    (p) => p.categoria === categoria && p.subcategoria === subcategoria
  );
}

export function generateStaticParams(): Params[] {
  return subcategoriaParams();
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const params = await props.params;
  if (!exists(params)) return {};
  const title = getTitle(subcategoriaFile(params.categoria, params.subcategoria));
  return {
    title,
    alternates: {
      canonical: `/productos/${params.categoria}/${params.subcategoria}`,
    },
  };
}

/**
 * Catálogo vivo: si la Subcategoría 1 ya tiene tipos publicados en Shopify, sus
 * productos sustituyen las tarjetas estáticas del preview (slots de rango
 * `catalogo-*`). Si Shopify no contesta, la página se queda con el preview.
 */
async function slotsDeCatalogo(file: string, params: Params): Promise<Record<string, string>> {
  const tipos = tiposDeSub1(params.categoria, params.subcategoria);
  if (!tipos.length) return {};
  const productos = (await Promise.all(tipos.map((t) => productosDeColeccion(t.coleccion)))).flat();
  if (!productos.length) return {};

  // Los tipos del riel (aunque aún no tengan piezas) entran al grupo "Tipo":
  // elegir uno vacío muestra el aviso en vez de dejar todo el catálogo visible.
  const riel = [
    ...getMain(file).matchAll(/<a class="subcat" data-tipo="([^"]+)"[\s\S]*?<span class="lbl">([^<]+)<\/span>/g),
  ].map((m) => ({ slug: m[1], nombre: m[2].replace(/&amp;/g, "&") }));

  const tc = await obtenerTipoCambio();
  return {
    "catalogo-filtros": panelFiltrosHtml(productos, { conTipo: true, tiposRiel: riel }),
    "catalogo-grid": rejillaHtml(productos, tc),
    "catalogo-conteo": conteoHtml(productos),
  };
}

export default async function SubcategoriaPage(props: { params: Promise<Params> }) {
  const params = await props.params;
  if (!exists(params)) notFound();
  const file = subcategoriaFile(params.categoria, params.subcategoria);
  return <MarketingPage file={file} slots={await slotsDeCatalogo(file, params)} />;
}
