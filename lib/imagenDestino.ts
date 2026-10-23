// imagenDestino.ts — foto de cada categoría, tipo o marca que sugiere el buscador.
//
// El overlay enseña las categorías como tarjetas con foto (Carla, 2026-10-23).
// Las fotos ya existen: son las de los rieles y mosaicos de las páginas de
// categoría (preview/*.html) y las de los tipos del PLP (lib/fotosTipos.ts).
// Aquí solo se resuelve, para un `href` del sitio, cuál le toca:
//   /productos/<macro>/<sub1>?tipo=<slug>  → tile del riel con ese ?tipo=
//   /productos/<macro>/<sub1>/<sub2>?f=x   → foto del tipo x en fotosTipos
//   /productos/<macro>[/<sub1>[/<sub2>]]   → tarjeta que enlaza esa página
//   /marcas/<slug>                         → logo sin fondo (o a color)
// Sin foto conocida → null (el overlay pinta un hueco neutro).

import "server-only";

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { getFotoTipo } from "./fotosTipos";

const RAIZ = process.cwd();
let mapa: Map<string, string> | null = null;

/** "subcategoria-cocina-y-bar--coccion--campanas.html" → "/productos/cocina-y-bar/coccion/campanas". */
function rutaDeArchivo(archivo: string): string | null {
  const m = archivo.match(/^(sub)?categoria-(.+)\.html$/);
  return m ? `/productos/${m[2].split("--").join("/")}` : null;
}

function cargar(): Map<string, string> {
  if (mapa) return mapa;
  mapa = new Map();
  const dir = join(RAIZ, "preview");
  let archivos: string[] = [];
  try {
    archivos = readdirSync(dir).filter((f) => f.endsWith(".html"));
  } catch {
    return mapa;
  }
  for (const f of archivos) {
    const html = readFileSync(join(dir, f), "utf8");
    for (const m of html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)) {
      const [, href, cuerpo] = m;
      const img = cuerpo.match(/<img\b[^>]*?(?:data-src|src)="((?:\/)?assets\/[^"]+)"/);
      if (!img) continue;
      const src = img[1].startsWith("/") ? img[1] : `/${img[1]}`;
      const tipo = href.match(/[?&]tipo=([a-z0-9-]+)/)?.[1];
      if (tipo && !mapa.has(`tipo:${tipo}`)) mapa.set(`tipo:${tipo}`, src);
      const ruta = rutaDeArchivo(href.split(/[?#]/)[0]);
      if (ruta && !href.includes("?") && !mapa.has(ruta)) mapa.set(ruta, src);
    }
  }
  return mapa;
}

function logoDeMarca(slug: string): string | null {
  const candidatas = [
    `/assets/logos/ficha/${slug}.webp`,
    ...["webp", "png", "jpg", "svg"].map((ext) => `/assets/logos/color/${slug}.${ext}`),
  ];
  return candidatas.find((r) => existsSync(join(RAIZ, "public", r))) ?? null;
}

export function imagenDeDestino(href: string): string | null {
  const [ruta, query = ""] = href.split("?");
  const marca = ruta.match(/^\/marcas\/([a-z0-9-]+)$/);
  if (marca) return logoDeMarca(marca[1]);
  const params = new URLSearchParams(query);
  const m = cargar();
  const tipo = params.get("tipo");
  if (tipo && m.has(`tipo:${tipo}`)) return m.get(`tipo:${tipo}`)!;
  const filtro = params.get("f");
  if (filtro && ruta.startsWith("/productos/")) {
    const foto = getFotoTipo(ruta.replace(/^\/productos\//, ""), filtro);
    if (foto) return foto.src;
  }
  return m.get(ruta) ?? null;
}
