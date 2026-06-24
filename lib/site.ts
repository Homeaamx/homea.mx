// Config global del sitio.
export const SITE_URL = "https://www.homea.mx";
export const SITE_NAME = "HOMEA";

/** URL absoluta a partir de una ruta interna ("/guias/..."). */
export function absUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
