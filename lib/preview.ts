// Carga e integra las páginas estáticas del preview (preview/*.html) dentro del
// front-end Next.js, reutilizando su markup tal cual (máxima fidelidad).
// - Extrae nav/footer (chrome compartido) y el contenido principal de cada página.
// - Reescribe rutas de assets a /assets y enlaces .html a rutas limpias.
// - Quita el <script src="v2.js"> (se carga una sola vez, global) — el JSON inline
//   (#hero-data) se conserva para que v2.js lo lea.

import { readFileSync } from "fs";
import { join } from "path";

const PREVIEW_DIR = join(process.cwd(), "preview");

// Mapeo de páginas del preview → rutas del sitio.
const LINK_MAP: Record<string, string> = {
  "home.html": "/",
  "marcas.html": "/marcas",
  "coleccion.html": "/productos",
  "producto.html": "/producto",
  "b2b.html": "/proyectos",
  "nosotros.html": "/nosotros",
  "contacto.html": "/contacto",
  "herramientas.html": "/herramientas",
  "garantias-instalacion.html": "/garantias-instalacion",
  "guias.html": "/guias/",
  "ofertas.html": "/productos",
};

function readPreview(file: string): string {
  return readFileSync(join(PREVIEW_DIR, file), "utf8");
}

/** Reescribe enlaces internos (.html → ruta) y rutas de assets (→ /assets). */
function rewrite(html: string): string {
  // Enlaces internos *.html → rutas limpias (conserva #fragmento).
  html = html.replace(
    /href="([a-z0-9-]+)\.html(#[^"]*)?"/gi,
    (_m, file: string, frag = "") => {
      const route = LINK_MAP[`${file}.html`] ?? "#";
      return `href="${route}${frag || ""}"`;
    }
  );
  // Rutas relativas de assets → absolutas desde /public.
  html = html.replace(/([="'(\s])assets\//g, "$1/assets/");
  // Quita scripts externos (v2.js se carga global en el layout).
  html = html.replace(/<script\b[^>]*\bsrc=[^>]*><\/script>/gi, "");
  return html;
}

function bodyInner(html: string): string {
  const afterOpen = html.split(/<body[^>]*>/i)[1] ?? html;
  return afterOpen.split(/<\/body>/i)[0] ?? afterOpen;
}

const RE_NAV = /<div class="ubar">[\s\S]*?<\/nav>/i;
const RE_FOOTER = /<footer class="site-footer">[\s\S]*?<\/footer>/i;
const RE_WAFLOAT = /<a class="wa-float"[\s\S]*?<\/a>/i;

/** Nav + footer compartidos (extraídos del home; idénticos en todo el preview). */
export function getChrome(): { nav: string; footer: string } {
  const body = bodyInner(readPreview("home.html"));
  const nav = body.match(RE_NAV)?.[0] ?? "";
  const footer = body.match(RE_FOOTER)?.[0] ?? "";
  return { nav: rewrite(nav), footer: rewrite(footer) };
}

/** Contenido principal de una página del preview (sin nav, footer, wa-float ni scripts). */
export function getMain(file: string): string {
  let body = bodyInner(readPreview(file));
  body = body.replace(RE_NAV, "");
  body = body.replace(RE_FOOTER, "");
  body = body.replace(RE_WAFLOAT, "");
  return rewrite(body);
}

/** Título del <title> de una página del preview (para metadata). */
export function getTitle(file: string): string | undefined {
  const m = readPreview(file).match(/<title>([^<]*)<\/title>/i);
  return m?.[1]?.trim();
}
