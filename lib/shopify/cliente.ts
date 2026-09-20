// cliente.ts — única puerta de entrada a la Storefront API de Shopify.
//
// Server-only a propósito: el token privado no puede viajar al navegador.
//
// Doctrina de errores: **nunca lanza al azar**. Clasifica el fallo en un tipo
// (`ErrorShopify.clase`) y quien llama decide el plan B — índice offline, HTML
// estático del preview o carrito de desarrollo. Así el sitio sigue en pie aunque
// Shopify esté caído, con candado o a medio migrar, que es el estado de HOY:
//
//   POST https://homeashop.mx/api/2026-07/graphql.json   (sin token)
//   → {"errors":[{"message":"Online Store channel is locked"}]}
//
// El acceso tokenless de Shopify cubre productos, colecciones, búsqueda y carrito,
// pero está atado al canal Online Store: con la tienda protegida por contraseña
// queda bloqueado. Por eso el token del canal **Headless** no es opcional para
// tener datos vivos (ver docs/DEPLOY.md §3).

import "server-only";

/** Nombres de variables según docs/DEPLOY.md §3. */
export const DOMINIO = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_API_TOKEN;
/** Shopify sostiene cada versión 12 meses; subirla es un cambio consciente. */
export const VERSION_API = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-07";

export const HAY_TOKEN = Boolean(TOKEN);

/** Una consulta lenta no puede bloquear el render de una página del sitio. */
const TIMEOUT_MS = 1500;

export type ClaseError =
  /** Falta dominio o token: aún no se configura el canal Headless. */
  | "sin-configurar"
  /** "Online Store channel is locked" — la tienda tiene contraseña. */
  | "tienda-bloqueada"
  /** Token inválido, caducado o de un canal equivocado. */
  | "token-invalido"
  /** Red, timeout, 5xx o throttling. */
  | "red"
  /** La consulta llegó pero Shopify la rechazó (campo inexistente, permiso). */
  | "consulta";

export class ErrorShopify extends Error {
  constructor(
    readonly clase: ClaseError,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = "ErrorShopify";
  }
}

/** Avisos una sola vez por proceso: si no, cada tecla del buscador ensucia el log. */
const avisado = new Set<string>();
function avisar(clave: string, mensaje: string): void {
  if (avisado.has(clave)) return;
  avisado.add(clave);
  console.warn(`[shopify] ${mensaje}`);
}

export interface OpcionesFetch {
  variables?: Record<string, unknown>;
  /** Tags del Data Cache de Next para revalidación on-demand (webhook). */
  tags?: string[];
  /** Segundos de vida en caché. `0` → sin caché (todo lo del carrito). */
  revalidate?: number;
}

/**
 * Ejecuta una operación GraphQL contra la Storefront API.
 * Lanza `ErrorShopify` clasificado; no devuelve nunca datos a medias.
 */
export async function shopifyFetch<T>(
  query: string,
  { variables, tags, revalidate = 3600 }: OpcionesFetch = {},
): Promise<T> {
  if (!DOMINIO || !TOKEN) {
    throw new ErrorShopify(
      "sin-configurar",
      "Falta NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN o SHOPIFY_STOREFRONT_API_TOKEN (docs/DEPLOY.md §3).",
    );
  }

  let respuesta: Response;
  try {
    // Next 16 no cachea `fetch` por defecto: la caché se pide explícitamente.
    respuesta = await fetch(`https://${DOMINIO}/api/${VERSION_API}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": TOKEN,
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...(revalidate > 0
        ? { cache: "force-cache" as const, next: { revalidate, tags } }
        : { cache: "no-store" as const }),
    });
  } catch (error) {
    const causa = error instanceof Error ? error.message : String(error);
    throw new ErrorShopify("red", `Sin respuesta de Shopify: ${causa}`);
  }

  if (respuesta.status === 401 || respuesta.status === 403) {
    throw new ErrorShopify("token-invalido", `Shopify rechazó el token (HTTP ${respuesta.status}).`);
  }
  if (!respuesta.ok && respuesta.status !== 400) {
    throw new ErrorShopify("red", `Shopify respondió HTTP ${respuesta.status}.`);
  }

  const json = (await respuesta.json()) as {
    data?: T;
    errors?: { message: string; extensions?: { code?: string } }[];
  };

  if (json.errors?.length) {
    const mensaje = json.errors.map((e) => e.message).join(" · ");
    const codigo = json.errors[0].extensions?.code;
    // El caso más probable hoy: la tienda con contraseña rechaza toda consulta.
    if (/channel is locked/i.test(mensaje)) {
      avisar("bloqueada", `${mensaje}. Quitar la contraseña de la tienda o usar el canal Headless.`);
      throw new ErrorShopify("tienda-bloqueada", mensaje);
    }
    if (codigo === "UNAUTHORIZED") {
      avisar("token", "Token de Storefront inválido o de un canal equivocado.");
      throw new ErrorShopify("token-invalido", mensaje || "UNAUTHORIZED");
    }
    throw new ErrorShopify("consulta", mensaje);
  }

  if (!json.data) throw new ErrorShopify("consulta", "Shopify respondió sin datos.");
  return json.data;
}

/**
 * Variante tolerante: devuelve `null` en vez de lanzar. Para las lecturas donde
 * siempre hay plan B (ficha con el HTML estático, buscador con el índice local).
 */
export async function shopifyFetchOpcional<T>(
  query: string,
  opciones: OpcionesFetch = {},
): Promise<T | null> {
  try {
    return await shopifyFetch<T>(query, opciones);
  } catch (error) {
    if (error instanceof ErrorShopify) {
      avisar(`opcional-${error.clase}`, `${error.message} — se usan los datos locales.`);
      return null;
    }
    throw error;
  }
}
