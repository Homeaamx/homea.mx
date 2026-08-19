/**
 * Imágenes responsivas — HOMEA
 *
 * Sin srcset el navegador descarga siempre el archivo mayor: el hero de la home
 * son 2000 px y en un móvil se pinta a 375. Se pagaban ~115 KB para usar ~35 KB.
 *
 * Este script genera variantes por ancho junto al original (`hero-x-640.webp`) y
 * añade `srcset` + `sizes` a los <img> del markup del preview. El navegador elige
 * según pantalla y densidad; en escritorio sigue recibiendo la grande.
 *
 * Los logos, avatares y fondos CSS no entran aquí: no admiten srcset (los fondos)
 * o son tan pequeños que no compensa. Esos se controlan con el tope por rol de
 * scripts/optimize-images.mjs.
 *
 * Uso:  node scripts/responsive-images.mjs   (idempotente)
 */
import sharp from "sharp";
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

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

sharp.cache(false);
sharp.concurrency(1);

const ANCHOS = [400, 640, 960, 1280, 1600];
const MIN_ORIGEN = 500; // por debajo de esto el original ya es razonable

// Roles que NO llevan srcset: se pintan pequeños y fijos.
const SIN_SRCSET = /\/logos\/|\/reviews\/|\/clients\/|wordmark|black_logo_homea|logo-|\.svg$/i;
// Roles a sangre completa: ocupan el ancho del viewport.
const SANGRE = /\/hero-|\bhero-|\/projects\/|marcas-/i;

// Rejilla del sitio: una columna en móvil, dos en tableta, tres en escritorio.
const SIZES_REJILLA = "(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 34vw";

async function main() {
  const files = (await readdir("preview")).filter((f) => f.endsWith(".html"));

  // ---------- 1. Qué imágenes aparecen en un <img> ----------
  const usadas = new Map(); // ruta relativa -> "sangre" | "rejilla"
  const anotar = (src) => {
    if (!src || !src.includes("assets/")) return;
    if (SIN_SRCSET.test(src)) return;
    const rel = src.replace(/^\/?/, "");
    usadas.set(rel, SANGRE.test(rel) ? "sangre" : "rejilla");
  };

  for (const f of files) {
    const html = await readFile(path.join("preview", f), "utf8");
    for (const tag of html.match(/<img\b[^>]*>/g) ?? []) {
      anotar(tag.match(/\ssrc="([^"]+)"/)?.[1] ?? tag.match(/\sdata-src="([^"]+)"/)?.[1]);
    }
  }

  /* Parte del catálogo de imágenes no vive en el markup del preview sino en
     código React (lib/fotosTipos.ts, las páginas de PLP, AprendeCampanas…).
     Sin esto esas páginas seguían sirviendo el archivo grande en móvil. */
  for (const dir of ["lib", "app", "components", "data"]) {
    for (const f of await walk(dir)) {
      if (!/\.(tsx?|jsx?|json)$/.test(f)) continue;
      const txt = await readFile(f, "utf8");
      for (const m of txt.matchAll(/["'`](\/?assets\/[^"'`\s]+\.(?:webp|jpe?g|png))["'`]/g)) anotar(m[1]);
    }
  }

  // ---------- 2. Generar las variantes que falten ----------
  const variantes = new Map(); // ruta -> [{w, archivo}]
  let creadas = 0, bytes = 0;
  const lista = [...usadas.keys()];
  let cursor = 0;

  async function worker() {
    while (cursor < lista.length) {
      const rel = lista[cursor++];
      const origen = path.join("public", rel);
      let meta;
      try { meta = await sharp(origen).metadata(); } catch { continue; }
      if (!meta.width || meta.width < MIN_ORIGEN) continue;

      const hechas = [];
      for (const w of ANCHOS) {
        if (w >= meta.width) continue;
        const destino = origen.replace(/\.webp$/i, `-${w}.webp`);
        hechas.push({ w, archivo: path.basename(destino) });
        try { await stat(destino); continue; } catch { /* no existe: se crea */ }
        const buf = await sharp(origen)
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: meta.hasAlpha ? 80 : 72, effort: 4 })
          .toBuffer();
        await writeFile(destino, buf);
        creadas++; bytes += buf.length;
      }
      hechas.push({ w: meta.width, archivo: path.basename(origen) });
      variantes.set(rel, hechas);
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  console.log(`Variantes creadas: ${creadas} (${(bytes / 1e6).toFixed(1)} MB) para ${variantes.size} imágenes.`);

  // ---------- 3. Añadir srcset + sizes al markup ----------
  let tocados = 0, etiquetas = 0;
  for (const f of files) {
    const p = path.join("preview", f);
    const html = await readFile(p, "utf8");
    const out = html.replace(/<img\b[^>]*>/g, (tag) => {
      if (/\ssrcset=/.test(tag)) return tag; // ya lo tiene
      const attr = /\ssrc="/.test(tag) ? "src" : "data-src";
      const src = tag.match(new RegExp(`\\s${attr}="([^"]+)"`))?.[1];
      if (!src) return tag;
      const rel = src.replace(/^\/?/, "");
      const v = variantes.get(rel);
      if (!v || v.length < 2) return tag;

      const dir = path.posix.dirname(src);
      const set = v.map((x) => `${dir}/${x.archivo} ${x.w}w`).join(", ");
      const sizes = usadas.get(rel) === "sangre" ? "100vw" : SIZES_REJILLA;
      // Las diapositivas diferidas del hero usan data-srcset: v2.js lo copia al hidratar.
      const nombre = attr === "src" ? "srcset" : "data-srcset";
      etiquetas++;
      return tag.replace(/<img\b/, `<img ${nombre}="${set}" sizes="${sizes}"`);
    });
    if (out !== html) { await writeFile(p, out); tocados++; }
  }
  console.log(`srcset añadido a ${etiquetas} <img> en ${tocados} páginas.`);

  /* Manifiesto para el código React: los <img> de TSX no se pueden reescribir a
     mano, así que lib/imagenResponsiva.ts lee de aquí los anchos disponibles. */
  const manifiesto = {};
  for (const [rel, v] of variantes) manifiesto["/" + rel] = v.map((x) => x.w).sort((a, b) => a - b);
  await writeFile("data/variantes-imagenes.json", JSON.stringify(manifiesto, null, 1) + "\n");
  console.log(`data/variantes-imagenes.json: ${Object.keys(manifiesto).length} imágenes.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
