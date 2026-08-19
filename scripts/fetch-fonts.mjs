/**
 * Self-hosting de tipografías — HOMEA
 *
 * Antes: tokens-v2.css hacía `@import url(fonts.googleapis.com…)` para Newsreader
 * y cargaba Montserrat como 18 archivos .ttf (5.8 MB). El @import es una cadena
 * de bloqueo (CSS → CSS → font) contra un tercer dominio: con internet lento la
 * página se quedaba en blanco varios segundos antes de pintar.
 *
 * Ahora: fuentes variables .woff2 servidas desde nuestro propio dominio, subsets
 * latin + latin-ext (lo que necesita el español). Un archivo por familia/estilo.
 *
 * Uso:  node scripts/fetch-fonts.mjs
 */
import { writeFile, readFile, mkdir } from "node:fs/promises";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const OUT = "public/fonts";

// Solo los subsets que usa el sitio: latin y latin-ext (acentos y ñ del español).
const KEEP = [
  "U+0000-00FF", // latin
  "U+0100-02BA", // latin-ext
];

/* Los ejes de la fuente variable se piden por separado para roman e itálica.
 *
 * Newsreader tiene eje `opsz` (tamaño óptico): el navegador lo ajusta solo al
 * tamaño de cada texto. Fijarlo abarataría el archivo a menos de la mitad, pero
 * se probó y a 34 px (los h2) el trazo sale visiblemente más ancho y pesado.
 * Decisión de Carla (2026-08-19): la tipografía no se toca aunque cueste bytes.
 * NO cambiar `6..72` por un valor fijo sin volver a comparar en pantalla. */
const FAMILIES = [
  {
    family: "Montserrat",
    weight: "100 900",
    roman: "Montserrat:wght@100..900",
    italic: "Montserrat:ital,wght@1,100..900",
  },
  {
    family: "Newsreader",
    weight: "300 700",
    roman: "Newsreader:opsz,wght@6..72,300..700",
    italic: "Newsreader:ital,opsz,wght@1,6..72,300..700",
  },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const blocks = [];

  for (const f of FAMILIES) {
    for (const estilo of ["roman", "italic"]) {
      const url = `https://fonts.googleapis.com/css2?family=${f[estilo]}&display=swap`;
      const css = await (await fetch(url, { headers: { "User-Agent": UA } })).text();

      for (const m of css.matchAll(/@font-face\s*\{([^}]+)\}/g)) {
        const body = m[1];
        const style = /font-style:\s*italic/.test(body) ? "italic" : "normal";
        if ((estilo === "italic") !== (style === "italic")) continue;
        const range = body.match(/unicode-range:\s*([^;]+);/)?.[1] ?? "";
        const src = body.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1];
        if (!src) continue;
        if (!KEEP.some((k) => range.startsWith(k))) continue; // fuera cirílico, griego, vietnamita

        const subset = range.startsWith("U+0000-00FF") ? "latin" : "latin-ext";
        const name = `${f.family}-${style === "italic" ? "Italic" : "Roman"}-${subset}.woff2`;
        const buf = Buffer.from(await (await fetch(src, { headers: { "User-Agent": UA } })).arrayBuffer());
        await writeFile(`${OUT}/${name}`, buf);
        console.log(`  ${(buf.length / 1024).toFixed(0).padStart(4)} KB  ${name}`);

        blocks.push(
          `@font-face {\n` +
            `  font-family: "${f.family}";\n` +
            `  font-style: ${style};\n` +
            `  font-weight: ${f.weight};\n` +
            `  font-display: swap;\n` +
            `  src: url("/fonts/${name}") format("woff2");\n` +
            `  unicode-range: ${range};\n}`
        );
      }
    }
  }

  const generado = `${blocks.join("\n\n")}\n`;
  await writeFile("styles/fonts.css", `/* Generado por scripts/fetch-fonts.mjs — no editar a mano. */\n\n${generado}`);

  /* Los @font-face viven dentro de tokens-v2.css (la hoja que cargan tanto Next
     como el preview estático). Se reemplaza el bloque entre marcas para que
     volver a correr este script no deje las dos copias desincronizadas. */
  const INICIO = "/* ---------- Fonts:";
  const FIN = "/* ---------- Tokens";
  for (const hoja of ["styles/tokens-v2.css", "preview/tokens-v2.css"]) {
    const css = await readFile(hoja, "utf8");
    const a = css.indexOf(INICIO);
    const b = css.indexOf(FIN);
    if (a === -1 || b === -1 || b < a) {
      console.warn(`  ⚠️  no encuentro el bloque de fuentes en ${hoja}, se deja igual`);
      continue;
    }
    const cabecera =
      "/* ---------- Fonts: self-hosted variable woff2 (Montserrat + Newsreader) ----\n" +
      "   Generado por scripts/fetch-fonts.mjs. Antes: @import a Google Fonts + 18\n" +
      "   .ttf (5.8 MB) — cadena de bloqueo que dejaba la página en blanco con\n" +
      "   internet lento. Ahora: archivos de 35–129 KB desde nuestro dominio. */\n";
    await writeFile(hoja, css.slice(0, a) + cabecera + generado + "\n" + css.slice(b));
    console.log(`  ${hoja} actualizado.`);
  }
  console.log(`\n${blocks.length} @font-face escritos.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
