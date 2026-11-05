// listados.ts — qué productos lleva cada listado del sitio, en un solo lugar.
//
// Lo usan las páginas (para pintar la rejilla) y /api/tarjetas (para entregar
// las tarjetas de una página más del mismo listado, Carla 2026-11-04: 50 por
// página con selector hasta 200). Si cada una armara su lista por su cuenta, una
// tarjeta pedida después podría salir distinta de la que pintó la página.
//
// Los productos de Shopify vienen del Data Cache (tag TAG_CATALOGO), así que
// pedir el mismo listado dos veces no vuelve a consultar Shopify.

import "server-only";

import { marcaPorSlug } from "@/lib/marcas";

import { productosDeColeccion, productosDeMarca, type ProductoVivo } from "./catalogoVivo";
import { EXTRAS_DE_MACRO, EXTRAS_DE_TIPO, tipoDePlp, tiposDeMacro, tiposDeSub1 } from "./coleccionesWeb";

/** /productos/<macro>: sus tipos más los extras de otras colecciones por filtro. */
export async function productosDeMacro(categoria: string): Promise<ProductoVivo[]> {
  const tipos = tiposDeMacro(categoria);
  if (!tipos.length) return [];
  const extras = EXTRAS_DE_MACRO[`/productos/${categoria}`] ?? [];
  const [propios, ...ajenos] = await Promise.all([
    Promise.all(tipos.map((t) => productosDeColeccion(t.coleccion))).then((l) => l.flat()),
    ...extras.map((e) =>
      productosDeColeccion(e.coleccion).then((l) =>
        l.filter((p: ProductoVivo) => (p.filtros[e.filtro.clave] ?? []).includes(e.filtro.valor)),
      ),
    ),
  ]);
  return [...propios, ...ajenos.flat()];
}

/** /productos/<macro>/<subcategoría>: las colecciones de sus tipos. */
export async function productosDeSub1(categoria: string, subcategoria: string): Promise<ProductoVivo[]> {
  const tipos = tiposDeSub1(categoria, subcategoria);
  if (!tipos.length) return [];
  return (await Promise.all(tipos.map((t) => productosDeColeccion(t.coleccion)))).flat();
}

/** /productos/<macro>/<subcategoría>/<tipo>: su colección más los extras del tipo. */
export async function productosDeTipo(categoria: string, subcategoria: string, tipo: string): Promise<ProductoVivo[]> {
  const tw = tipoDePlp(categoria, subcategoria, tipo);
  if (!tw) return [];
  return (
    await Promise.all([
      productosDeColeccion(tw.coleccion),
      ...(EXTRAS_DE_TIPO[tw.tipo] ?? []).map((e) =>
        productosDeColeccion(e.coleccion).then((l) =>
          l
            .filter((p) => (p.filtros[e.filtro.clave] ?? []).includes(e.filtro.valor))
            .map((p) => ({
              ...p,
              filtros: Object.fromEntries(Object.entries(p.filtros).filter(([k]) => !e.quitar?.includes(k))),
            })),
        ),
      ),
    ])
  ).flat();
}

/** /marcas/<slug>: las piezas publicadas con su Vendor (las marcas "pdf" no tienen tienda). */
export async function productosDeMarcaSlug(slug: string): Promise<ProductoVivo[]> {
  const marca = marcaPorSlug(slug);
  if (!marca || marca.canal === "pdf") return [];
  return productosDeMarca(marca.nombre);
}

/**
 * Productos del listado de una ruta del sitio, o null si la ruta no es un
 * listado. Es la llave con que /api/tarjetas sabe de qué rejilla le piden.
 */
export async function productosDeListado(ruta: string): Promise<ProductoVivo[] | null> {
  const partes = ruta.split("?")[0].split("/").filter(Boolean);
  const valido = partes.every((p) => /^[a-z0-9-]+$/.test(p));
  if (!valido) return null;
  if (partes[0] === "marcas" && partes.length === 2) return productosDeMarcaSlug(partes[1]);
  if (partes[0] !== "productos") return null;
  if (partes.length === 2) return productosDeMacro(partes[1]);
  if (partes.length === 3) return productosDeSub1(partes[1], partes[2]);
  if (partes.length === 4) return productosDeTipo(partes[1], partes[2], partes[3]);
  return null;
}
