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

import filtrosWeb from "@/data/filtros-web.json";

import { productosConEtiqueta, productosDeColeccion, productosDeMarca, type ProductoVivo } from "./catalogoVivo";
import { EXTRAS_DE_MACRO, EXTRAS_DE_TIPO, tipoDePlp, tiposDeMacro, tiposDeSub1, type TipoWeb } from "./coleccionesWeb";

type DefFiltro = { clave: string; valores?: string[] };
const DEFS = (filtrosWeb as unknown as { subcategorias: Record<string, DefFiltro[]> }).subcategorias;

/** Filtros que valen en cualquier categoría (no dependen del tipo). */
const FILTROS_COMUNES = new Set(["paquete", "promocion", "disponibilidad", "garantia"]);

/**
 * Piezas de OTRO tipo que también se listan en este (Carla, 2026-11-09: "si hay
 * paquetes que incluyen productos de otra categoría también tienen que aparecer
 * en la categoría"). Se marcan en Shopify con la etiqueta
 * `tambien-en-<colección>` (p. ej. el paquete Mabe parrilla + campana lleva
 * `tambien-en-campanas`). Aquí se presentan como piezas del tipo anfitrión:
 * cuentan en su riel y su panel, y solo conservan los filtros que existen en la
 * tabla del anfitrión con valores de su lista (la instalación "Tradicional" o el
 * número de quemadores de la parrilla no se cuelan en Campanas).
 */
async function tambienEn(tw: TipoWeb): Promise<ProductoVivo[]> {
  const piezas = await productosConEtiqueta(`tambien-en-${tw.coleccion}`);
  const defs = DEFS[tw.tipo] ?? [];
  return piezas
    .filter((p) => p.tipo !== tw.tipo)
    .map((p) => ({
      ...p,
      tipo: tw.tipo,
      filtros: Object.fromEntries(
        Object.entries(p.filtros).filter(([clave, valores]) => {
          if (FILTROS_COMUNES.has(clave)) return true;
          const d = defs.find((x) => x.clave === clave);
          if (!d) return false;
          return !d.valores?.length || valores.every((v) => d.valores!.includes(v));
        }),
      ),
    }));
}

/** Una tarjeta por pieza: si una pieza llega por dos caminos, gana la primera (la de su propio tipo). */
function unicos(productos: ProductoVivo[]): ProductoVivo[] {
  const vistos = new Set<string>();
  return productos.filter((p) => (vistos.has(p.sku) ? false : (vistos.add(p.sku), true)));
}

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
  const tambien = (await Promise.all(tipos.map(tambienEn))).flat();
  return unicos([...propios, ...ajenos.flat(), ...tambien]);
}

/** /productos/<macro>/<subcategoría>: las colecciones de sus tipos. */
export async function productosDeSub1(categoria: string, subcategoria: string): Promise<ProductoVivo[]> {
  const tipos = tiposDeSub1(categoria, subcategoria);
  if (!tipos.length) return [];
  const [propios, tambien] = await Promise.all([
    Promise.all(tipos.map((t) => productosDeColeccion(t.coleccion))).then((l) => l.flat()),
    Promise.all(tipos.map(tambienEn)).then((l) => l.flat()),
  ]);
  return unicos([...propios, ...tambien]);
}

/** /productos/<macro>/<subcategoría>/<tipo>: su colección más los extras del tipo. */
export async function productosDeTipo(categoria: string, subcategoria: string, tipo: string): Promise<ProductoVivo[]> {
  const tw = tipoDePlp(categoria, subcategoria, tipo);
  if (!tw) return [];
  return unicos(
    (await Promise.all([
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
      tambienEn(tw),
    ])).flat(),
  );
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
