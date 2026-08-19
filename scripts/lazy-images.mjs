/**
 * Disciplina de carga de imágenes — HOMEA
 *
 * El markup del preview se inyecta tal cual (dangerouslySetInnerHTML), así que
 * next/image no lo toca: si un <img> no dice loading="lazy", el navegador lo
 * descarga de inmediato. La home pedía 38 imágenes a la vez cuando solo 2 se ven.
 *
 * Regla aplicada, en este orden:
 *   1. Si la página ya trae un fetchpriority="high" escrito a mano, ese es el LCP.
 *      Si no, lo es el primer <img> después de cerrar el nav.
 *   2. El LCP nunca lleva loading="lazy" (se anularían).
 *   3. Todo lo demás → loading="lazy" decoding="async".
 *   4. El wordmark/logo del nav se queda ansioso: es diminuto y define la identidad.
 *
 * Es idempotente: correrlo de nuevo tras añadir páginas no duplica atributos.
 *
 * Uso:  node scripts/lazy-images.mjs
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DIR = "preview";
const EAGER_HINTS = [/wordmark/i, /black_logo_homea/i, /favicon/i];

const tags = (html) => html.match(/<img\b[^>]*>/g) ?? [];

async function main() {
  const files = (await readdir(DIR)).filter((f) => f.endsWith(".html"));
  let totalLazy = 0, totalFiles = 0;

  for (const f of files) {
    const p = path.join(DIR, f);
    const src = await readFile(p, "utf8");

    // ¿Ya hay un LCP declarado a mano? Si no, será el primero tras el nav.
    const manual = tags(src).find((t) => /fetchpriority="high"/.test(t));
    const navEnd = src.indexOf("</nav>");
    let lcpAsignado = Boolean(manual);
    let lazied = 0;

    const out = src.replace(/<img\b[^>]*>/g, (tag, offset) => {
      let t = tag;

      const esLcp = manual ? t === manual : !lcpAsignado && navEnd !== -1 && offset > navEnd;
      if (esLcp) {
        lcpAsignado = true;
        t = t.replace(/\s*loading="lazy"/g, "");
        if (!/fetchpriority=/.test(t)) t = t.replace(/<img\b/, '<img fetchpriority="high"');
      } else if (
        !/\bloading=/.test(t) &&
        !/\sdata-src=/.test(t) && // las gestiona v2.js: no necesitan lazy
        !EAGER_HINTS.some((r) => r.test(t))
      ) {
        t = t.replace(/<img\b/, '<img loading="lazy"');
        lazied++;
      }

      // decoding="async" exactamente una vez.
      if (!/decoding=/.test(t)) t = t.replace(/<img\b/, '<img decoding="async"');
      const n = (t.match(/decoding="async"/g) ?? []).length;
      if (n > 1) t = t.replace(/\s*decoding="async"/g, "").replace(/<img\b/, '<img decoding="async"');

      return t.replace(/\s+/g, " ");
    });

    if (out !== src) { await writeFile(p, out); totalFiles++; totalLazy += lazied; }
  }
  console.log(`loading="lazy" añadido a ${totalLazy} <img> en ${totalFiles} páginas.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
