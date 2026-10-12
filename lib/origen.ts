import "server-only";

import { headers } from "next/headers";

import { SITE_URL } from "@/lib/site";

/**
 * Origen para ligas que se comparten (WhatsApp): el host que atendió la petición
 * mientras homea.mx siga en OXATIS (localhost, *.vercel.app); en cualquier otro
 * caso el dominio canónico. Solo para páginas dinámicas: leer headers() vuelve
 * dinámica la ruta.
 */
export async function origenPublico(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return `http://${host}`;
  if (/\.vercel\.app$/.test(host)) return `https://${host}`;
  return SITE_URL;
}
