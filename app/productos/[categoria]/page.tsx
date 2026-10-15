import type { Metadata } from "next";
import { notFound } from "next/navigation";

import MarketingPage from "@/components/MarketingPage";
import { categoriaFile, categoriaSlugs, getMain, getTitle } from "@/lib/preview";
import { productosDeColeccion, type ProductoVivo } from "@/lib/shopify/catalogoVivo";
import { EXTRAS_DE_MACRO, tilesPresentes, tiposDeMacro } from "@/lib/shopify/coleccionesWeb";
import filtrosWeb from "@/data/filtros-web.json";
import marcasPdf from "@/data/marcas-pdf-subcategorias.json";
import { marcaPorSlug, rutaMarca } from "@/lib/marcas";
import { conteoHtml, panelFiltrosHtml, rejillaHtml, slugValor } from "@/lib/shopify/htmlCatalogo";
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
  // Macros de una sola colección con el riel por filtro (Electrodomésticos
  // menores, Lavandería, Aire acondicionado): los tiles son casillas del grupo
  // de la tabla ("Tipo" / "Tipo de funcionamiento"), no un grupo aparte.
  const conEje = tipos.find((t) => t.ejeRiel);
  if (conEje?.ejeRiel) {
    const eje = conEje.ejeRiel;
    // Texto exacto de la tabla de filtros para cada casilla ("Centros de lavado",
    // "Solo frío"), aunque el tile del riel lo escriba distinto.
    const tabla = (filtrosWeb.subcategorias as Record<string, { nombre: string; valores?: string[] }[]>)[conEje.tipo] ?? [];
    const valoresTabla = tabla.find((d) => d.nombre === eje.nombre)?.valores ?? [];
    const textoDe = (slug: string) => {
      const k = slugValor(eje.valores?.[slug] ?? slug);
      return valoresTabla.find((v) => slugValor(v) === k);
    };
    const tc = await obtenerTipoCambio();
    return {
      "catalogo-filtros": panelFiltrosHtml(productos, {
        tc,
        mosaico: riel.map((r) => ({ eje: eje.nombre, slug: r.slug, nombre: textoDe(r.slug) ?? r.nombre, valor: eje.valores?.[r.slug] })),
        tipos: tipos.map((t) => t.tipo),
      }),
      ...(productos.length ? { "catalogo-grid": rejillaHtml(productos, tc) } : {}),
      "catalogo-conteo": conteoHtml(productos),
    };
  }
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

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Macros que solo se publican con PDF (Baños, Vapor y Sauna, Wellness,
 * Recubrimientos, Chimeneas): en lugar de productos, una tarjeta por marca con
 * las subcategorías que maneja (`data-subs`); el script de la página las filtra
 * con la casilla de Subcategoría y el riel, y cada una lleva a /marcas/<slug>.
 */
function slotsDeMarcasPdf(categoria: string): Record<string, string> | null {
  const mapa = (marcasPdf.macros as Record<string, Record<string, string[]>>)[categoria];
  if (!mapa) return null;
  const tarjetas = Object.entries(mapa)
    .map(([slug, subs]) => ({ marca: marcaPorSlug(slug), subs }))
    .filter((x): x is { marca: NonNullable<ReturnType<typeof marcaPorSlug>>; subs: string[] } => Boolean(x.marca))
    .sort((a, b) => a.marca.nombre.localeCompare(b.marca.nombre, "es"))
    .map(({ marca, subs }) => {
      const foto = marca.foto ? ` style="--lazy-bg:url('${esc(marca.foto)}')"` : "";
      const logo = marca.logo
        ? `<img class="bt-logo" src="${esc(marca.logo)}" alt="${esc(marca.nombre.toUpperCase())}" loading="lazy" decoding="async" onerror="this.closest('.brandtile').classList.add('no-logo')">`
        : "";
      return `<a class="brandtile bg-ready${marca.logo ? "" : " no-logo"}" href="${rutaMarca(marca)}" data-brand="${esc(marca.slug)}" data-subs="${esc(subs.join(" "))}" aria-label="${esc(`Ver la marca ${marca.nombre}`)}"${foto}>${logo}<span class="bn">${esc(marca.nombre.toUpperCase())}</span></a>`;
    });
  return { "marcas-pdf": tarjetas.join("") };
}

export default async function CategoriaPage(props: { params: Promise<Params> }) {
  const params = await props.params;
  if (!categoriaSlugs().includes(params.categoria)) notFound();
  const slots =
    slotsDeMarcasPdf(params.categoria) ??
    (await slotsDeCatalogo(categoriaFile(params.categoria), params.categoria));
  return (
    <MarketingPage
      file={categoriaFile(params.categoria)}
      slots={slots}
    />
  );
}
