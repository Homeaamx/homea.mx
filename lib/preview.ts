// Carga e integra las páginas estáticas del preview (preview/*.html) dentro del
// front-end Next.js, reutilizando su markup tal cual (máxima fidelidad).
// - Extrae nav/footer (chrome compartido) y el contenido principal de cada página.
// - Reescribe rutas de assets a /assets y enlaces .html a rutas limpias.
// - Quita el <script src="v2.js"> (se carga una sola vez, global) — el JSON inline
//   (#hero-data) se conserva para que v2.js lo lea.

import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const PREVIEW_DIR = join(process.cwd(), "preview");

// Prefijo de las páginas de categoría del preview (categoria-<slug>.html).
const CATEGORIA_PREFIX = "categoria-";
// Prefijo de las fichas de producto del preview (producto-<slug>.html).
const PRODUCTO_PREFIX = "producto-";

// Mapeo de páginas del preview → rutas del sitio.
const LINK_MAP: Record<string, string> = {
  "home.html": "/",
  "marcas.html": "/marcas",
  "producto.html": "/producto",
  "b2b.html": "/proyectos",
  "nosotros.html": "/nosotros",
  "contacto.html": "/contacto",
  "herramientas.html": "/herramientas",
  "garantias-instalacion.html": "/garantias-instalacion",
  "guias.html": "/guias/",
  "ofertas.html": "/ofertas",
  // No hay índice /productos todavía → cae a la home.
  "coleccion.html": "/",
};

function readPreview(file: string): string {
  return readFileSync(join(PREVIEW_DIR, file), "utf8");
}

/** Un archivo .html del preview → su ruta en el sitio. */
function mapTarget(file: string): string {
  if (file.startsWith(CATEGORIA_PREFIX))
    return `/productos/${file.slice(CATEGORIA_PREFIX.length)}`;
  if (file.startsWith(PRODUCTO_PREFIX))
    return `/producto/${file.slice(PRODUCTO_PREFIX.length)}`;
  return LINK_MAP[`${file}.html`] ?? "#";
}

/** Rutas relativas de assets → absolutas desde /public. */
function rewriteAssets(s: string): string {
  return s.replace(/([="'(\s])assets\//g, "$1/assets/");
}

// Todos los <script> (con atributos y cuerpo capturados). Global → resetear lastIndex.
const RE_SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

/** ¿El <script> es JS ejecutable? (sin type, o type js/module). Los application/json
 *  (p. ej. #hero-data, JSON-LD) NO lo son y deben quedarse en el HTML. */
function isExecutableJs(attrs: string): boolean {
  const m = attrs.match(/\btype\s*=\s*["']([^"']*)["']/i);
  if (!m) return true;
  const t = m[1].trim().toLowerCase();
  return (
    t === "" ||
    t === "text/javascript" ||
    t === "application/javascript" ||
    t === "module"
  );
}

/** Reescribe enlaces internos (.html → ruta) y rutas de assets (→ /assets).
 *  Quita los <script> de JS ejecutable (externos e inline): v2.js se carga global
 *  y el JS inline de página se re-inyecta vía next/script (ver getScripts). Los
 *  scripts de datos (application/json / ld+json) se conservan. */
function rewrite(html: string): string {
  // Enlaces internos *.html → rutas limpias (conserva #fragmento).
  html = html.replace(
    /href="([a-z0-9-]+)\.html(#[^"]*)?"/gi,
    (_m, file: string, frag = "") => `href="${mapTarget(file)}${frag || ""}"`
  );
  html = rewriteAssets(html);
  html = html.replace(RE_SCRIPT, (m, attrs: string) =>
    isExecutableJs(attrs) ? "" : m
  );
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

/** CSS de página: contenido de los <style> del <head> (assets reescritos).
 *  getMain sólo devuelve el <body>, así que este CSS hay que inyectarlo aparte. */
export function getStyles(file: string): string {
  const html = readPreview(file);
  const parts: string[] = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) parts.push(m[1]);
  return rewriteAssets(parts.join("\n"));
}

/** JS inline de página: cuerpos de los <script> ejecutables sin src, concatenados.
 *  Se re-inyecta vía next/script porque dangerouslySetInnerHTML no ejecuta scripts.
 *  Reescribe los enlaces *.html embebidos en el JS (p. ej. hrefs de spotlights). */
export function getScripts(file: string): string {
  const html = readPreview(file);
  const parts: string[] = [];
  RE_SCRIPT.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RE_SCRIPT.exec(html))) {
    const [, attrs, body] = m;
    if (/\bsrc\s*=/i.test(attrs)) continue; // externos (v2.js) → global en el layout
    if (!isExecutableJs(attrs)) continue; // datos (JSON/LD) → quedan en el HTML
    parts.push(body);
  }
  const js = parts.join("\n;\n");
  // Enlaces *.html embebidos en cadenas JS → rutas del sitio.
  return js.replace(/\b([a-z0-9-]+)\.html/gi, (_m, f: string) => mapTarget(f));
}

/** Título del <title> de una página del preview (para metadata). */
export function getTitle(file: string): string | undefined {
  const m = readPreview(file).match(/<title>([^<]*)<\/title>/i);
  return m?.[1]?.trim();
}

/** Slugs de las páginas de categoría del preview (categoria-<slug>.html → <slug>). */
export function categoriaSlugs(): string[] {
  return readdirSync(PREVIEW_DIR)
    .filter((f) => f.startsWith(CATEGORIA_PREFIX) && f.endsWith(".html"))
    .map((f) => f.slice(CATEGORIA_PREFIX.length, -".html".length));
}

/** Nombre de archivo del preview para una slug de categoría. */
export function categoriaFile(slug: string): string {
  return `${CATEGORIA_PREFIX}${slug}.html`;
}

/** Slugs de las fichas de producto del preview (producto-<slug>.html → <slug>). */
export function productoSlugs(): string[] {
  return readdirSync(PREVIEW_DIR)
    .filter((f) => f.startsWith(PRODUCTO_PREFIX) && f.endsWith(".html"))
    .map((f) => f.slice(PRODUCTO_PREFIX.length, -".html".length));
}

/** Nombre de archivo del preview para una slug de producto. */
export function productoFile(slug: string): string {
  return `${PRODUCTO_PREFIX}${slug}.html`;
}
