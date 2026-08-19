/**
 * Optimizador de imágenes editoriales — HOMEA
 *
 * Problema que resuelve: las páginas se servían con 8–13 MB de imágenes crudas
 * (JPG/PNG sin comprimir) porque el markup del preview usa <img src> directo y
 * no pasa por next/image. Con internet lento la página no terminaba de cargar.
 *
 * Qué hace:
 *   1. Recorre public/assets y preview/assets.
 *   2. Reescala al ancho máximo útil y reencoda a WebP.
 *   3. Reescribe TODAS las referencias (.html, .css, .js, .ts/.tsx, .json).
 *   4. Borra el original solo si ya no queda ninguna referencia.
 *
 * Uso:  node scripts/optimize-images.mjs [--dry]
 *
 * Nota: es idempotente. Correrlo de nuevo tras añadir fotos nuevas es seguro.
 */
import sharp from "sharp";
import { readdir, readFile, writeFile, stat, unlink } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";

sharp.cache(false);
sharp.concurrency(1);

const ROOT = process.cwd();
const DRY = process.argv.includes("--dry");

// Carpetas de imágenes a optimizar.
const IMAGE_DIRS = ["public/assets"];
// preview/assets es una copia espejo de public/assets: se sincroniza al final.
const MIRROR_ROOTS = ["public", "preview"];
// Archivos donde pueden vivir referencias a esas imágenes.
const CODE_DIRS = ["preview", "public", "styles", "app", "components", "lib", "data"];
const CODE_EXT = new Set([".html", ".css", ".js", ".mjs", ".jsx", ".ts", ".tsx", ".json"]);

const SRC_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
// Por debajo de esto el reencode no compensa (y los iconos ya son mínimos).
const MIN_BYTES = 15 * 1024;

/** Ancho máximo según el uso real de la imagen en el diseño.
 *  Servir 1400 px para pintar 90 px (los logos lo hacían) es ancho de banda
 *  tirado: en móvil con red lenta esos bytes retrasan el hero. */
function maxWidthFor(rel) {
  const p = rel.toLowerCase();

  // Marcas de identidad y avatares: se pintan entre 44 y 110 px.
  if (/\/logos\/|\/reviews\/|\/clients\/|wordmark|black_logo_homea|logo-/.test(p)) return 400;

  // Fondos CSS: no admiten srcset, así que se capan al mayor uso real.
  // Chips del carrusel y tiles de /marcas ≈ 294–400 px de ancho pintado.
  if (/\/photos\/brands\//.test(p)) return 700;
  // Mosaicos de categoría y tiles de subcategoría ≈ 400 px.
  if (/\/photos\/cat-|\/photos\/subcat/.test(p)) return 800;

  // Imágenes a sangre completa: son las que llevan srcset (ver responsive-images.mjs),
  // así que este es el tope de la variante mayor, no lo que recibe un móvil.
  if (/\/hero-|\bhero-|\/projects\/|marcas-/.test(p)) return 2000;

  return 1400; // packshots, fichas y tarjetas
}

/** Calidad: la alfa (packshots recortados) necesita un poco más para bordes limpios. */
const Q_OPAQUE = 72;
const Q_ALPHA = 80;

async function walk(dir, out = []) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else out.push(full);
  }
  return out;
}

