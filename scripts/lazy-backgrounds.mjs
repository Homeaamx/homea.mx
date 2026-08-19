/**
 * Fondos CSS diferidos — HOMEA
 *
 * loading="lazy" solo existe para <img>. Los fondos declarados en CSS o en un
 * style inline se descargan en cuanto la regla aplica, aunque el elemento esté
 * 3.000 px más abajo: el carrusel de marcas y los mosaicos de categoría pedían
 * ~1.4 MB antes de que nadie los viera.
 *
 * Técnica: la URL se guarda en una custom property (--lazy-bg). El navegador NO
 * descarga un url() guardado en una variable hasta que alguna propiedad lo usa.
 * v2.js añade la clase .bg-ready cuando el elemento se acerca al viewport, y ahí
 * — y solo ahí — se aplica background-image: var(--lazy-bg).
 *
 * Uso:  node scripts/lazy-backgrounds.mjs   (idempotente)
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Componentes que siempre viven bajo el pliegue.
const COMPONENTES = ["mq-chip", "brandtile", "cat-media", "ss-bg"];
const REGLA = `
/* ---------- Fondos diferidos (ver scripts/lazy-backgrounds.mjs) ----------
   La URL vive en --lazy-bg y solo se pide cuando v2.js marca el elemento como
   visible. Sin esta regla el navegador descargaría todo el carrusel de marcas
   y los mosaicos de categoría durante la carga inicial. */
${COMPONENTES.map((c) => `.${c}.bg-ready`).join(",\n")} { background-image: var(--lazy-bg); }
`;

async function main() {
  let cssTocado = 0, inlineTocado = 0, nReglas = 0, nInline = 0;

  // ---------- 1. Reglas en las hojas de estilo ----------
  for (const css of ["styles/theme.css", "preview/theme.css"]) {
    let s = await readFile(css, "utf8");
    const orig = s;
    const re = new RegExp(
      `(\\.(?:${COMPONENTES.join("|")})\\[[^\\]]*\\][^{]*\\{[^}]*?)background-image:\\s*(url\\([^)]*\\))`,
      "g"
    );
    s = s.replace(re, (m, head, url) => { nReglas++; return `${head}--lazy-bg: ${url}`; });
    if (!s.includes(".bg-ready")) s += REGLA;
    if (s !== orig) { await writeFile(css, s); cssTocado++; }
  }

  // ---------- 2. style inline en el markup del preview ----------
  for (const f of (await readdir("preview")).filter((x) => x.endsWith(".html"))) {
    const p = path.join("preview", f);
    let s = await readFile(p, "utf8");
    const orig = s;
    s = s.replace(
      new RegExp(`(class="[^"]*(?:${COMPONENTES.join("|")})[^"]*"[^>]*style=")background-image:`, "g"),
      (m, head) => { nInline++; return `${head}--lazy-bg:`; }
    );
    if (s !== orig) { await writeFile(p, s); inlineTocado++; }
  }

  console.log(`Reglas CSS diferidas: ${nReglas} en ${cssTocado} hojas.`);
  console.log(`Estilos inline diferidos: ${nInline} en ${inlineTocado} páginas.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
