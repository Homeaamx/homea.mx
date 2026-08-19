/**
 * Dimensiones intrínsecas en los <img> — HOMEA
 *
 * Sin width/height el navegador no sabe cuánto espacio reservar: la página se
 * pinta colapsada, todo lo de abajo sube, y luego salta cuando llegan las
 * imágenes (eso es CLS, una de las Core Web Vitals).
 *
 * Efecto secundario que sí se medía: con el documento colapsado, la marquesina
 * de marcas quedaba a pocos cientos de píxeles del viewport, así que el
 * navegador daba por buenas sus imágenes lazy y las descargaba a la vez que el
 * hero. Con las dimensiones declaradas se quedan donde les toca.
 *
 * Se escriben los píxeles reales del archivo; el CSS sigue mandando sobre el
 * tamaño pintado (los atributos solo aportan la proporción).
 *
 * Uso:  node scripts/img-dimensiones.mjs   (idempotente)
 */
import sharp from "sharp";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

sharp.cache(false);
sharp.concurrency(1);

const medidas = new Map();
async function medir(rel) {
  if (medidas.has(rel)) return medidas.get(rel);
  let v = null;
  try {
    const m = await sharp(path.join("public", rel)).metadata();
    if (m.width && m.height) v = { w: m.width, h: m.height };
  } catch { /* falta el archivo: se deja el tag como está */ }
  medidas.set(rel, v);
  return v;
}

async function main() {
  const files = (await readdir("preview")).filter((f) => f.endsWith(".html"));
  let tocados = 0, puestos = 0, sinArchivo = 0;

  for (const f of files) {
    const p = path.join("preview", f);
    const html = await readFile(p, "utf8");
    const tags = html.match(/<img\b[^>]*>/g) ?? [];
    let out = html;

    for (const tag of tags) {
      if (/\swidth=/.test(tag) || /\sheight=/.test(tag)) continue;
      const src = tag.match(/\ssrc="([^"]+)"/)?.[1] ?? tag.match(/\sdata-src="([^"]+)"/)?.[1];
      if (!src || src.startsWith("data:") || !src.includes("assets/")) continue;
      const dim = await medir(src.replace(/^\/?/, ""));
      if (!dim) { sinArchivo++; continue; }
      const nuevo = tag.replace(/<img\b/, `<img width="${dim.w}" height="${dim.h}"`);
      out = out.split(tag).join(nuevo);
      puestos++;
    }
    if (out !== html) { await writeFile(p, out); tocados++; }
  }
  console.log(`width/height añadidos a ${puestos} <img> en ${tocados} páginas.`);
  if (sinArchivo) console.log(`  (${sinArchivo} sin archivo en disco, se dejaron igual)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