async function main() {
  // ---------- 1. Convertir ----------
  const files = (await Promise.all(IMAGE_DIRS.map((d) => walk(path.join(ROOT, d))))).flat();
  const targets = [];
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    if (!SRC_EXT.has(ext)) continue;
    if (/-\d{3,4}\.webp$/i.test(f)) continue; // variante de srcset, no original
    const s = await stat(f);
    if (s.size < MIN_BYTES) continue; // incluye los de 0 bytes
    targets.push({ file: f, size: s.size, ext });
  }

  let before = 0, after = 0, converted = 0, skipped = 0;
  const renames = new Map(); // "assets/x.png" -> "assets/x.webp"

  const CONC = Math.min(4, Math.max(2, (os.cpus()?.length || 4) - 2));
  let cursor = 0;
  const fallidos = [];
  async function worker() {
   while (cursor < targets.length) {
    const t = targets[cursor++];
    try {
    const rel = path.relative(ROOT, t.file);
    const out = t.file.replace(/\.(jpe?g|png|webp)$/i, ".webp");
    let img = sharp(t.file, { animated: false });
    const meta = await img.metadata();
    const cap = maxWidthFor(rel);

    // Un .webp que ya cabe en su ancho útil se deja intacto. Reencodearlo en cada
    // corrida lo pasaría por otra generación con pérdida y degradaría la foto.
    if (t.ext === ".webp" && (!meta.width || meta.width <= cap)) { skipped++; continue; }

    if (meta.width && meta.width > cap) img = img.resize({ width: cap, withoutEnlargement: true });

    const buf = await img
      .webp({ quality: meta.hasAlpha ? Q_ALPHA : Q_OPAQUE, effort: 4 })
      .toBuffer();

    // Si el WebP no mejora al original, se deja tal cual.
    if (buf.length >= t.size && t.ext === ".webp") { skipped++; continue; }
    if (buf.length >= t.size && t.ext !== ".webp") { skipped++; continue; }

    before += t.size;
    after += buf.length;
    converted++;
    if (!DRY) await writeFile(out, buf);

    if (t.ext !== ".webp") {
      // Referencias sin la carpeta raíz: "assets/..." y "/assets/..." aparecen en el código.
      const fromRel = rel.replace(/^public\/|^preview\//, "");
      renames.set(fromRel, fromRel.replace(/\.(jpe?g|png)$/i, ".webp"));
    }
    } catch (err) {
      fallidos.push(`${path.relative(ROOT, t.file)} — ${err.message.split("\n")[0]}`);
    }
   }
  }
  await Promise.all(Array.from({ length: CONC }, worker));

  console.log(
    `Imágenes: ${converted} convertidas, ${skipped} sin cambio · ` +
      `${(before / 1e6).toFixed(1)} MB → ${(after / 1e6).toFixed(1)} MB ` +
      `(−${(100 - (after / before) * 100).toFixed(0)}%)`
  );
  if (fallidos.length) {
    console.warn(`\n⚠️  ${fallidos.length} archivo(s) ilegibles, se dejaron como estaban:`);
    for (const f of fallidos) console.warn(`   ${f}`);
  }
  if (DRY) return;

  // ---------- 2. Reescribir referencias ----------
  const codeFiles = (await Promise.all(CODE_DIRS.map((d) => walk(path.join(ROOT, d)))))
    .flat()
    .filter((f) => CODE_EXT.has(path.extname(f).toLowerCase()))
    .filter((f) => !f.includes("/assets/"));

  let touched = 0;
  for (const f of codeFiles) {
    let src = await readFile(f, "utf8");
    if (!src.includes("assets/")) continue; // atajo: la mayoría de archivos no tocan imágenes
    const orig = src;
    for (const [from, to] of renames) {
      if (src.includes(from)) src = src.split(from).join(to);
    }
    if (src !== orig) { await writeFile(f, src); touched++; }
  }
  console.log(`Referencias reescritas en ${touched} archivos.`);

  // ---------- 2.b Espejo public/assets → preview/assets ----------
  // El preview navegable usa su propia copia; si no se sincroniza, queda apuntando
  // a .webp que allí no existen y las imágenes se rompen al abrir preview/*.html.
  await new Promise((res, rej) =>
    execFile("rsync", ["-a", "--delete", "public/assets/", "preview/assets/"], (e) => (e ? rej(e) : res()))
  );
  console.log("preview/assets sincronizado con public/assets.");

  // ---------- 3. Borrar originales ya sin referencias ----------
  const all = (await Promise.all(codeFiles.map((f) => readFile(f, "utf8")))).join("\n");
  let removed = 0, kept = 0;
  for (const from of renames.keys()) {
    if (all.includes(from)) { kept++; console.warn(`  ⚠️  aún referenciado, se conserva: ${from}`); continue; }
    for (const base of MIRROR_ROOTS) {
      const p = path.join(ROOT, base, from);
      try { await unlink(p); removed++; } catch {}
    }
  }
  console.log(`Originales eliminados: ${removed} (conservados por referencia viva: ${kept}).`);

  // ---------- 4. Integridad ----------
  // Si el proceso muere a media escritura (pasó con SIGBUS) queda un archivo de
  // 0 bytes que el navegador sirve con 200 pero no puede decodificar: la imagen
  // simplemente no aparece y nada lo delata. Se revisa al terminar.
  const truncados = [];
  for (const f of await walk(path.join(ROOT, "public/assets"))) {
    if (!/\.(webp|avif|jpe?g|png)$/i.test(f)) continue;
    if ((await stat(f)).size === 0) truncados.push(path.relative(ROOT, f));
  }
  if (truncados.length) {
    console.error(`\n❌ ${truncados.length} archivo(s) quedaron vacíos — recupéralos con git y vuelve a correr:`);
    for (const f of truncados) console.error(`   ${f}`);
    process.exitCode = 1;
  } else {
    console.log("Integridad: ningún archivo vacío.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
