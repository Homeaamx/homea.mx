import type { Metadata } from "next";
import { notFound } from "next/navigation";

import MarketingPage from "@/components/MarketingPage";
import { categoriaFile, categoriaSlugs, getMain, getTitle } from "@/lib/preview";
import { productosDeColeccion, type ProductoVivo } from "@/lib/shopify/catalogoVivo";
import { EXTRAS_DE_MACRO, tilesPresentes, tiposDeMacro } from "@/lib/shopify/coleccionesWeb";
import { conteoHtml, panelFiltrosHtml, rejillaHtml } from "@/lib/shopify/htmlCatalogo";
import { obtenerTipoCambio } from "@/lib/tipoCambio";

// ISR — una hora: la rejilla trae precios y productos vivos de Shopify.
export const revalidate = 3600;
// Solo las categorías precomputadas (categoria-<slug>.html) existen → resto 404.
export const dynamicParams = false;

interface Params {
  categoria: string;
}

export function generateStaticParams(): Params[] {
  return categoriaSlugs().map((categoria) => ({ categoria }));
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const params = await props.params;
  if (!categoriaSlugs().includes(params.categoria)) return {};
  const title = getTitle(categoriaFile(params.categoria));
  return {
    title,
    alternates: { canonical: `/productos/${params.categoria}` },
  };
}

/**
 * Catálogo vivo de la macrocategoría: todas las piezas publicadas en Shopify de
 * sus tipos (TIPOS_WEB → colecciones) sustituyen la maqueta del preview (slots
 * `catalogo-*`). El panel cruza Subcategoría · Tipo de producto · Marca · los
 * filtros `filtros.*` de cada tipo. Sin tipos o sin respuesta de Shopify, la
 * página se queda con el preview.
 */
async function slotsDeCatalogo(file: string, categoria: string): Promise<Record<string, string>> {
  const tipos = tiposDeMacro(categoria);
  if (!tipos.length) return {};
  const extras = EXTRAS_DE_MACRO[`/productos/${categoria}`] ?? [];
  const [propios, ...ajenos] = await Promise.all([
    Promise.all(tipos.map((t) => productosDeColeccion(t.coleccion))).then((l) => l.flat()),
    ...extras.map((e) =>
      productosDeColeccion(e.coleccion).then((l) =>
        l.filter((p: ProductoVivo) => (p.filtros[e.filtro.clave] ?? []).includes(e.filtro.valor)),
      ),
    ),
  ]);
  const productos = [...propios, ...ajenos.flat()];
  // Tiles del riel que filtran en esta misma página (?tipo=), aunque no tengan
  // piezas: así cada uno tiene su casilla en "Tipo de producto".
  const riel = [
    ...getMain(file).matchAll(/<a class="subcat" data-tipo="([^"]+)"[\s\S]*?<span class="lbl">([^<]+)<\/span>/g),
  ].map((m) => ({ slug: m[1], nombre: m[2].replace(/&amp;/g, "&") }));
  for (const t of tilesPresentes(productos)) if (!riel.some((r) => r.slug === t.slug)) riel.push(t);
  // Y los tipos de sus subcategorías (Asadores & Hornos…), con 0 mientras no haya piezas.
  for (const t of tipos) {
    const tiles = [
      { slug: t.slugRiel, nombre: t.nombreRiel ?? t.tipo },
      ...Object.values(t.porInstalacion ?? {}),
      ...(t.accesorios ? [{ slug: t.accesorios.slug, nombre: `${t.accesorios.nombre} de ${t.sub1.nombre.toLowerCase()}` }] : []),
    ];
    for (const tile of tiles) if (!riel.some((r) => r.slug === tile.slug)) riel.push(tile);
  }
  const tc = await obtenerTipoCambio();
  return {
    "catalogo-filtros": panelFiltrosHtml(productos, {
      tc,
      conCategoria: true,
      conTipo: true,
      tiposRiel: riel,
      tipos: [...tipos.map((t) => t.tipo), ...extras.map((e) => e.tablaFiltros)],
    }),
    ...(productos.length ? { "catalogo-grid": rejillaHtml(productos, tc) } : {}),
    "catalogo-conteo": conteoHtml(productos),
  };
}

export default async function CategoriaPage(props: { params: Promise<Params> }) {
  const params = await props.params;
  if (!categoriaSlugs().includes(params.categoria)) notFound();
  return (
    <MarketingPage
      file={categoriaFile(params.categoria)}
      slots={await slotsDeCatalogo(categoriaFile(params.categoria), params.categoria)}
    />
  );
}
