import "server-only";

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Agrega `?v=<huella>` a una ruta de public/ según el contenido del archivo.
 *
 * public/assets se sirve con un día de caché + una semana de
 * stale-while-revalidate (next.config.ts). Si se reemplaza un archivo con el
 * mismo nombre (p. ej. el logo de ficha de Viking, azul → placa negra,
 * 2026-11-18), el navegador seguía mostrando la copia vieja. Con la huella,
 * cada versión del archivo tiene su propia URL y el cambio se ve al instante.
 */
const cache = new Map<string, string>();
export function conVersion(ruta: string): string {
  const hit = cache.get(ruta);
  if (hit) return hit;
  let out = ruta;
  try {
    const h = createHash("md5").update(readFileSync(join(process.cwd(), "public", ruta))).digest("hex").slice(0, 8);
    out = `${ruta}?v=${h}`;
  } catch {
    /* sin archivo: se deja la ruta tal cual */
  }
  cache.set(ruta, out);
  return out;
}
