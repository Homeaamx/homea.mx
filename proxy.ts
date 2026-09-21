// Redirects 301 de la migración OXATIS → sitio nuevo (Next 16: "proxy", antes middleware).
//
// Solo corre en URLs con forma de OXATIS (ver `config.matcher`); el resto del sitio
// no pasa por aquí. Los redirects fijos de next.config.js se evalúan ANTES que esto,
// así que los ~70 de categoría que ya existen siguen igual.
//
// El mapa (data/redirects/oxatis-map.json) lo genera scripts/build-redirects.mjs en
// cada build: ficha de producto si ya existe, si no el listado de su familia, y PDFs
// a Shopify Files cuando tengan URL. Detalle: docs/PLAN-REDIRECTS-MIGRACION.md §7.

import { NextResponse, type NextRequest } from "next/server";

import mapa from "@/data/redirects/oxatis-map.json";

const { destinos, rutas, claves } = mapa as unknown as {
  destinos: string[];
  rutas: Record<string, number>;
  claves: [string, number][];
};

/** Misma normalización que scripts/build-oxatis-map.py (norm_ruta). */
function normalizar(pathname: string, params: URLSearchParams): string {
  let ruta = pathname.toLowerCase();
  try {
    ruta = decodeURIComponent(ruta);
  } catch {
    // %-encoding inválido: se usa tal cual.
  }
  if (ruta.startsWith("/mobile/")) ruta = ruta.slice("/mobile".length);
  if (ruta.length > 1) ruta = ruta.replace(/\/+$/, "");
  if (ruta.endsWith(".asp")) {
    for (const [k, v] of params) {
      const clave = k.toLowerCase();
      if ((clave === "id" || clave === "pageid") && v) return `${ruta}?${clave}=${v.toLowerCase()}`;
    }
  }
  return ruta;
}

/** Fichas/categorías viejas que no están en el inventario: por palabra clave del slug
 *  (la que aparece más al inicio; si empatan, la más larga). */
function porPalabraClave(ruta: string): string | undefined {
  const slug =
    "-" +
    ruta
      .replace(/^\/(es\/product\/)?/, "")
      .replace(/-c\d+x\d+$/, "")
      .replace(/[_-]+/g, "-");
  let mejor: { pos: number; len: number; destino: string } | undefined;
  for (const [clave, i] of claves) {
    const pos = slug.indexOf("-" + clave);
    if (pos < 0) continue;
    if (!mejor || pos < mejor.pos || (pos === mejor.pos && clave.length > mejor.len)) {
      mejor = { pos, len: clave.length, destino: destinos[i] };
    }
  }
  return mejor?.destino;
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const ruta = normalizar(pathname, searchParams);

  let destino = ruta in rutas ? destinos[rutas[ruta]] : undefined;
  if (!destino && (/-c\d+x\d+$/.test(ruta) || ruta.startsWith("/es/product/")))
    destino = porPalabraClave(ruta);
  if (!destino) return NextResponse.next(); // → 404 normal del sitio

  // URL limpia: se descarta el query viejo (?PGFLngID=2, ?ID=…); el destino trae
  // su propio ?f= cuando aplica.
  const url = destino.startsWith("http") ? new URL(destino) : new URL(destino, request.url);
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: [
    // Fichas y categorías: /<slug>-c102x3177452, /<slug>-c2x19221770, …
    "/:slug((?:.*)-[cC]\\d+[xX]\\d+)",
    "/:slug((?:.*)-[cC]\\d+[xX]\\d+)/",
    // Fichas del formato más viejo: /es/product/<slug>.
    "/es/product/:rest*",
    // PDFs viejos y versión móvil de OXATIS.
    "/:dir(files|Files|FILES)/:rest*",
    "/:dir(mobile|Mobile|MOBILE)/:rest*",
    // Páginas .asp / .htm / .html de OXATIS (las .html del preview ya las atrapa next.config).
    "/:pagina((?:.*)\\.(?:asp|ASP|htm|HTM|html|HTML))",
  ],
};
